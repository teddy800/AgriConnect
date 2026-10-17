import { Router } from 'express';
import { auth, role } from '../middleware/auth.js';
import { getMetrics } from '../middleware/performance.js';
import { q } from '../db.js';

const r = Router();

/**
 * GET /api/monitoring/health
 * Detailed health check with database connectivity
 */
r.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  };

  try {
    // Check database connection
    await q('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    health.status = 'degraded';
    health.database = 'disconnected';
    health.error = error.message;
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /api/monitoring/metrics
 * Performance metrics (admin only)
 */
r.get('/metrics', auth, role('admin'), (req, res) => {
  const metrics = getMetrics();
  
  if (!metrics) {
    return res.status(503).json({ error: 'Metrics not available' });
  }

  res.json({
    ...metrics,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/monitoring/stats
 * Database statistics (admin only)
 */
r.get('/stats', auth, role('admin'), async (req, res) => {
  try {
    const [stats] = await q(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours') AS users_24h,
        (SELECT COUNT(*) FROM listings) AS total_listings,
        (SELECT COUNT(*) FROM listings WHERE created_at > NOW() - INTERVAL '24 hours') AS listings_24h,
        (SELECT COUNT(*) FROM inquiries) AS total_inquiries,
        (SELECT COUNT(*) FROM inquiries WHERE created_at > NOW() - INTERVAL '24 hours') AS inquiries_24h,
        (SELECT pg_database_size(current_database())) AS database_size
    `);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/monitoring/logs
 * Recent error logs (admin only)
 */
r.get('/logs', auth, role('admin'), async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const errorLogPath = path.join('logs', 'error-' + new Date().toISOString().split('T')[0] + '.log');
    
    try {
      const logs = await fs.readFile(errorLogPath, 'utf-8');
      const lines = logs.split('\n').filter(Boolean).slice(-50); // Last 50 lines
      
      res.json({
        count: lines.length,
        logs: lines.map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { raw: line };
          }
        })
      });
    } catch (error) {
      res.json({ logs: [], message: 'No error logs found for today' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to read logs' });
  }
});

export default r;
