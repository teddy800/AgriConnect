/**
 * Application Monitoring and Health Checks
 * Provides performance metrics and system health monitoring
 */

import os from 'os';
import { performance } from 'perf_hooks';
import logger from './logger.js';
import pool from '../db.js';

/**
 * Get system metrics
 */
export function getSystemMetrics() {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    cpu: {
      count: cpus.length,
      model: cpus[0]?.model || 'unknown',
      usage: cpus.map(cpu => {
        const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
        const idle = cpu.times.idle;
        return Math.round((1 - idle / total) * 100);
      })
    },
    memory: {
      total: Math.round(totalMemory / 1024 / 1024), // MB
      used: Math.round(usedMemory / 1024 / 1024),
      free: Math.round(freeMemory / 1024 / 1024),
      usage: Math.round((usedMemory / totalMemory) * 100)
    },
    uptime: Math.round(process.uptime()), // seconds
    platform: os.platform(),
    nodeVersion: process.version
  };
}

/**
 * Check database health
 */
export async function checkDatabaseHealth() {
  const start = performance.now();
  try {
    await pool.query('SELECT 1');
    const latency = Math.round(performance.now() - start);
    
    return {
      status: 'healthy',
      latency: `${latency}ms`,
      connected: true
    };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      latency: null,
      connected: false,
      error: error.message
    };
  }
}

/**
 * Get application metrics
 */
export async function getApplicationMetrics() {
  const dbHealth = await checkDatabaseHealth();
  const systemMetrics = getSystemMetrics();

  return {
    timestamp: new Date().toISOString(),
    application: {
      name: 'AgriConnect API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    },
    system: systemMetrics,
    database: dbHealth,
    process: {
      pid: process.pid,
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      }
    }
  };
}

/**
 * Performance monitoring middleware
 */
export function performanceMonitor() {
  return (req, res, next) => {
    const start = performance.now();

    // Capture response
    res.on('finish', () => {
      const duration = Math.round(performance.now() - start);
      
      // Log slow requests (>1000ms)
      if (duration > 1000) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.originalUrl,
          duration: `${duration}ms`,
          statusCode: res.statusCode
        });
      }

      // Track metrics
      req.metrics = {
        duration,
        timestamp: new Date().toISOString()
      };
    });

    next();
  };
}

/**
 * Memory usage warning
 */
export function checkMemoryUsage() {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const usagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100);

  if (usagePercent > 90) {
    logger.error('Critical memory usage', {
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      usagePercent: `${usagePercent}%`
    });
  } else if (usagePercent > 75) {
    logger.warn('High memory usage', {
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      usagePercent: `${usagePercent}%`
    });
  }

  return {
    heapUsed: heapUsedMB,
    heapTotal: heapTotalMB,
    usagePercent
  };
}

// Monitor memory usage every 5 minutes
if (process.env.NODE_ENV === 'production') {
  setInterval(checkMemoryUsage, 5 * 60 * 1000);
}

export default {
  getSystemMetrics,
  checkDatabaseHealth,
  getApplicationMetrics,
  performanceMonitor,
  checkMemoryUsage
};
