import { logSecurity } from '../utils/logger.js';

/**
 * Security headers middleware (additional to Helmet)
 */
export function securityHeaders(req, res, next) {
  res.setHeader('X-Powered-By', 'AgriConnect');
  res.setHeader('X-Request-ID', req.id || generateRequestId());
  next();
}

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Detect suspicious patterns in requests
 */
export function detectSuspiciousActivity(req, res, next) {
  const suspiciousPatterns = [
    /(\.\.|\/etc\/|\/var\/|\/proc\/)/i,
    /(eval\(|exec\(|system\()/i,
    /(<iframe|<object|<embed)/i
  ];

  const checkString = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(checkString));

  if (isSuspicious) {
    logSecurity('Suspicious Activity Detected', 'warn', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('user-agent')
    });

    return res.status(400).json({
      error: 'Invalid request detected. Your activity has been logged.'
    });
  }

  next();
}

/**
 * IP Whitelist/Blacklist middleware
 */
const blacklistedIPs = new Set();
const whitelistedIPs = new Set();

export function ipFilter(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress;

  if (blacklistedIPs.has(clientIP)) {
    logSecurity('Blocked IP Attempted Access', 'warn', { ip: clientIP });
    return res.status(403).json({ error: 'Access denied.' });
  }

  next();
}

export function addToBlacklist(ip) {
  blacklistedIPs.add(ip);
  logSecurity('IP Added to Blacklist', 'info', { ip });
}

export function removeFromBlacklist(ip) {
  blacklistedIPs.delete(ip);
  logSecurity('IP Removed from Blacklist', 'info', { ip });
}

/**
 * Request size limiter
 */
export function requestSizeLimiter(maxSize = '10mb') {
  const maxBytes = parseSize(maxSize);

  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);

    if (contentLength > maxBytes) {
      logSecurity('Large Request Blocked', 'warn', {
        size: contentLength,
        maxSize: maxBytes,
        ip: req.ip
      });

      return res.status(413).json({
        error: 'Request entity too large',
        maxSize
      });
    }

    next();
  };
}

function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.match(/^(\d+)(b|kb|mb|gb)$/i);
  if (!match) return 10 * 1024 * 1024;
  return parseInt(match[1], 10) * (units[match[2].toLowerCase()] || 1);
}

export default {
  securityHeaders,
  detectSuspiciousActivity,
  ipFilter,
  addToBlacklist,
  removeFromBlacklist,
  requestSizeLimiter
};
