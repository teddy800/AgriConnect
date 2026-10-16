import { Router } from 'express';
import { z } from 'zod';
import { q } from '../db.js';
import { auth, role } from '../middleware/auth.js';

const r = Router();
r.use(auth, role('admin'));

r.get('/stats', async (_, res) => {
  const [s] = await q(`SELECT
    (SELECT COUNT(*) FROM users)::int AS users,
    (SELECT COUNT(*) FROM listings WHERE status='active')::int AS active_listings,
    (SELECT COUNT(*) FROM inquiries)::int AS inquiries,
    (SELECT COUNT(*) FROM inquiries WHERE status='completed')::int AS completed_deals`);
  res.json(s);
});

r.get('/users', async (_, res) =>
  res.json(await q(`SELECT id, full_name, phone, role, is_verified, is_active, created_at
                    FROM users ORDER BY created_at DESC LIMIT 200`)));

r.patch('/users/:id', async (req, res) => {
  const p = z.object({ is_verified: z.boolean().optional(), is_active: z.boolean().optional() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid data.' });
  const [u] = await q(
    `UPDATE users SET is_verified=COALESCE($1,is_verified), is_active=COALESCE($2,is_active)
     WHERE id=$3 RETURNING id, is_verified, is_active`,
    [p.data.is_verified ?? null, p.data.is_active ?? null, req.params.id]);
  u ? res.json(u) : res.status(404).json({ error: 'User not found.' });
});

r.patch('/listings/:id/remove', async (req, res) => {
  const [l] = await q("UPDATE listings SET status='removed' WHERE id=$1 RETURNING id", [req.params.id]);
  l ? res.json(l) : res.status(404).json({ error: 'Listing not found.' });
});

export default r;