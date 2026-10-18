/**
 * Request Timeout Middleware
 * Prevents long-running requests from blocking the server
 */

import logger from '../utils/logger.js';

const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Create a timeout middleware with custom timeout duration
 * @param {number} ms - Timeout duration in milliseconds
 * @returns {Function} Express middleware
 */
export function timeoutMiddleware(ms = DEFAULT_TIMEOUT) {
  return (req, res, next) => {
    // Set the timeout
    req.setTimeout(ms, () => {
      logger.warn('Request timeout', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        timeout: ms
      });

      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          message: `The request took longer than ${ms / 1000} seconds to complete`,
          timeout: ms
        });
      }
    });

    // Set response timeout
    res.setTimeout(ms, () => {
      if (!res.headersSent) {
        logger.error('Response timeout', {
          method: req.method,
          url: req.originalUrl,
          timeout: ms
        });

        res.status(504).json({
          error: 'Gateway timeout',
          message: 'The server took too long to respond'
        });
      }
    });

    next();
  };
}

/**
 * Custom timeout for specific operations
 */
export const TIMEOUTS = {
  SHORT: 5000,        // 5 seconds - for quick operations
  MEDIUM: 15000,      // 15 seconds - for database queries
  LONG: 30000,        // 30 seconds - for complex operations
  UPLOAD: 60000,      // 60 seconds - for file uploads
  SEARCH: 10000       // 10 seconds - for search operations
};

/**
 * Apply different timeouts based on route patterns
 */
export function adaptiveTimeout(req, res, next) {
  let timeout = DEFAULT_TIMEOUT;

  // Short timeout for health checks
  if (req.path.includes('/health') || req.path.includes('/ping')) {
    timeout = TIMEOUTS.SHORT;
  }
  // Longer timeout for uploads
  else if (req.path.includes('/upload') || req.method === 'POST' && req.is('multipart/form-data')) {
    timeout = TIMEOUTS.UPLOAD;
  }
  // Medium timeout for search
  else if (req.path.includes('/search')) {
    timeout = TIMEOUTS.SEARCH;
  }
  // Medium timeout for complex queries
  else if (req.path.includes('/dashboard') || req.path.includes('/analytics')) {
    timeout = TIMEOUTS.MEDIUM;
  }

  req.setTimeout(timeout);
  res.setTimeout(timeout);

  next();
}

export default timeoutMiddleware;
