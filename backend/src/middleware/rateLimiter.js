import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

/**
 * Redis client for distributed rate limiting
 * Falls back to memory storage if Redis is unavailable
 */
let redisClient = null;
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

if (REDIS_ENABLED) {
  redisClient = createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined
  });

  redisClient.on('error', err => {
    console.error('Redis Client Error:', err);
    console.warn('⚠️  Rate limiting will use memory storage');
  });

  redisClient.connect().catch(err => {
    console.error('Failed to connect to Redis:', err);
  });
}

/**
 * Custom rate limit handler with detailed error messages
 */
const rateLimitHandler = (req, res) => {
  const retryAfter = res.getHeader('Retry-After');
  res.status(429).json({
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: retryAfter ? `${retryAfter} seconds` : 'unknown',
    message: 'Rate limit exceeded. Please slow down your requests.',
    endpoint: req.originalUrl
  });
};

/**
 * Skip rate limiting for successful requests in development
 */
const skipSuccessfulRequests = process.env.NODE_ENV === 'development';

/**
 * General API rate limiter - 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: rateLimitHandler,
  skipSuccessfulRequests,
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:general:'
      })
    : undefined
});

/**
 * Authentication rate limiter - 10 attempts per 15 minutes
 * Increased for development convenience
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 20 : 5, // Higher limit in development
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts.',
      message:
        'Your IP has been temporarily blocked due to multiple failed login attempts.',
      retryAfter: '15 minutes',
      tip: 'Make sure you are using the correct phone number and password.'
    });
  },
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:auth:'
      })
    : undefined
});

/**
 * Registration rate limiter - 3 registrations per hour per IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many accounts created from this IP, please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Registration limit exceeded.',
      message: 'You can only create 3 accounts per hour from this IP address.',
      retryAfter: '1 hour'
    });
  },
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:register:'
      })
    : undefined
});

/**
 * Upload rate limiter - 10 uploads per 10 minutes
 */
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: 'Too many uploads from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:upload:'
      })
    : undefined
});

/**
 * Search rate limiter - 30 searches per minute
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many search requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: true,
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:search:'
      })
    : undefined
});

/**
 * Price recording limiter - 50 records per hour (for agronomists)
 */
export const priceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'Too many price records submitted, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:price:'
      })
    : undefined
});

/**
 * Admin actions limiter - 200 actions per hour
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200,
  message: 'Too many admin actions, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:admin:'
      })
    : undefined
});

/**
 * Create a custom rate limiter with specific configuration
 */
export function createRateLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: options.handler || rateLimitHandler,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    store:
      redisClient && options.useRedis !== false
        ? new RedisStore({
            client: redisClient,
            prefix: options.prefix || 'rl:custom:'
          })
        : undefined
  });
}

/**
 * Graceful shutdown - close Redis connection
 */
process.on('SIGINT', async () => {
  if (redisClient) {
    await redisClient.quit();
  }
});

export default {
  generalLimiter,
  authLimiter,
  registerLimiter,
  uploadLimiter,
  searchLimiter,
  priceLimiter,
  adminLimiter,
  createRateLimiter
};
