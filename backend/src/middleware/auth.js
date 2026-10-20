import jwt from 'jsonwebtoken';
import { q } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for authenticated user
 * @param {Object} user - User object with id, phone, role
 * @returns {string} JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.full_name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token and extract payload
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired. Please log in again.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token. Please log in again.');
    }
    throw error;
  }
}

/**
 * Authentication middleware - Verify JWT and attach user to request
 */
export async function auth(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Please log in.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode token
    const decoded = verifyToken(token);

    // Check if user still exists and is active
    const [user] = await q(
      'SELECT id, phone, full_name, role, is_active, is_verified, region_id, preferred_lang FROM users WHERE id=$1',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ error: 'User not found. Please log in again.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact support.' });
    }

    // Attach user to request object for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ error: error.message || 'Authentication failed.' });
  }
}

/**
 * Role-based authorization middleware factory
 * @param {...string} allowedRoles - Roles that can access the route
 * @returns {Function} Express middleware
 */
export function role(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
}

/**
 * Optional authentication - Attach user if token is present, but don't require it
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      const [user] = await q(
        'SELECT id, phone, full_name, role, is_active FROM users WHERE id=$1',
        [decoded.id]
      );
      if (user && user.is_active) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silent fail - user remains unauthenticated
  }
  next();
}

/**
 * Rate limiting helper - Track attempts per IP
 * Note: For production, use Redis-based rate limiting
 */
const loginAttempts = new Map();

export function checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || [];

  // Remove old attempts outside the time window
  const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = Math.min(...recentAttempts);
    const retryAfter = Math.ceil((oldestAttempt + windowMs - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      message: `Too many attempts. Try again in ${retryAfter} seconds.`
    };
  }

  // Record this attempt
  recentAttempts.push(now);
  loginAttempts.set(identifier, recentAttempts);

  return { allowed: true };
}

// Cleanup old rate limit entries every hour
setInterval(
  () => {
    const now = Date.now();
    const threshold = 60 * 60 * 1000; // 1 hour
    for (const [key, attempts] of loginAttempts.entries()) {
      const recentAttempts = attempts.filter(timestamp => now - timestamp < threshold);
      if (recentAttempts.length === 0) {
        loginAttempts.delete(key);
      } else {
        loginAttempts.set(key, recentAttempts);
      }
    }
  },
  60 * 60 * 1000
);
