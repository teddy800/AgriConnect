import { Router } from 'express';
import { q } from '../db.js';
import { auth, role } from '../middleware/auth.js';
import { broadcastPriceUpdate } from '../websocket/socketServer.js';
import { invalidateResource, get, set, CACHE_TTL } from '../utils/cache.js';
import logger from '../utils/logger.js';

const r = Router();

// All markets, one crop, daily prices (for the multi-line chart)
r.get('/series', async (req, res) => {
  const { crop_id, days = 7 } = req.query;
  if (!crop_id) return res.status(400).json({ error: 'crop_id is required.' });
  
  // Cache key
  const cacheKey = `prices:series:${crop_id}:${days}`;
  const cached = await get(cacheKey);
  if (cached) return res.json(cached);

  const rows = await q(
    `SELECT mp.recorded_on::text AS date, m.name AS market, mp.price::float AS price
     FROM market_prices mp JOIN markets m ON m.id=mp.market_id
     WHERE mp.crop_id=$1 AND mp.recorded_on >= CURRENT_DATE-$2::int
     ORDER BY mp.recorded_on`, [crop_id, days]);
  
  // Cache for 5 minutes
  await set(cacheKey, rows, CACHE_TTL.MEDIUM);
  res.json(rows);
});

// Latest price per market with change versus 7 days earlier
r.get('/table', async (req, res) => {
  const { crop_id } = req.query;
  if (!crop_id) return res.status(400).json({ error: 'crop_id is required.' });
  
  // Cache key
  const cacheKey = `prices:table:${crop_id}`;
  const cached = await get(cacheKey);
  if (cached) return res.json(cached);

  const rows = await q(
    `WITH latest AS (
       SELECT DISTINCT ON (market_id) market_id, price, recorded_on
       FROM market_prices WHERE crop_id=$1 ORDER BY market_id, recorded_on DESC)
     SELECT m.name AS market, l.price::float AS price, l.recorded_on::text AS date,
            CASE WHEN o.price > 0 THEN ROUND((l.price-o.price)/o.price*100, 1)::float END AS change
     FROM latest l
     JOIN markets m ON m.id=l.market_id
     LEFT JOIN LATERAL (
       SELECT price FROM market_prices
       WHERE crop_id=$1 AND market_id=l.market_id AND recorded_on <= l.recorded_on-7
       ORDER BY recorded_on DESC LIMIT 1) o ON TRUE
     ORDER BY l.price DESC`, [crop_id]);
  
  // Cache for 5 minutes
  await set(cacheKey, rows, CACHE_TTL.MEDIUM);
  res.json(rows);
});

// Record a new market price (admin/agronomist only)
r.post('/', auth, role('admin', 'agronomist'), async (req, res) => {
  const { crop_id, market_id, price, unit = 'quintal', recorded_on } = req.body;

  if (!crop_id || !market_id || !price) {
    return res.status(400).json({ error: 'crop_id, market_id, and price are required.' });
  }

  if (price <= 0) {
    return res.status(400).json({ error: 'Price must be greater than 0.' });
  }

  const date = recorded_on || new Date().toISOString().split('T')[0];

  try {
    const [result] = await q(
      `INSERT INTO market_prices(crop_id, market_id, price, unit, recorded_on, recorded_by)
       VALUES($1, $2, $3, $4, $5, $6)
       ON CONFLICT (crop_id, market_id, recorded_on)
       DO UPDATE SET price=$3, unit=$4, recorded_by=$6
       RETURNING *`,
      [crop_id, market_id, price, unit, date, req.user.id]
    );

    // Broadcast via WebSocket
    const io = req.app.get('io');
    if (io) {
      broadcastPriceUpdate(io, result);
    }

    // Invalidate cache for price-related data
    invalidateResource('prices', crop_id).catch(err =>
      logger.error('Failed to invalidate cache', { error: err.message })
    );

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error recording price', { error: error.message });
    res.status(500).json({ error: 'Failed to record price.' });
  }
});

export default r;
