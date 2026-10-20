import { Router } from 'express';
import { q } from '../db.js';

const r = Router();

/**
 * GET /api/crops
 * Get all available crops
 * Returns: Array of crops with id, name_en, name_am, name_om, category
 */
r.get('/crops', async (req, res) => {
  try {
    const crops = await q(
      `SELECT id, name_en, name_am, name_om, category, created_at
       FROM crops
       ORDER BY name_en ASC`
    );
    res.json(crops);
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({ error: 'Failed to fetch crops.' });
  }
});

/**
 * GET /api/crops/:id
 * Get a single crop by ID
 */
r.get('/crops/:id', async (req, res) => {
  try {
    const [crop] = await q(
      `SELECT id, name_en, name_am, name_om, category, created_at
       FROM crops WHERE id=$1`,
      [req.params.id]
    );

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found.' });
    }

    // Get related statistics
    const [stats] = await q(
      `SELECT 
        (SELECT COUNT(*) FROM listings WHERE crop_id=$1 AND status='active')::int AS active_listings,
        (SELECT AVG(price_per_unit) FROM listings WHERE crop_id=$1 AND status='active' AND unit='quintal')::float AS avg_price
       `,
      [req.params.id]
    );

    res.json({ ...crop, ...stats });
  } catch (error) {
    console.error('Error fetching crop:', error);
    res.status(500).json({ error: 'Failed to fetch crop.' });
  }
});

/**
 * GET /api/regions
 * Get all Ethiopian regions
 * Returns: Array of regions with id, name, zone (optional)
 */
r.get('/regions', async (req, res) => {
  try {
    const regions = await q(
      `SELECT id, name, zone, population, area_km2, created_at
       FROM regions
       ORDER BY name ASC`
    );
    res.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Failed to fetch regions.' });
  }
});

/**
 * GET /api/regions/:id
 * Get a single region by ID with statistics
 */
r.get('/regions/:id', async (req, res) => {
  try {
    const [region] = await q(
      'SELECT id, name, zone, population, area_km2, created_at FROM regions WHERE id=$1',
      [req.params.id]
    );

    if (!region) {
      return res.status(404).json({ error: 'Region not found.' });
    }

    // Get regional statistics
    const [stats] = await q(
      `SELECT 
        (SELECT COUNT(*) FROM users WHERE region_id=$1)::int AS total_users,
        (SELECT COUNT(*) FROM users WHERE region_id=$1 AND role='farmer')::int AS farmers,
        (SELECT COUNT(*) FROM users WHERE region_id=$1 AND role='buyer')::int AS buyers,
        (SELECT COUNT(*) FROM listings l JOIN users u ON u.id=l.farmer_id 
         WHERE u.region_id=$1 AND l.status='active')::int AS active_listings
       `,
      [req.params.id]
    );

    res.json({ ...region, ...stats });
  } catch (error) {
    console.error('Error fetching region:', error);
    res.status(500).json({ error: 'Failed to fetch region.' });
  }
});

/**
 * GET /api/markets
 * Get all markets for price tracking
 * Returns: Array of markets with id, name, region_id, location
 */
r.get('/markets', async (req, res) => {
  try {
    const markets = await q(
      `SELECT m.id, m.name, m.region_id, m.location, m.market_type, m.created_at,
              r.name AS region_name
       FROM markets m
       LEFT JOIN regions r ON r.id=m.region_id
       ORDER BY r.name, m.name ASC`
    );
    res.json(markets);
  } catch (error) {
    console.error('Error fetching markets:', error);
    res.status(500).json({ error: 'Failed to fetch markets.' });
  }
});

/**
 * GET /api/markets/:id
 * Get a single market with recent price data
 */
