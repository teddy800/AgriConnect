import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import logger, { httpLogger, stream } from './utils/logger.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { sanitizeAll, validateNoSQLInjection } from './middleware/sanitizer.js';
import { timeoutMiddleware, adaptiveTimeout } from './middleware/timeout.js';
import { detectApiVersion, checkDeprecatedVersion, getApiVersionInfo } from './middleware/apiVersion.js';
import { swaggerDocument } from '../swagger.js';

// Import advanced utilities
import { initializeRedis, closeRedis } from './utils/cache.js';
import { initializeElasticsearch, closeElasticsearch } from './utils/elasticsearch.js';
import { initializeWebSocket } from './websocket/socketServer.js';

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
import search from './routes/search.js';
import weather from './routes/weather.js';

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket server
let io = null;
if (process.env.WEBSOCKET_ENABLED !== 'false') {
  io = initializeWebSocket(httpServer);
  logger.info('✅ WebSocket server initialized');
}

// Make io available to routes
app.set('io', io);

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
// Request Timeout & API Versioning
// ============================================
app.use(adaptiveTimeout); // Smart timeout based on route
app.use(detectApiVersion); // Detect API version from request
app.use(checkDeprecatedVersion); // Warn about deprecated versions

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
// API Documentation (Swagger)
// ============================================
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AgriConnect API Documentation'
}));

// API version info endpoint
app.get('/api/version', getApiVersionInfo);

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
app.use('/api/search', search);
app.use('/api/weather', weather);

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
// Initialize Advanced Services
// ============================================
async function initializeServices() {
  try {
    // Initialize Redis cache
    await initializeRedis();
    
    // Initialize Elasticsearch
    await initializeElasticsearch();
    
    logger.info('✅ All advanced services initialized');
  } catch (error) {
    logger.error('Service initialization error', { error: error.message });
    // Continue anyway - services are optional
  }
}

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 4000;

// Initialize services then start server
initializeServices().then(() => {
  httpServer.listen(PORT, () => {
    logger.info('AgriConnect API Server Started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      features: {
        websocket: io !== null,
        redis: process.env.REDIS_ENABLED === 'true',
        elasticsearch: process.env.ELASTICSEARCH_ENABLED === 'true'
      }
    });

    console.log('');
    console.log('🌾 ==========================================');
    console.log('   AgriConnect API Server');
    console.log('🌾 ==========================================');
    console.log(`   🚀 Server running on port ${PORT}`);
    console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   📡 API: http://localhost:${PORT}/api`);
    console.log(`   ❤️  Health: http://localhost:${PORT}/api/health`);
    console.log(`   📚 Docs: http://localhost:${PORT}/api/docs`);
    console.log(`   🔒 Security: Helmet, Rate Limiting, XSS Protection`);
    console.log(`   📝 Logging: Winston (logs/)`);
    console.log(`   ⏱️  Timeout: Adaptive (5s-60s based on route)`);
    console.log(`   🔢 API Version: v1 (with versioning support)`);
    console.log('');
    console.log('   🚀 ADVANCED FEATURES:');
    console.log(`   ${io ? '✅' : '❌'} WebSocket - Real-time updates`);
    console.log(`   ${process.env.REDIS_ENABLED === 'true' ? '✅' : '❌'} Redis - High-performance caching`);
    console.log(`   ${process.env.ELASTICSEARCH_ENABLED === 'true' ? '✅' : '❌'} Elasticsearch - Advanced search`);
    console.log('🌾 ==========================================');
    console.log('');
  });
}).catch(error => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});

// ============================================
// Graceful Shutdown
// ============================================
async function gracefulShutdown(signal) {
  logger.info(`${signal} signal received: closing server and connections`);
  
  // Close HTTP server
  httpServer.close(async () => {
    logger.info('HTTP server closed');
    
    // Close WebSocket connections
    if (io) {
      io.close(() => {
        logger.info('WebSocket connections closed');
      });
    }
    
    // Close Redis connection
    await closeRedis();
    
    // Close Elasticsearch connection
    await closeElasticsearch();
    
    logger.info('All connections closed gracefully');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// Export App for Testing
// ============================================
export default app;
