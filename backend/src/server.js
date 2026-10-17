import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger, { httpLogger, stream } from './utils/logger.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { sanitizeAll, validateNoSQLInjection } from './middleware/sanitizer.js';

// Import routes
import authRoutes from './routes/auth.js';
import reference from './routes/reference.js';
import listings from './routes/listings.js';
import inquiries from './routes/inquiries.js';
import prices from './routes/prices.js';
import uploads from './routes/uploads.js';
import notifications from './routes/notifications.js';
import admin from './routes/admin.js';
import dashboard from './routes/dashboard.js';
import monitoring from './routes/monitoring.js';

const app = express();

// ============================================
// Security Middleware
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// ============================================
// CORS Configuration
// ============================================
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// Body Parsing & Sanitization
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeAll()); // XSS protection
app.use(validateNoSQLInjection()); // SQL injection prevention

// ============================================
// Logging Middleware
// ============================================
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream }));
} else {
  app.use(morgan('dev'));
}
app.use(httpLogger); // Custom Winston logger

// ============================================
// Rate Limiting
// ============================================
app.use('/api', generalLimiter); // Apply to all API routes
app.use('/api/auth/login', authLimiter); // Stricter limit for auth
app.use('/api/auth/register', authLimiter);

// ============================================
// Static Files
// ============================================
app.use('/uploads', express.static('uploads'));

// ============================================
// Health Check Endpoint
// ============================================
app.get('/api/health', (_, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    service: 'AgriConnect API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// ============================================
// API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api', reference);
app.use('/api/listings', listings);
app.use('/api/inquiries', inquiries);
app.use('/api/prices', prices);
app.use('/api/uploads', uploads);
app.use('/api/notifications', notifications);
app.use('/api/admin', admin);
app.use('/api/dashboard', dashboard);
app.use('/api/monitoring', monitoring);

// ============================================
// 404 Handler
// ============================================
app.use('/api/*', (req, res) => {
  logger.warn(`404 - Endpoint not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Endpoint not found.',
    path: req.originalUrl,
    method: req.method
  });
});

// ============================================
// Global Error Handler
// ============================================
app.use((err, req, res, _next) => {
  // Log error
  logger.error('Application Error', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Handle specific error types
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Image is larger than 2 MB.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
  
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({ 
    error: isDev ? err.message : 'Something went wrong on our side.',
    ...(isDev && { stack: err.stack })
  });
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  logger.info('AgriConnect API Server Started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });

  console.log('');
  console.log('🌾 ==========================================');
  console.log('   AgriConnect API Server');
  console.log('🌾 ==========================================');
  console.log(`   🚀 Server running on port ${PORT}`);
  console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   📡 API: http://localhost:${PORT}/api`);
  console.log(`   ❤️  Health: http://localhost:${PORT}/api/health`);
  console.log(`   🔒 Security: Helmet, Rate Limiting, XSS Protection`);
  console.log(`   📝 Logging: Winston (logs/)`);
  console.log('🌾 ==========================================');
  console.log('');
});

// ============================================
// Graceful Shutdown
// ============================================
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// ============================================
// Export App for Testing
// ============================================
export default app;