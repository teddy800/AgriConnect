/**
 * Redis Caching Layer
 * Provides high-performance caching for frequently accessed data
 */

import { createClient } from 'redis';
import logger from './logger.js';

const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';
const CACHE_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 1800,          // 30 minutes
  VERY_LONG: 86400     // 24 hours
};

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis client
 */
export async function initializeRedis() {
  if (!REDIS_ENABLED) {
    logger.info('Redis caching is disabled');
    return null;
  }

  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        connectTimeout: 5000
      },
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB || '0', 10)
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis cache connected and ready');
      isConnected = true;
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis client reconnecting...');
      isConnected = false;
    });

    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', { error: error.message });
    return null;
  }
}

/**
 * Get cached value
 */
export async function get(key) {
  if (!isConnected || !redisClient) return null;

  try {
    const value = await redisClient.get(key);
    
    if (value) {
      logger.debug('Cache hit', { key });
      return JSON.parse(value);
    }
    
    logger.debug('Cache miss', { key });
    return null;
  } catch (error) {
    logger.error('Cache get error', { key, error: error.message });
    return null;
  }
}

/**
 * Set cached value with TTL
 */
export async function set(key, value, ttl = CACHE_TTL.MEDIUM) {
  if (!isConnected || !redisClient) return false;

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    logger.debug('Cache set', { key, ttl });
    return true;
  } catch (error) {
    logger.error('Cache set error', { key, error: error.message });
    return false;
  }
}

/**
 * Delete cached value
 */
export async function del(key) {
  if (!isConnected || !redisClient) return false;

  try {
    await redisClient.del(key);
    logger.debug('Cache deleted', { key });
    return true;
  } catch (error) {
    logger.error('Cache delete error', { key, error: error.message });
    return false;
  }
}

/**
 * Delete multiple keys matching pattern
 */
export async function delPattern(pattern) {
  if (!isConnected || !redisClient) return 0;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return 0;
    
    await redisClient.del(keys);
    logger.info('Cache pattern deleted', { pattern, count: keys.length });
    return keys.length;
  } catch (error) {
    logger.error('Cache pattern delete error', { pattern, error: error.message });
    return 0;
  }
}

/**
 * Check if key exists
 */
export async function exists(key) {
  if (!isConnected || !redisClient) return false;

  try {
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    logger.error('Cache exists error', { key, error: error.message });
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getStats() {
  if (!isConnected || !redisClient) {
    return { enabled: false, connected: false };
  }

  try {
    const info = await redisClient.info('stats');
    const memory = await redisClient.info('memory');
    const keyspace = await redisClient.info('keyspace');
    
    return {
      enabled: true,
      connected: isConnected,
      info: { stats: info, memory, keyspace }
    };
  } catch (error) {
    logger.error('Failed to get cache stats', { error: error.message });
    return { enabled: true, connected: false, error: error.message };
  }
}

/**
 * Flush all cache
 */
export async function flushAll() {
  if (!isConnected || !redisClient) return false;

  try {
    await redisClient.flushAll();
    logger.warn('Cache flushed completely');
    return true;
  } catch (error) {
    logger.error('Cache flush error', { error: error.message });
    return false;
  }
}

/**
 * Cache middleware for Express routes
 */
export function cacheMiddleware(ttl = CACHE_TTL.MEDIUM, keyPrefix = 'route') {
  return async (req, res, next) => {
    if (!isConnected || req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query
    const cacheKey = `${keyPrefix}:${req.originalUrl}`;

    try {
      const cached = await get(cacheKey);
      
      if (cached) {
        logger.info('Serving from cache', { key: cacheKey });
        return res.json(cached);
      }

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        set(cacheKey, data, ttl).catch(err => 
          logger.error('Failed to cache response', { error: err.message })
        );
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next();
    }
  };
}

/**
 * Invalidate cache for specific resource
 */
export async function invalidateResource(resourceType, resourceId) {
  const patterns = [
    `${resourceType}:${resourceId}:*`,
    `${resourceType}:list:*`,
    `route:*/api/${resourceType}*`
  ];

  let totalDeleted = 0;
  for (const pattern of patterns) {
    totalDeleted += await delPattern(pattern);
  }

  logger.info('Resource cache invalidated', { resourceType, resourceId, keysDeleted: totalDeleted });
  return totalDeleted;
}

/**
 * Graceful shutdown
 */
export async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis', { error: error.message });
    }
  }
}

// Graceful shutdown handlers
process.on('SIGINT', closeRedis);
process.on('SIGTERM', closeRedis);

export { CACHE_TTL };

export default {
  initialize: initializeRedis,
  get,
  set,
  del,
  delPattern,
  exists,
  getStats,
  flushAll,
  cacheMiddleware,
  invalidateResource,
  close: closeRedis,
  CACHE_TTL
};
