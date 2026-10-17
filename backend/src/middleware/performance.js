import { logPerformance } from '../utils/logger.js';

/**
 * Performance monitoring middleware
 * Tracks response times and logs slow requests
 */
export function performanceMonitor(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const operation = `${req.method} ${req.route?.path || req.path}`;
    
    logPerformance(operation, duration, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      contentLength: res.get('content-length')
    });
  });
  
  next();
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`
  };
}

/**
 * System metrics endpoint
 */
export async function getSystemMetrics() {
  return {
    uptime: process.uptime(),
    memory: getMemoryUsage(),
    cpu: process.cpuUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    pid: process.pid
  };
}

export default { performanceMonitor, getMemoryUsage, getSystemMetrics };
