import { Router } from 'express';
import { getApplicationMetrics } from '../utils/monitoring.js';
import { auth, role } from '../middleware/auth.js';

const r = Router();

/**
 * GET /api/monitoring/health
 * Detailed health check endpoint (admin only)
 */
r.get('/health', auth, role('admin'), async (req, res) => {
  try {
    const metrics = await getApplicationMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve health metrics' });
  }
});

/**
 * GET /api/monitoring/metrics
 * System metrics endpoint (admin only)
 */
r.get('/metrics', auth, role('admin'), async (req, res) => {
  try {
    const metrics = await getApplicationMetrics();

    // Format as Prometheus-style metrics if requested
    if (req.query.format === 'prometheus') {
      const prometheusFormat = [
        '# HELP agriconnect_uptime Application uptime in seconds',
        '# TYPE agriconnect_uptime gauge',
        `agriconnect_uptime ${metrics.application.uptime}`,
        '',
        '# HELP agriconnect_memory_usage Memory usage percentage',
        '# TYPE agriconnect_memory_usage gauge',
        `agriconnect_memory_usage ${metrics.system.memory.usage}`,
        '',
        '# HELP agriconnect_cpu_count Number of CPU cores',
        '# TYPE agriconnect_cpu_count gauge',
        `agriconnect_cpu_count ${metrics.system.cpu.count}`
      ].join('\n');

      res.set('Content-Type', 'text/plain; version=0.0.4');
      return res.send(prometheusFormat);
    }

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

export default r;