r.get('/markets/:id', async (req, res) => {
  try {
    const [market] = await q(
      `SELECT m.id, m.name, m.region_id, m.location, m.market_type, m.created_at,
              r.name AS region_name
       FROM markets m
       LEFT JOIN regions r ON r.id=m.region_id
       WHERE m.id=$1`,
      [req.params.id]
    );

    if (!market) {
      return res.status(404).json({ error: 'Market not found.' });
    }

    // Get recent prices from this market
    const recentPrices = await q(
      `SELECT mp.crop_id, mp.price, mp.unit, mp.recorded_on,
              c.name_en AS crop_name
       FROM market_prices mp
       JOIN crops c ON c.id=mp.crop_id
       WHERE mp.market_id=$1 AND mp.recorded_on >= CURRENT_DATE - 7
       ORDER BY mp.recorded_on DESC, c.name_en ASC
       LIMIT 50`,
      [req.params.id]
    );

    res.json({ ...market, recent_prices: recentPrices });
  } catch (error) {
    console.error('Error fetching market:', error);
    res.status(500).json({ error: 'Failed to fetch market.' });
  }
});

/**
 * GET /api/units
 * Get available measurement units
 */
r.get('/units', (req, res) => {
  res.json([
    { value: 'kg', label: 'Kilogram', label_am: 'ኪሎግራም', label_om: 'Kiilogaraama' },
    { value: 'quintal', label: 'Quintal', label_am: 'ኩንታል', label_om: 'Kuintaala' },
    { value: 'ton', label: 'Ton', label_am: 'ቶን', label_om: 'Tona' },
    { value: 'piece', label: 'Piece', label_am: 'ቁጥር', label_om: 'Lakkoofsa' }
  ]);
});

/**
 * GET /api/categories
 * Get crop categories
 */
r.get('/categories', async (req, res) => {
  try {
    const categories = await q(
      `SELECT DISTINCT category, COUNT(*)::int AS crop_count
       FROM crops
       WHERE category IS NOT NULL
       GROUP BY category
       ORDER BY category ASC`
    );
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

/**
 * GET /api/stats
 * Get platform-wide statistics (public)
 */
r.get('/stats', async (req, res) => {
  try {
    const [stats] = await q(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE is_active=TRUE)::int AS total_users,
        (SELECT COUNT(*) FROM users WHERE role='farmer' AND is_active=TRUE)::int AS farmers,
        (SELECT COUNT(*) FROM users WHERE role='buyer' AND is_active=TRUE)::int AS buyers,
        (SELECT COUNT(*) FROM listings WHERE status='active')::int AS active_listings,
        (SELECT COUNT(*) FROM inquiries)::int AS total_inquiries,
        (SELECT COUNT(*) FROM inquiries WHERE status='completed')::int AS completed_deals,
        (SELECT COUNT(DISTINCT crop_id) FROM listings)::int AS crops_traded,
        (SELECT COUNT(DISTINCT region_id) FROM users WHERE region_id IS NOT NULL)::int AS regions_active
    `);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
});

/**
 * GET /api/search
 * Universal search across crops, regions, and markets
 */
r.get('/search', async (req, res) => {
  try {
    const { q: searchTerm } = req.query;

    if (!searchTerm || searchTerm.length < 2) {
      return res.status(400).json({ error: 'Search term must be at least 2 characters.' });
    }

    const term = `%${searchTerm}%`;

    // Search crops
    const crops = await q(
      `SELECT 'crop' AS type, id, name_en AS name, name_am, category AS subtitle
       FROM crops
       WHERE name_en ILIKE $1 OR name_am ILIKE $1 OR name_om ILIKE $1
       LIMIT 5`,
      [term]
    );

    // Search regions
    const regions = await q(
      `SELECT 'region' AS type, id, name, zone AS subtitle
       FROM regions
       WHERE name ILIKE $1
       LIMIT 5`,
      [term]
    );

    // Search markets
    const markets = await q(
      `SELECT 'market' AS type, m.id, m.name, r.name AS subtitle
       FROM markets m
       LEFT JOIN regions r ON r.id=m.region_id
       WHERE m.name ILIKE $1
       LIMIT 5`,
      [term]
    );

    res.json({
      results: [...crops, ...regions, ...markets],
      total: crops.length + regions.length + markets.length
    });
  } catch (error) {
    console.error('Error in search:', error);
    res.status(500).json({ error: 'Search failed.' });
  }
});

export default r;
