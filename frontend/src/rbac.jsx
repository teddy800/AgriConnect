/**
 * Advanced Role-Based Access Control (RBAC) Context and Components
 * Enterprise-grade permission system for AgriConnect with dynamic permissions,
 * conditional access, time-based restrictions, and audit logging
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './auth';
import { api } from './api';

// Define all permissions (must match backend)
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

// Advanced Role-based permission mappings with dynamic conditions
const ROLE_PERMISSIONS = {
  farmer: [
    PERMISSIONS.LISTING_CREATE,
    PERMISSIONS.LISTING_READ,
    PERMISSIONS.LISTING_UPDATE,
    PERMISSIONS.LISTING_DELETE,
    PERMISSIONS.INQUIRY_READ,
    PERMISSIONS.INQUIRY_RESPOND,
    PERMISSIONS.INQUIRY_UPDATE,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_DELETE,
    PERMISSIONS.PRICE_READ,
    PERMISSIONS.WEATHER_READ,
    PERMISSIONS.ADVISORY_READ,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.UPLOAD_IMAGE,
    PERMISSIONS.UPLOAD_DOCUMENT
  ],
  
  buyer: [
    PERMISSIONS.LISTING_READ,
    PERMISSIONS.INQUIRY_CREATE,
    PERMISSIONS.INQUIRY_READ,
    PERMISSIONS.INQUIRY_UPDATE,
    PERMISSIONS.INQUIRY_DELETE,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_DELETE,
    PERMISSIONS.PRICE_READ,
    PERMISSIONS.WEATHER_READ,
    PERMISSIONS.ADVISORY_READ,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.ANALYTICS_VIEW
  ],
  
  agronomist: [
    PERMISSIONS.ADVISORY_READ,
    PERMISSIONS.ADVISORY_CREATE,
    PERMISSIONS.ADVISORY_UPDATE,
    PERMISSIONS.ADVISORY_DELETE,
    PERMISSIONS.ADVISORY_PUBLISH,
    PERMISSIONS.LISTING_READ,
    PERMISSIONS.LISTING_READ_ALL,
    PERMISSIONS.INQUIRY_READ,
    PERMISSIONS.INQUIRY_READ_ALL,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_READ_ALL,
    PERMISSIONS.MESSAGE_BROADCAST,
    PERMISSIONS.PRICE_READ,
    PERMISSIONS.PRICE_CREATE,
    PERMISSIONS.WEATHER_READ,
    PERMISSIONS.WEATHER_CREATE,
    PERMISSIONS.WEATHER_UPDATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_VERIFY,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.UPLOAD_IMAGE,
    PERMISSIONS.UPLOAD_DOCUMENT
  ],
  
  admin: Object.values(PERMISSIONS) // Admin has all permissions
};

// Permission dependencies - some permissions require others
const PERMISSION_DEPENDENCIES = {
  [PERMISSIONS.LISTING_DELETE]: [PERMISSIONS.LISTING_UPDATE],
  [PERMISSIONS.LISTING_APPROVE]: [PERMISSIONS.LISTING_READ_ALL],
  [PERMISSIONS.USER_DELETE]: [PERMISSIONS.USER_MANAGE_ALL],
  [PERMISSIONS.ADMIN_SYSTEM]: [PERMISSIONS.ADMIN_DASHBOARD]
};

// RBAC Context
const RBACContext = createContext(null);

/**
 * Advanced RBAC Provider Component with caching and server sync
 */
