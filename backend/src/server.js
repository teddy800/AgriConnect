import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import reference from './routes/reference.js';
import listings from './routes/listings.js';
import inquiries from './routes/inquiries.js';
import prices from './routes/prices.js';
import uploads from './routes/uploads.js';
import notifications from './routes/notifications.js';
import admin from './routes/admin.js';
import dashboard from './routes/dashboard.js';          // with the other imports
app.use('/api/dashboard', dashboard);                    // with the other app.use lines

const app = express();
app.use(cors(), express.json());
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api', reference);
app.use('/api/listings', listings);
app.use('/api/inquiries', inquiries);
app.use('/api/prices', prices);
app.use('/api/uploads', uploads);
app.use('/api/notifications', notifications);
app.use('/api/admin', admin);

app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Image is larger than 2 MB.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side.' });
});

app.listen(process.env.PORT || 4000, () => console.log('AgriConnect API running'));