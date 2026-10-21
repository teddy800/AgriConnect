/**
 * Role-Based Access Control (RBAC) Middleware
 * Comprehensive permission system for AgriConnect
 */

// Define all available permissions in the system
export const PERMISSIONS = {
  // Listing Permissions
  LISTING_CREATE: 'listing:create',
  LISTING_READ: 'listing:read',
  LISTING_UPDATE: 'listing:update',
  LISTING_DELETE: 'listing:delete',
  LISTING_READ_ALL: 'listing:read:all',
  LISTING_MANAGE_ALL: 'listing:manage:all',
  LISTING_APPROVE: 'listing:approve',
  LISTING_FEATURE: 'listing:feature',

  // Inquiry Permissions
  INQUIRY_CREATE: 'inquiry:create',
  INQUIRY_READ: 'inquiry:read',
  INQUIRY_UPDATE: 'inquiry:update',
  INQUIRY_DELETE: 'inquiry:delete',
  INQUIRY_READ_ALL: 'inquiry:read:all',
  INQUIRY_RESPOND: 'inquiry:respond',

  // Message Permissions
  MESSAGE_SEND: 'message:send',
  MESSAGE_READ: 'message:read',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_READ_ALL: 'message:read:all',
  MESSAGE_BROADCAST: 'message:broadcast',

  // Price Permissions
  PRICE_READ: 'price:read',
  PRICE_CREATE: 'price:create',
  PRICE_UPDATE: 'price:update',
  PRICE_DELETE: 'price:delete',
  PRICE_EXPORT: 'price:export',

  // Weather Permissions
  WEATHER_READ: 'weather:read',
  WEATHER_CREATE: 'weather:create',
  WEATHER_UPDATE: 'weather:update',

  // Advisory Permissions
  ADVISORY_READ: 'advisory:read',
  ADVISORY_CREATE: 'advisory:create',
  ADVISORY_UPDATE: 'advisory:update',
  ADVISORY_DELETE: 'advisory:delete',
  ADVISORY_PUBLISH: 'advisory:publish',

  // User Management Permissions
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_READ_ALL: 'user:read:all',
  USER_MANAGE_ALL: 'user:manage:all',
  USER_VERIFY: 'user:verify',
  USER_SUSPEND: 'user:suspend',
  USER_ROLES_MANAGE: 'user:roles:manage',

  // Admin Permissions
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_REPORTS: 'admin:reports',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_LOGS: 'admin:logs',
  ADMIN_AUDIT: 'admin:audit',
  ADMIN_SYSTEM: 'admin:system',

  // Analytics Permissions
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  ANALYTICS_ADVANCED: 'analytics:advanced',

  // Notification Permissions
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_MANAGE: 'notification:manage',
  NOTIFICATION_SEND_ALL: 'notification:send:all',

  // Settings Permissions
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_MANAGE_ALL: 'settings:manage:all',

  // Upload Permissions
  UPLOAD_IMAGE: 'upload:image',
  UPLOAD_DOCUMENT: 'upload:document',
  UPLOAD_BULK: 'upload:bulk'
};

// Define role-based permission mappings
export const ROLE_PERMISSIONS = {
  farmer: [
    // Listing permissions - Farmers can manage their own listings
    PERMISSIONS.LISTING_CREATE,
    PERMISSIONS.LISTING_READ,
    PERMISSIONS.LISTING_UPDATE,
    PERMISSIONS.LISTING_DELETE,

    // Inquiry permissions - Farmers can read inquiries about their listings
    PERMISSIONS.INQUIRY_READ,
    PERMISSIONS.INQUIRY_RESPOND,
    PERMISSIONS.INQUIRY_UPDATE,

    // Message permissions
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_DELETE,

    // Market data access
    PERMISSIONS.PRICE_READ,
    PERMISSIONS.WEATHER_READ,
    PERMISSIONS.ADVISORY_READ,

    // Profile management
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,

    // Settings
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,

    // Notifications
    PERMISSIONS.NOTIFICATION_READ,

    // Basic analytics
    PERMISSIONS.ANALYTICS_VIEW,

    // Upload permissions
    PERMISSIONS.UPLOAD_IMAGE,
    PERMISSIONS.UPLOAD_DOCUMENT
  ],

  buyer: [
    // Listing permissions - Buyers can only read listings
    PERMISSIONS.LISTING_READ,

    // Inquiry permissions - Buyers can create and manage their inquiries
    PERMISSIONS.INQUIRY_CREATE,
    PERMISSIONS.INQUIRY_READ,
    PERMISSIONS.INQUIRY_UPDATE,
    PERMISSIONS.INQUIRY_DELETE,

    // Message permissions
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_DELETE,

    // Market data access
    PERMISSIONS.PRICE_READ,
    PERMISSIONS.WEATHER_READ,
    PERMISSIONS.ADVISORY_READ,

    // Profile management
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,

    // Settings
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,

    // Notifications
    PERMISSIONS.NOTIFICATION_READ,

    // Basic analytics
    PERMISSIONS.ANALYTICS_VIEW
  ],

  agronomist: [
    // Advisory permissions - Agronomists can create and manage advisory content
    PERMISSIONS.ADVISORY_READ,
    PERMISSIONS.ADVISORY_CREATE,
    PERMISSIONS.ADVISORY_UPDATE,
    PERMISSIONS.ADVISORY_DELETE,
    PERMISSIONS.ADVISORY_PUBLISH,

    // Read access to listings and inquiries for advisory purposes
    PERMISSIONS.LISTING_READ,
    PERMISSIONS.LISTING_READ_ALL,
    PERMISSIONS.INQUIRY_READ,
    PERMISSIONS.INQUIRY_READ_ALL,

    // Message permissions
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_READ_ALL,
    PERMISSIONS.MESSAGE_BROADCAST,

    // Market data access and management
    PERMISSIONS.PRICE_READ,
    PERMISSIONS.PRICE_CREATE,
    PERMISSIONS.WEATHER_READ,
    PERMISSIONS.WEATHER_CREATE,
    PERMISSIONS.WEATHER_UPDATE,

    // Profile management
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_VERIFY,

    // Settings
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,

    // Notifications
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_MANAGE,

    // Analytics
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,

    // Upload permissions
    PERMISSIONS.UPLOAD_IMAGE,
    PERMISSIONS.UPLOAD_DOCUMENT
  ],

  admin: [
    // Admin has ALL permissions
    ...Object.values(PERMISSIONS)
  ]
};

