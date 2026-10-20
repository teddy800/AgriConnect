import { logPerformance } from '../utils/logger.js';

/**
 * Performance monitoring middleware
 * Tracks response times and logs slow operations
 */
export function performanceMonitor(req, res, next) {
  const start = Date.now();

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = `${req.method} ${req.route?.path || req.path}`;

    // Log slow requests (>1000ms)
    if (duration > 1000) {
      logPerformance(route, duration, {
        statusCode: res.statusCode,
        url: req.originalUrl,
        ip: req.ip
      });
    }

    // Track metrics
    if (global.metrics) {
      global.metrics.responseTime.push(duration);
      global.metrics.requestCount++;
    }
  });

  next();
}

/**
 * Initialize metrics collection
 */
export function initMetrics() {
  global.metrics = {
    responseTime: [],
    requestCount: 0,
    startTime: Date.now()
  };

  // Reset metrics every hour
  setInterval(
    () => {
      global.metrics.responseTime = [];
      global.metrics.requestCount = 0;
    },
    60 * 60 * 1000
  );
}

/**
 * Get current metrics
 */
export function getMetrics() {
  if (!global.metrics) return null;

  const times = global.metrics.responseTime;
  const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

  return {
    uptime: process.uptime(),
    requestCount: global.metrics.requestCount,
    avgResponseTime: Math.round(avg),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };
}

/**
 * Compression middleware configuration
 */
import compression from 'compression';

export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balance between speed and compression ratio
});

export default {
  performanceMonitor,
  initMetrics,
  getMetrics,
  compressionMiddleware
};
