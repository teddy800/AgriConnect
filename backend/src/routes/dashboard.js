import { Router } from 'express';
import { q } from '../db.js';
import { auth } from '../middleware/auth.js';

const r = Router();
r.use(auth);

const farmerStats = `SELECT
  (SELECT COUNT(*) FROM listings WHERE farmer_id=$1 AND status='active')::int AS listings,
  (SELECT COUNT(*) FROM inquiries i JOIN listings l ON l.id=i.listing_id WHERE l.farmer_id=$1)::int AS inquiries,
  (SELECT COUNT(*) FROM inquiries i JOIN listings l ON l.id=i.listing_id
     WHERE l.farmer_id=$1 AND i.status='completed')::int AS sales,
  (SELECT COALESCE(SUM(i.quantity_wanted*COALESCE(i.offered_price,l.price_per_unit)),0)
     FROM inquiries i JOIN listings l ON l.id=i.listing_id
     WHERE l.farmer_id=$1 AND i.status='completed')::float AS revenue`;

const buyerStats = `SELECT
  (SELECT COUNT(*) FROM listings WHERE status='active')::int AS listings,
  (SELECT COUNT(*) FROM inquiries WHERE buyer_id=$1)::int AS inquiries,
  (SELECT COUNT(*) FROM inquiries WHERE buyer_id=$1 AND status='completed')::int AS sales,
  (SELECT COALESCE(SUM(i.quantity_wanted*COALESCE(i.offered_price,l.price_per_unit)),0)
     FROM inquiries i JOIN listings l ON l.id=i.listing_id
     WHERE i.buyer_id=$1 AND i.status='completed')::float AS revenue`;

r.get('/', async (req, res) => {
  const farmer = req.user.role === 'farmer';
  const [stats] = await q(farmer ? farmerStats : buyerStats, [req.user.id]);

  // latest average price per crop + change versus 6 days earlier
  const prices = await q(`
    WITH latest AS (
      SELECT DISTINCT ON (crop_id) crop_id, recorded_on
      FROM market_prices ORDER BY crop_id, recorded_on DESC),
    now_p AS (
      SELECT mp.crop_id, AVG(mp.price) AS price
      FROM market_prices mp JOIN latest l ON l.crop_id=mp.crop_id AND l.recorded_on=mp.recorded_on
      GROUP BY mp.crop_id),
    old_p AS (
      SELECT mp.crop_id, AVG(mp.price) AS price
      FROM market_prices mp JOIN latest l ON l.crop_id=mp.crop_id
      WHERE mp.recorded_on = l.recorded_on - 6 GROUP BY mp.crop_id)
    SELECT c.id, c.name_en AS crop, ROUND(n.price)::int AS price,
           CASE WHEN o.price > 0 THEN ROUND((n.price-o.price)/o.price*100, 1)::float END AS change
    FROM now_p n JOIN crops c ON c.id=n.crop_id LEFT JOIN old_p o ON o.crop_id=n.crop_id
    ORDER BY c.id LIMIT 4`);

  const recent = await q(
    `
    SELECT l.id, l.quantity, l.unit, l.price_per_unit, l.status, l.image_urls,
           c.name_en AS crop, rg.name AS region
    FROM listings l JOIN crops c ON c.id=l.crop_id JOIN regions rg ON rg.id=l.region_id
    WHERE ($2::boolean OR l.farmer_id=$1) AND ($2::boolean = FALSE OR l.status='active')
    ORDER BY l.created_at DESC LIMIT 5`,
    [req.user.id, !farmer]
  );

  res.json({ stats, prices, recent });
});

export default r;
