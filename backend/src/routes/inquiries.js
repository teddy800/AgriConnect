import { Router } from 'express';
import { z } from 'zod';
import { q } from '../db.js';
import { auth, role } from '../middleware/auth.js';

const r = Router();

const BASE = `SELECT i.*, l.title, l.unit, l.image_urls, l.price_per_unit, c.name_en AS crop`;
const JOINS = `FROM inquiries i JOIN listings l ON l.id=i.listing_id JOIN crops c ON c.id=l.crop_id`;

r.post('/', auth, role('buyer'), async (req, res) => {
  const p = z.object({
    listing_id: z.string().uuid(),
    quantity_wanted: z.number().positive(),
    offered_price: z.number().positive().optional(),
    message: z.string().max(500).optional()
  }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });

  const d = p.data;
  const [l] = await q("SELECT farmer_id, quantity FROM listings WHERE id=$1 AND status='active'", [d.listing_id]);
  if (!l) return res.status(404).json({ error: 'This listing is no longer available.' });
  if (d.quantity_wanted > Number(l.quantity))
    return res.status(400).json({ error: 'You asked for more than is available.' });

  const [i] = await q(
    `INSERT INTO inquiries(listing_id,buyer_id,quantity_wanted,offered_price,message)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [d.listing_id, req.user.id, d.quantity_wanted, d.offered_price ?? null, d.message ?? null]);
  await q("INSERT INTO notifications(user_id,type,message) VALUES($1,'new_inquiry',$2)",
    [l.farmer_id, `New inquiry from ${req.user.name}`]);
  res.status(201).json(i);
});

// Farmer: inquiries on my listings
r.get('/received', auth, role('farmer'), async (req, res) =>
  res.json(await q(
    `${BASE}, u.full_name AS counterpart, u.phone AS counterpart_phone
     ${JOINS} JOIN users u ON u.id=i.buyer_id
     WHERE l.farmer_id=$1 ORDER BY i.created_at DESC`, [req.user.id])));

// Buyer: my inquiries. The farmer's phone is shared only after acceptance.
r.get('/sent', auth, role('buyer'), async (req, res) =>
  res.json(await q(
    `${BASE}, u.full_name AS counterpart,
            CASE WHEN i.status IN ('accepted','completed') THEN u.phone END AS counterpart_phone
     ${JOINS} JOIN users u ON u.id=l.farmer_id
     WHERE i.buyer_id=$1 ORDER BY i.created_at DESC`, [req.user.id])));

r.patch('/:id', auth, role('farmer'), async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected', 'completed'].includes(status))
    return res.status(400).json({ error: 'Invalid status.' });

  const [i] = await q(
    `UPDATE inquiries i SET status=$1 FROM listings l
     WHERE i.id=$2 AND l.id=i.listing_id AND l.farmer_id=$3 RETURNING i.*`,
    [status, req.params.id, req.user.id]);
  if (!i) return res.status(404).json({ error: 'Inquiry not found.' });

  await q("INSERT INTO notifications(user_id,type,message) VALUES($1,'inquiry_update',$2)",
    [i.buyer_id, `Your inquiry was ${status}`]);
  res.json(i);
});

export default r;