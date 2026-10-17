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
import dashboard from './routes/dashboard.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (_, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    service: 'AgriConnect API',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', reference);
app.use('/api/listings', listings);
app.use('/api/inquiries', inquiries);
app.use('/api/prices', prices);
app.use('/api/uploads', uploads);
app.use('/api/notifications', notifications);
app.use('/api/admin', admin);
app.use('/api/dashboard', dashboard);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Image is larger than 2 MB.' });
  }
  
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({ 
    error: isDev ? err.message : 'Something went wrong on our side.',
    ...(isDev && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('');
  console.log('🌾 ==========================================');
  console.log('   AgriConnect API Server');
  console.log('🌾 ==========================================');
  console.log(`   🚀 Server running on port ${PORT}`);
  console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   📡 API: http://localhost:${PORT}/api`);
  console.log(`   ❤️  Health: http://localhost:${PORT}/api/health`);
  console.log('🌾 ==========================================');
  console.log('');
});