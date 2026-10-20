import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth';
import { api } from './api';

/**
 * Role-Based Access Control (RBAC) Context and Components
 * Frontend permission system for AgriConnect
 */

// Define all permissions (must match backend)
export const PERMISSIONS = {
  // Listing Permissions
  LISTING_CREATE: 'listing:create',
  LISTING_READ: 'listing:read',
  LISTING_UPDATE: 'listing:update',
  LISTING_DELETE: 'listing:delete',
  LISTING_READ_ALL: 'listing:read:all',
  LISTING_MANAGE_ALL: 'listing:manage:all',
  
  // Inquiry Permissions
  INQUIRY_CREATE: 'inquiry:create',
  INQUIRY_READ: 'inquiry:read',
  INQUIRY_UPDATE: 'inquiry:update',
  INQUIRY_DELETE: 'inquiry:delete',
  INQUIRY_READ_ALL: 'inquiry:read:all',
  
  // Message Permissions
  MESSAGE_SEND: 'message:send',
  MESSAGE_READ: 'message:read',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_READ_ALL: 'message:read:all',
  
  // Price Permissions
  PRICE_READ: 'price:read',
  PRICE_CREATE: 'price:create',
  PRICE_UPDATE: 'price:update',
  PRICE_DELETE: 'price:delete',
  
  // Weather Permissions
  WEATHER_READ: 'weather:read',
  WEATHER_CREATE: 'weather:create',
  
  // Advisory Permissions
  ADVISORY_READ: 'advisory:read',
  ADVISORY_CREATE: 'advisory:create',
  ADVISORY_UPDATE: 'advisory:update',
  ADVISORY_DELETE: 'advisory:delete',
  
  // User Management Permissions
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_READ_ALL: 'user:read:all',
  USER_MANAGE_ALL: 'user:manage:all',
  USER_VERIFY: 'user:verify',
  
  // Admin Permissions
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_REPORTS: 'admin:reports',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_LOGS: 'admin:logs',
  
  // Analytics Permissions
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // Notification Permissions
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_MANAGE: 'notification:manage',
  NOTIFICATION_SEND_ALL: 'notification:send:all',
  
  // Settings Permissions
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_MANAGE_ALL: 'settings:manage:all'
};

// Role-based permission mappings (client-side cache)
const ROLE_PERMISSIONS = {
  farmer: [
    PERMISSIONS.LISTING_CREATE,
    PERMISSIONS.LISTING_READ,
    PERMISSIONS.LISTING_UPDATE,
    PERMISSIONS.LISTING_DELETE,
    PERMISSIONS.INQUIRY_READ,
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
    PERMISSIONS.ANALYTICS_VIEW
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
    PERMISSIONS.LISTING_READ,
    PERMISSIONS.LISTING_READ_ALL,
    PERMISSIONS.INQUIRY_READ,
    PERMISSIONS.INQUIRY_READ_ALL,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_READ_ALL,
    PERMISSIONS.PRICE_READ,
    PERMISSIONS.WEATHER_READ,
    PERMISSIONS.WEATHER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT
  ],
  
  admin: Object.values(PERMISSIONS) // Admin has all permissions
};

// RBAC Context
const RBACContext = createContext(null);

/**
 * RBAC Provider Component
 */
export function RBACProvider({ children }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Get permissions from local cache first (fast)
      const rolePerms = ROLE_PERMISSIONS[user.role] || [];
      setPermissions(rolePerms);
      setLoading(false);

      // Optionally fetch from server for verification
      // fetchPermissionsFromServer();
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [user]);

  const fetchPermissionsFromServer = async () => {
    try {
      const data = await api.get('/permissions');
      setPermissions(data.permissions);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const can = (permission) => {
    return permissions.includes(permission);
  };

  const canAny = (...perms) => {
    return perms.some(perm => permissions.includes(perm));
  };

  const canAll = (...perms) => {
    return perms.every(perm => permissions.includes(perm));
  };

  const value = {
    permissions,
    loading,
    can,
    canAny,
    canAll,
    isAdmin: user?.role === 'admin',
    isFarmer: user?.role === 'farmer',
    isBuyer: user?.role === 'buyer',
    isAgronomist: user?.role === 'agronomist'
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
 * Hook to check single permission
 */
export function usePermission(permission) {
  const { can } = usePermissions();
  return can(permission);
}

/**
 * Component to conditionally render based on permission
 */
export function Can({ permission, permissions, requireAll = false, fallback = null, children }) {
  const { can, canAny, canAll } = usePermissions();

  let hasAccess = false;

  if (permission) {
    // Single permission check
    hasAccess = can(permission);
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
  const { user } = useAuth();

  let hasAccess = false;

  if (role) {
    hasAccess = user?.role === role;
  } else if (roles) {
    hasAccess = roles.includes(user?.role);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Higher-order component to protect routes/components with permission
 */
export function withPermission(Component, permission, fallback = null) {
  return function ProtectedComponent(props) {
    const { can } = usePermissions();

    if (!can(permission)) {
      return fallback || <AccessDenied permission={permission} />;
    }

    return <Component {...props} />;
  };
}

/**
 * Higher-order component to protect routes/components with role
 */
export function withRole(Component, allowedRoles, fallback = null) {
  return function ProtectedComponent(props) {
    const { user } = useAuth();
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const hasAccess = roles.includes(user?.role);

    if (!hasAccess) {
      return fallback || <AccessDenied roles={roles} />;
    }

    return <Component {...props} />;
  };
}

/**
 * Access Denied Component
 */
function AccessDenied({ permission, roles }) {
  const { user } = useAuth();

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
          You don't have permission to access this resource.
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
        {user && (
          <p style={{
            fontSize: '13px',
            color: '#60756A',
            fontWeight: '600',
            marginTop: '16px'
          }}>
            Your role: <strong style={{ color: '#0F4D2A' }}>{user.role}</strong>
          </p>
        )}
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
    color: '#10B981'
  },
  buyer: {
    name: 'Buyer',
    description: 'Can browse listings and send inquiries to farmers',
    icon: '🏪',
    color: '#3B82F6'
  },
  agronomist: {
    name: 'Agronomist',
    description: 'Can provide agricultural advisory and support',
    icon: '🎓',
    color: '#8B5CF6'
  },
  admin: {
    name: 'Administrator',
    description: 'Full system access and user management',
    icon: '👑',
    color: '#EF4444'
  }
};

export default RBACContext;