// Permission dependencies - some permissions require others
const PERMISSION_DEPENDENCIES = {
  [PERMISSIONS.LISTING_DELETE]: [PERMISSIONS.LISTING_UPDATE],
  [PERMISSIONS.LISTING_APPROVE]: [PERMISSIONS.LISTING_READ_ALL],
  [PERMISSIONS.USER_DELETE]: [PERMISSIONS.USER_MANAGE_ALL],
  [PERMISSIONS.ADMIN_SYSTEM]: [PERMISSIONS.ADMIN_DASHBOARD]
};

/**
 * Check if user has specific permission
 * @param {Object} user - User object with role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;

  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];

  // Basic permission check
  let hasBasicPermission = rolePermissions.includes(permission);

  // Check permission dependencies
  if (hasBasicPermission && PERMISSION_DEPENDENCIES[permission]) {
    const deps = PERMISSION_DEPENDENCIES[permission];
    hasBasicPermission = deps.every(dep => rolePermissions.includes(dep));
  }

  return hasBasicPermission;
}

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object with role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean}
 */
export function hasAnyPermission(user, permissions) {
  if (!user || !user.role) return false;

  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.some(permission => rolePermissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object with role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean}
 */
export function hasAllPermissions(user, permissions) {
  if (!user || !user.role) return false;

  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.every(permission => rolePermissions.includes(permission));
}

/**
 * Middleware to check if user has required permission
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        error: `Access denied. Required permission: ${permission}`,
        code: 'PERMISSION_DENIED',
        required: permission,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has any of the required permissions
 * @param {...string} permissions - Required permissions (any)
 * @returns {Function} Express middleware
 */
export function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!hasAnyPermission(req.user, permissions)) {
      return res.status(403).json({
        error: `Access denied. Required permissions: ${permissions.join(' OR ')}`,
        code: 'PERMISSION_DENIED',
        required: permissions,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has all of the required permissions
 * @param {...string} permissions - Required permissions (all)
 * @returns {Function} Express middleware
 */
export function requireAllPermissions(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!hasAllPermissions(req.user, permissions)) {
      return res.status(403).json({
        error: `Access denied. Required permissions: ${permissions.join(' AND ')}`,
        code: 'PERMISSION_DENIED',
        required: permissions,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to check resource ownership
 * Combines with permission check for fine-grained access control
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request
 * @param {string} bypassPermission - Permission that bypasses ownership check (e.g., admin)
 */
export function requireOwnership(getResourceOwnerId, bypassPermission = null) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user has bypass permission (e.g., admin)
    if (bypassPermission && hasPermission(req.user, bypassPermission)) {
      return next();
    }

    try {
      // Get resource owner ID
      const ownerId = await getResourceOwnerId(req);

      // Check if user owns the resource
      if (req.user.id !== ownerId) {
        return res.status(403).json({
          error: 'Access denied. You can only access your own resources.',
          code: 'OWNERSHIP_REQUIRED'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        error: 'Failed to verify resource ownership.',
        code: 'OWNERSHIP_CHECK_FAILED'
      });
    }
  };
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} Array of permissions
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * API endpoint to get user permissions (for frontend)
 */
export function getUserPermissions(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const permissions = getRolePermissions(req.user.role);

  res.json({
    role: req.user.role,
    permissions,
    can: permissions.reduce((acc, perm) => {
      acc[perm] = true;
      return acc;
    }, {})
  });
}

/**
 * Helper to check if user is admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isAdmin(user) {
  return user?.role === 'admin';
}

/**
 * Helper to check if user is farmer
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isFarmer(user) {
  return user?.role === 'farmer';
}

/**
 * Helper to check if user is buyer
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isBuyer(user) {
  return user?.role === 'buyer';
}

/**
 * Helper to check if user is agronomist
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isAgronomist(user) {
  return user?.role === 'agronomist';
}

/**
 * Export role definitions for frontend
 */
export const ROLES = {
  FARMER: 'farmer',
  BUYER: 'buyer',
  AGRONOMIST: 'agronomist',
  ADMIN: 'admin'
};

/**
 * Role display names and descriptions
 */
export const ROLE_INFO = {
  farmer: {
    name: 'Farmer',
    description:
      'Can create and manage crop listings, respond to inquiries, and access market information',
    icon: '🌾',
    color: '#10B981'
  },
  buyer: {
    name: 'Buyer',
    description: 'Can browse listings, send inquiries to farmers, and access market information',
    icon: '🏪',
    color: '#3B82F6'
  },
  agronomist: {
    name: 'Agronomist',
    description:
      'Can provide agricultural advisory, create educational content, and support farmers',
    icon: '🎓',
    color: '#8B5CF6'
  },
  admin: {
    name: 'Administrator',
    description: 'Full system access with ability to manage users, content, and system settings',
    icon: '👑',
    color: '#EF4444'
  }
};
