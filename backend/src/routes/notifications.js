import { Router } from 'express';
import { q } from '../db.js';
import { auth } from '../middleware/auth.js';

const r = Router();
r.use(auth);

r.get('/', async (req, res) =>
  res.json(await q('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30', [req.user.id])));

r.patch('/read-all', async (req, res) => {
  await q('UPDATE notifications SET is_read=TRUE WHERE user_id=$1', [req.user.id]);
  res.json({ ok: true });
});

export default r;