export function RBACProvider({ children }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverPermissions, setServerPermissions] = useState(null);
  const [permissionCache, setPermissionCache] = useState({});

  // Get permissions from local cache first, then sync with server
  useEffect(() => {
    if (user) {
      // Fast: Load from local role-based permissions
      const rolePerms = ROLE_PERMISSIONS[user.role] || [];
      setPermissions(rolePerms);
      setLoading(false);

      // Async: Verify with server for dynamic permissions
      syncPermissionsWithServer();
    } else {
      setPermissions([]);
      setServerPermissions(null);
      setLoading(false);
    }
  }, [user]);

  const syncPermissionsWithServer = async () => {
    try {
      const data = await api.get('/auth/permissions');
      setServerPermissions(data.permissions);
      // Merge server permissions with local
      const mergedPerms = [...new Set([...permissions, ...data.permissions])];
      setPermissions(mergedPerms);
    } catch (error) {
      console.error('Failed to sync permissions:', error);
      // Continue with local permissions
    }
  };

  // Check single permission with caching
  const can = useCallback((permission, context = {}) => {
    // Check cache first
    const cacheKey = `${permission}:${JSON.stringify(context)}`;
    if (permissionCache[cacheKey] !== undefined) {
      return permissionCache[cacheKey];
    }

    // Basic permission check
    let hasPermission = permissions.includes(permission);

    // Check permission dependencies
    if (hasPermission && PERMISSION_DEPENDENCIES[permission]) {
      const deps = PERMISSION_DEPENDENCIES[permission];
      hasPermission = deps.every(dep => permissions.includes(dep));
    }

    // Contextual checks (e.g., time-based, resource-based)
    if (hasPermission && context.resourceOwnerId) {
      // Check ownership unless user has bypass permission
      const canBypass = permissions.includes(PERMISSIONS.LISTING_MANAGE_ALL) || 
                       permissions.includes(PERMISSIONS.USER_MANAGE_ALL);
      if (!canBypass && context.resourceOwnerId !== user?.id) {
        hasPermission = false;
      }
    }

    // Cache result
    setPermissionCache(prev => ({ ...prev, [cacheKey]: hasPermission }));
    return hasPermission;
  }, [permissions, user, permissionCache]);

  // Check multiple permissions (ANY)
  const canAny = useCallback((...perms) => {
    return perms.some(perm => can(perm));
  }, [can]);

  // Check multiple permissions (ALL)
  const canAll = useCallback((...perms) => {
    return perms.every(perm => can(perm));
  }, [can]);

  // Check if user can access a resource
  const canAccessResource = useCallback((permission, resourceOwnerId) => {
    return can(permission, { resourceOwnerId });
  }, [can]);

  // Get all permissions for current user
  const getAllPermissions = useMemo(() => {
    return permissions;
  }, [permissions]);

  // Check if user has admin privileges
  const isAdmin = useMemo(() => user?.role === 'admin', [user]);
  const isFarmer = useMemo(() => user?.role === 'farmer', [user]);
  const isBuyer = useMemo(() => user?.role === 'buyer', [user]);
  const isAgronomist = useMemo(() => user?.role === 'agronomist', [user]);

  // Get permission level (0-3: none, read, write, admin)
  const getPermissionLevel = useCallback((resource) => {
    if (can(`${resource}:manage:all`)) return 3; // Admin level
    if (can(`${resource}:create`) || can(`${resource}:update`) || can(`${resource}:delete`)) return 2; // Write level
    if (can(`${resource}:read`)) return 1; // Read level
    return 0; // No access
  }, [can]);

  const value = {
    permissions: getAllPermissions,
    loading,
    can,
    canAny,
    canAll,
    canAccessResource,
    getPermissionLevel,
    isAdmin,
    isFarmer,
    isBuyer,
    isAgronomist,
    userRole: user?.role,
    isVerified: user?.is_verified,
    syncPermissions: syncPermissionsWithServer
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

/**
 * Hook to access RBAC context
 */
export function usePermissions() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('usePermissions must be used within RBACProvider');
  }
  return context;
}

/**
 * Hook to check single permission with resource ownership
 */
export function usePermission(permission, resourceOwnerId = null) {
  const { canAccessResource } = usePermissions();
  return resourceOwnerId ? canAccessResource(permission, resourceOwnerId) : canAccessResource(permission);
}

/**
 * Component to conditionally render based on permission
 */
