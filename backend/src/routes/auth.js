import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { q } from '../db.js';
import { generateToken, checkRateLimit, auth } from '../middleware/auth.js';
import { getUserPermissions } from '../middleware/rbac.js';

const r = Router();

// Phone number validation for Ethiopian format
const phoneRegex = /^(09|07)\d{8}$/;

// Registration schema
const registerSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Phone must start with 09 or 07 and be 10 digits'),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  role: z.enum(['farmer', 'buyer'], {
    errorMap: () => ({ message: 'Role must be farmer or buyer' })
  }),
  region_id: z.number().int().positive().optional(),
  preferred_lang: z.enum(['en', 'am', 'om']).default('en')
});

// Login schema - allows either phone or email
const loginSchema = z.union([
  z.object({
    phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
    password: z.string().min(1, 'Password is required')
  }),
  z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
]);

/**
 * POST /api/auth/register
 * Register a new user account
 */
r.post('/register', async (req, res) => {
  try {
    // Validate request body
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0].message
      });
    }

    const { phone, email, password, full_name, role, region_id, preferred_lang } = parsed.data;

    // Check rate limiting by IP
    const rateLimitCheck = checkRateLimit(req.ip, 5, 15 * 60 * 1000);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ error: rateLimitCheck.message });
    }

    // Check if phone number already exists
    const [existingPhone] = await q('SELECT id FROM users WHERE phone=$1', [phone]);
    if (existingPhone) {
      return res.status(409).json({ error: 'This phone number is already registered.' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const [existingEmail] = await q('SELECT id FROM users WHERE email=$1', [email]);
      if (existingEmail) {
        return res.status(409).json({ error: 'This email address is already registered.' });
      }
    }

    // Validate region exists if provided
    if (region_id) {
      const [region] = await q('SELECT id FROM regions WHERE id=$1', [region_id]);
      if (!region) {
        return res.status(400).json({ error: 'Invalid region.' });
      }
    }

    // Hash password with bcrypt (cost factor 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [user] = await q(
      `INSERT INTO users(phone, email, password_hash, full_name, role, region_id, preferred_lang, is_verified, is_active)
       VALUES($1, $2, $3, $4, $5, $6, $7, FALSE, TRUE)
       RETURNING id, phone, email, full_name, role, region_id, preferred_lang, is_verified, is_active, created_at`,
      [phone, email || null, hashedPassword, full_name, role, region_id || null, preferred_lang]
    );

    // Generate JWT token
    const token = generateToken(user);

    // Send welcome notification
    await q(
      `INSERT INTO notifications(user_id, type, message)
       VALUES($1, 'welcome', $2)`,
      [user.id, `Welcome to AgriConnect, ${full_name}! Start exploring the marketplace.`]
    );

    // Return user data and token
    res.status(201).json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        region_id: user.region_id,
        preferred_lang: user.preferred_lang,
        is_verified: user.is_verified,
        is_active: user.is_active
      },
      token
    });

    console.log(`✅ New ${role} registered: ${phone}${email ? ` (${email})` : ''}`);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Login with phone/email and password
 */
r.post('/login', async (req, res) => {
  try {
    // Validate request body
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0].message
      });
    }

    const { phone, email, password } = req.body;

    // Check rate limiting by IP
    const rateLimitCheck = checkRateLimit(req.ip, 10, 15 * 60 * 1000);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ error: rateLimitCheck.message });
    }

    // Find user by phone or email
    let user;
    if (phone) {
      [user] = await q(
        `SELECT id, phone, email, password_hash, full_name, role, region_id, preferred_lang, 
                is_verified, is_active, created_at, last_login
         FROM users WHERE phone=$1`,
        [phone]
      );
    } else if (email) {
      [user] = await q(
        `SELECT id, phone, email, password_hash, full_name, role, region_id, preferred_lang, 
                is_verified, is_active, created_at, last_login
         FROM users WHERE email=$1`,
        [email]
      );
    }

    if (!user) {
      // Use generic error message to prevent user enumeration
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Update last login timestamp
    await q('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token
    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        region_id: user.region_id,
        preferred_lang: user.preferred_lang,
        is_verified: user.is_verified,
        is_active: user.is_active
      },
      token
    });

    console.log(`✅ User logged in: ${phone || email} (${user.role})`);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * POST /api/auth/verify-token
 * Verify if a token is still valid and return user data
 */
r.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required.' });
    }

    const authHeader = `Bearer ${token}`;
    req.headers.authorization = authHeader;

    // Use the auth middleware logic
    const { auth } = await import('../middleware/auth.js');
    auth(req, res, () => {
      res.json({
        valid: true,
        user: {
          id: req.user.id,
          phone: req.user.phone,
          full_name: req.user.full_name,
          role: req.user.role,
          is_verified: req.user.is_verified,
          is_active: req.user.is_active
        }
      });
    });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid or expired token.' });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password (requires authentication)
 */
r.post('/change-password', async (req, res) => {
  try {
    // This would need the auth middleware in actual implementation
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    // Would verify current password and update to new one
    res.status(501).json({ error: 'Feature coming soon.' });
  } catch (error) {
    res.status(500).json({ error: 'Password change failed.' });
  }
});

/**
 * GET /api/auth/permissions
 * Get current user's permissions
 */
r.get('/permissions', auth, getUserPermissions);

export default r;
