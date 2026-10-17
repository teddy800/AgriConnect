import { Router } from 'express';
import { z } from 'zod';
import { q } from '../db.js';
import { auth, role } from '../middleware/auth.js';
import { broadcastNewListing } from '../websocket/socketServer.js';
import { indexListing } from '../utils/elasticsearch.js';
import { invalidateResource } from '../utils/cache.js';
import logger from '../utils/logger.js';

const r = Router();

// Public marketplace search
r.get('/', async (req, res) => {
  const { crop_id, region_id, max_price, search } = req.query;
  const rows = await q(
    `SELECT l.*, c.name_en AS crop, rg.name AS region, u.full_name AS farmer, u.is_verified
     FROM listings l
     JOIN crops c ON c.id=l.crop_id
     JOIN regions rg ON rg.id=l.region_id
     JOIN users u ON u.id=l.farmer_id
     WHERE l.status='active'
       AND ($1::int IS NULL OR l.crop_id=$1)
       AND ($2::int IS NULL OR l.region_id=$2)
       AND ($3::numeric IS NULL OR l.price_per_unit<=$3)
       AND ($4::text IS NULL OR l.title ILIKE '%'||$4||'%' OR c.name_en ILIKE '%'||$4||'%')
     ORDER BY l.created_at DESC LIMIT 200`,
    [crop_id || null, region_id || null, max_price || null, search || null]
  );
  res.json(rows);
});

// Farmer's own listings (must stay above /:id)
r.get('/mine', auth, role('farmer'), async (req, res) =>
  res.json(await q(
    `SELECT l.*, c.name_en AS crop, rg.name AS region,
            (SELECT COUNT(*) FROM inquiries WHERE listing_id=l.id)::int AS inquiry_count
     FROM listings l
     JOIN crops c ON c.id=l.crop_id
     JOIN regions rg ON rg.id=l.region_id
     WHERE l.farmer_id=$1 AND l.status<>'removed'
     ORDER BY l.created_at DESC`, [req.user.id])));

// One listing, with the market average so the page can say if the price is fair
r.get('/:id([0-9a-fA-F-]{36})', auth, async (req, res) => {
  const [l] = await q(
    `SELECT l.*, c.name_en AS crop, rg.name AS region,
            u.full_name AS farmer, u.phone AS farmer_phone, u.is_verified
     FROM listings l
     JOIN crops c ON c.id=l.crop_id
     JOIN regions rg ON rg.id=l.region_id
     JOIN users u ON u.id=l.farmer_id
     WHERE l.id=$1 AND l.status<>'removed'`, [req.params.id]);
  if (!l) return res.status(404).json({ error: 'Listing not found.' });

  const [m] = await q(
    `SELECT ROUND(AVG(price))::int AS avg FROM (
       SELECT DISTINCT ON (market_id) price FROM market_prices
       WHERE crop_id=$1 AND unit='quintal' ORDER BY market_id, recorded_on DESC) t`, [l.crop_id]);
  res.json({ ...l, market_avg: m?.avg ?? null });
});

r.post('/', auth, role('farmer'), async (req, res) => {
  const p = z.object({
    crop_id: z.number().int(),
    title: z.string().min(3),
    description: z.string().optional(),
    quantity: z.number().positive(),
    unit: z.enum(['kg', 'quintal', 'ton', 'piece']),
    price_per_unit: z.number().positive(),
    region_id: z.number().int(),
    location_detail: z.string().optional(),
    harvest_date: z.string().optional(),
    image_urls: z.array(z.string()).max(3).default([])
  }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });

  const d = p.data;
  const [l] = await q(
    `INSERT INTO listings(farmer_id,crop_id,title,description,quantity,unit,price_per_unit,region_id,location_detail,harvest_date,image_urls)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [req.user.id, d.crop_id, d.title, d.description, d.quantity, d.unit,
     d.price_per_unit, d.region_id, d.location_detail, d.harvest_date || null, d.image_urls]
  );

  // Get full listing details with joins
  const [fullListing] = await q(
    `SELECT l.*, c.name_en AS crop, rg.name AS region, u.full_name AS farmer
     FROM listings l
     JOIN crops c ON c.id=l.crop_id
     JOIN regions rg ON rg.id=l.region_id
     JOIN users u ON u.id=l.farmer_id
     WHERE l.id=$1`, [l.id]
  );

  // Broadcast via WebSocket
  const io = req.app.get('io');
  if (io) {
    broadcastNewListing(io, fullListing);
  }

  // Index in Elasticsearch
  indexListing(fullListing).catch(err => 
    logger.error('Failed to index listing', { error: err.message })
  );

  // Invalidate cache
  invalidateResource('listings', l.id).catch(err =>
    logger.error('Failed to invalidate cache', { error: err.message })
  );

  res.status(201).json(l);
});

r.put('/:id', auth, role('farmer'), async (req, res) => {
  const p = z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    quantity: z.number().positive().optional(),
    price_per_unit: z.number().positive().optional()
  }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });

  const d = p.data;
  const [l] = await q(
    `UPDATE listings SET title=COALESCE($1,title), description=COALESCE($2,description),
       quantity=COALESCE($3,quantity), price_per_unit=COALESCE($4,price_per_unit), updated_at=NOW()
     WHERE id=$5 AND farmer_id=$6 RETURNING *`,
    [d.title ?? null, d.description ?? null, d.quantity ?? null, d.price_per_unit ?? null, req.params.id, req.user.id]);
  l ? res.json(l) : res.status(404).json({ error: 'Listing not found.' });
});

r.patch('/:id/status', auth, role('farmer'), async (req, res) => {
  const { status } = req.body;
  if (!['active', 'sold', 'removed'].includes(status))
    return res.status(400).json({ error: 'Invalid status.' });
  const [l] = await q(
    'UPDATE listings SET status=$1, updated_at=NOW() WHERE id=$2 AND farmer_id=$3 RETURNING *',
    [status, req.params.id, req.user.id]);

  if (l) {
    // Invalidate cache
    invalidateResource('listings', l.id).catch(err =>
      logger.error('Failed to invalidate cache', { error: err.message })
    );
  }

  l ? res.json(l) : res.status(404).json({ error: 'Listing not found.' });
});

export default r;