import xss from 'xss';
import validator from 'validator';

/**
 * XSS Filter Configuration
 * Customized whitelist for safe HTML elements (if needed for rich text)
 */
const xssOptions = {
  whiteList: {}, // No HTML allowed by default
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
};

/**
 * Sanitize a single string value
 * @param {string} value - Value to sanitize
 * @param {boolean} allowHTML - Whether to allow safe HTML
 * @returns {string} Sanitized value
 */
export function sanitizeString(value, allowHTML = false) {
  if (typeof value !== 'string') return value;
  
  // Trim whitespace
  value = value.trim();
  
  // Remove XSS threats
  value = xss(value, allowHTML ? undefined : xssOptions);
  
  // Normalize whitespace
  value = value.replace(/\s+/g, ' ');
  
  return value;
}

/**
 * Sanitize an object recursively
 * @param {Object} obj - Object to sanitize
 * @param {Array} excludeKeys - Keys to exclude from sanitization
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj, excludeKeys = []) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Skip excluded keys (e.g., password_hash)
      if (excludeKeys.includes(key)) {
        sanitized[key] = obj[key];
        continue;
      }
      
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeString(item) : 
          typeof item === 'object' ? sanitizeObject(item, excludeKeys) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value, excludeKeys);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

/**
 * Express middleware to sanitize request body
 */
export function sanitizeBody(excludeKeys = ['password', 'password_hash']) {
  return (req, res, next) => {
    if (req.body) {
      req.body = sanitizeObject(req.body, excludeKeys);
    }
    next();
  };
}

/**
 * Express middleware to sanitize query parameters
 */
export function sanitizeQuery() {
  return (req, res, next) => {
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    next();
  };
}

/**
 * Express middleware to sanitize URL parameters
 */
export function sanitizeParams() {
  return (req, res, next) => {
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    next();
  };
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  
  email = email.trim().toLowerCase();
  
  if (!validator.isEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  return validator.normalizeEmail(email);
}

/**
 * Validate and sanitize phone number (Ethiopian format)
 */
export function sanitizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  
  // Remove all non-digit characters
  phone = phone.replace(/\D/g, '');
  
  // Ethiopian phone validation: starts with 09 or 07, total 10 digits
  if (!/^(09|07)\d{8}$/.test(phone)) {
    throw new Error('Invalid Ethiopian phone number format. Must start with 09 or 07 and be 10 digits.');
  }
  
  return phone;
}

/**
 * Validate and sanitize URL
 */
export function sanitizeURL(url) {
  if (!url || typeof url !== 'string') return null;
  
  url = url.trim();
  
  if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) {
    throw new Error('Invalid URL format');
  }
  
  return url;
}

/**
 * Sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  
  // Remove any path traversal attempts
  filePath = filePath.replace(/\.\./g, '');
  filePath = filePath.replace(/[\/\\]/g, '-');
  
  return filePath;
}

/**
 * Validate and sanitize integer
 */
export function sanitizeInt(value, min = -Infinity, max = Infinity) {
  const num = parseInt(value, 10);
  
  if (isNaN(num)) {
    throw new Error('Value must be a valid integer');
  }
  
  if (num < min || num > max) {
    throw new Error(`Value must be between ${min} and ${max}`);
  }
  
  return num;
}

/**
 * Validate and sanitize float
 */
export function sanitizeFloat(value, min = -Infinity, max = Infinity, decimals = 2) {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    throw new Error('Value must be a valid number');
  }
  
  if (num < min || num > max) {
    throw new Error(`Value must be between ${min} and ${max}`);
  }
  
  return parseFloat(num.toFixed(decimals));
}

/**
 * Sanitize boolean
 */
export function sanitizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  throw new Error('Value must be a boolean');
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(arr, maxLength = 100) {
  if (!Array.isArray(arr)) {
    throw new Error('Value must be an array');
  }
  
  if (arr.length > maxLength) {
    throw new Error(`Array cannot contain more than ${maxLength} items`);
  }
  
  return arr.map(item => sanitizeString(String(item)));
}

/**
 * Comprehensive sanitization middleware
 * Sanitizes body, query, and params
 */
export function sanitizeAll(excludeKeys = ['password', 'password_hash']) {
  return (req, res, next) => {
    if (req.body) {
      req.body = sanitizeObject(req.body, excludeKeys);
    }
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    next();
  };
}

/**
 * SQL Injection prevention helper
 * Validates that input doesn't contain SQL keywords in dangerous contexts
 */
export function detectSQLInjection(value) {
  if (typeof value !== 'string') return false;
  
  // Common SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|\;|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /('.*OR.*'.*=.*')/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(value));
}

/**
 * Validate SQL injection in request
 */
export function validateNoSQLInjection() {
  return (req, res, next) => {
    const checkObject = (obj) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (typeof value === 'string' && detectSQLInjection(value)) {
            return true;
          }
          if (typeof value === 'object' && value !== null) {
            if (checkObject(value)) return true;
          }
        }
      }
      return false;
    };
    
    if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
      return res.status(400).json({ 
        error: 'Invalid input detected. Please check your data and try again.' 
      });
    }
    
    next();
  };
}

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAll,
  sanitizeEmail,
  sanitizePhone,
  sanitizeURL,
  sanitizeFilePath,
  sanitizeInt,
  sanitizeFloat,
  sanitizeBoolean,
  sanitizeStringArray,
  detectSQLInjection,
  validateNoSQLInjection
};