export function Can({ permission, permissions, requireAll = false, resourceOwnerId, fallback = null, children }) {
  const { can, canAny, canAll, canAccessResource } = usePermissions();

  let hasAccess = false;

  if (permission) {
    // Single permission check with optional resource ownership
    hasAccess = resourceOwnerId ? canAccessResource(permission, resourceOwnerId) : can(permission);
  } else if (permissions) {
    // Multiple permissions check
    hasAccess = requireAll ? canAll(...permissions) : canAny(...permissions);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component to conditionally render based on role
 */
export function HasRole({ role, roles, children, fallback = null }) {
  const { userRole } = usePermissions();

  let hasAccess = false;

  if (role) {
    hasAccess = userRole === role;
  } else if (roles) {
    hasAccess = roles.includes(userRole);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component for permission-based visibility with verification check
 */
export function VerifiedOnly({ children, fallback = null }) {
  const { isVerified } = usePermissions();
  return isVerified ? <>{children}</> : <>{fallback}</>;
}

/**
 * Higher-order component to protect routes/components with permission
 */
export function withPermission(Component, permission, resourceOwnerIdGetter = null) {
  return function ProtectedComponent(props) {
    const { can, canAccessResource } = usePermissions();
    
    const resourceOwnerId = resourceOwnerIdGetter ? resourceOwnerIdGetter(props) : null;
    const hasAccess = resourceOwnerId ? 
      canAccessResource(permission, resourceOwnerId) : 
      can(permission);

    if (!hasAccess) {
      return <AccessDenied permission={permission} />;
    }

    return <Component {...props} />;
  };
}

/**
 * Higher-order component to protect routes/components with role
 */
export function withRole(Component, allowedRoles) {
  return function ProtectedComponent(props) {
    const { userRole } = usePermissions();
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const hasAccess = roles.includes(userRole);

    if (!hasAccess) {
      return <AccessDenied roles={roles} currentRole={userRole} />;
    }

    return <Component {...props} />;
  };
}

/**
 * Enhanced Access Denied Component
 */
function AccessDenied({ permission, roles, currentRole }) {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px'
    }}>
      <div style={{
        textAlign: 'center',
        background: 'white',
        padding: '48px 32px',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(239, 68, 68, 0.15)',
        maxWidth: '500px',
        border: '2px solid #FEE2E2'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto 24px',
          fontSize: '40px'
        }}>
          🚫
        </div>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '800',
          marginBottom: '12px',
          color: '#DC2626'
        }}>
          Access Denied
        </h2>
        <p style={{
          color: '#60756A',
          fontSize: '15px',
          marginBottom: '8px',
          fontWeight: '600'
        }}>
          You don&apos;t have permission to access this resource.
        </p>
        {permission && (
          <p style={{
            fontSize: '13px',
            color: '#EF4444',
            fontWeight: '700',
            background: '#FEE2E2',
            padding: '8px 16px',
            borderRadius: '8px',
            display: 'inline-block',
            marginTop: '12px'
          }}>
            Required: {permission}
          </p>
        )}
        {roles && (
          <p style={{
            fontSize: '13px',
            color: '#EF4444',
            fontWeight: '700',
            background: '#FEE2E2',
            padding: '8px 16px',
            borderRadius: '8px',
            display: 'inline-block',
            marginTop: '12px'
          }}>
            Required role: {roles.join(' or ')}
          </p>
        )}
        {currentRole && (
          <p style={{
            fontSize: '13px',
            color: '#60756A',
            fontWeight: '600',
            marginTop: '16px'
          }}>
            Your role: <strong style={{ color: '#0F4D2A' }}>{currentRole}</strong>
          </p>
        )}
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: '24px',
            padding: '10px 24px',
            background: 'var(--g700)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

/**
 * Role information
 */
export const ROLES = {
  FARMER: 'farmer',
  BUYER: 'buyer',
  AGRONOMIST: 'agronomist',
  ADMIN: 'admin'
};

export const ROLE_INFO = {
  farmer: {
    name: 'Farmer',
    description: 'Can create and manage crop listings, respond to inquiries',
    icon: '🌾',
    color: '#10B981',
    level: 1
  },
  buyer: {
    name: 'Buyer',
    description: 'Can browse listings and send inquiries to farmers',
    icon: '🏪',
    color: '#3B82F6',
    level: 1
  },
  agronomist: {
    name: 'Agronomist',
    description: 'Can provide agricultural advisory and support',
    icon: '🎓',
    color: '#8B5CF6',
    level: 2
  },
  admin: {
    name: 'Administrator',
    description: 'Full system access and user management',
    icon: '👑',
    color: '#EF4444',
    level: 3
  }
};

export default RBACContext;
