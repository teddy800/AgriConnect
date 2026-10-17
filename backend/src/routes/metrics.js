import { Router } from 'express';
import { auth, role } from '../middleware/auth.js';
import { getSystemMetrics } from '../middleware/performance.js';
import { q } from '../db.js';

const r = Router();

/**
 * GET /api/metrics/system
 * Get system performance metrics (admin only)
 */
r.get('/system', auth, role('admin'), async (req, res) => {
  try {
    const metrics = await getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
});

/**
 * GET /api/metrics/database
 * Get database statistics (admin only)
 */
r.get('/database', auth, role('admin'), async (req, res) => {
  try {
    const [stats] = await q(`
      SELECT 
        pg_database_size(current_database()) as size_bytes,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as connections,
        numbackends as active_connections
      FROM pg_stat_database 
      WHERE datname = current_database()
    `);

    const tables = await q(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);

    res.json({
      database: {
        size: stats.size_bytes,
        connections: stats.connections,
        active_connections: stats.active_connections
      },
      tables
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch database metrics' });
  }
});

/**
 * GET /api/metrics/api
 * Get API usage statistics (admin only)
 */
r.get('/api', auth, role('admin'), async (req, res) => {
  try {
    const [userStats] = await q(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as users_today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as users_week,
        COUNT(*) as total_users
      FROM users
    `);

    const [listingStats] = await q(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as listings_today,
        COUNT(*) FILTER (WHERE status = 'active') as active_listings,
        COUNT(*) as total_listings
      FROM listings
    `);

    const [inquiryStats] = await q(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as inquiries_today,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_inquiries,
        COUNT(*) as total_inquiries
      FROM inquiries
    `);

    res.json({
      users: userStats,
      listings: listingStats,
      inquiries: inquiryStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch API metrics' });
  }
});

export default r;
