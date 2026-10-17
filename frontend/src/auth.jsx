import { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 * Manages user authentication state and token storage
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  /**
   * Initialize auth state from localStorage on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Parse stored user
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Optionally verify token is still valid
          // For production, you might want to validate with backend
          // await api.post('/auth/verify-token', { token });
        } catch (error) {
          console.error('Failed to restore auth state:', error);
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }

      setLoading(false);
      setInitialized(true);
    };

    initAuth();
  }, []);

  /**
   * Save authentication data after login/register
   * @param {Object} data - Response from login/register endpoint
   */
  const save = (data) => {
    if (!data || !data.user || !data.token) {
      console.error('Invalid auth data received');
      return;
    }

    // Store token and user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Update state
    setUser(data.user);

    console.log(`✅ User authenticated: ${data.user.full_name} (${data.user.role})`);
  };

  /**
   * Logout and clear authentication data
   */
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear state
    setUser(null);

    console.log('👋 User logged out');
  };

  /**
   * Update user data (e.g., after profile update)
   * @param {Object} updates - Partial user object with updates
   */
  const updateUser = (updates) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean}
   */
  const hasRole = (role) => {
    return user?.role === role;
  };

  /**
   * Check if user has any of the specified roles
   * @param {string[]} roles - Array of roles to check
   * @returns {boolean}
   */
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  /**
   * Get current authentication token
   * @returns {string|null}
   */
  const getToken = () => {
    return localStorage.getItem('token');
  };

  /**
   * Refresh user data from backend
   */
  const refreshUser = async () => {
    try {
      // This would call a /me or /profile endpoint
      // const userData = await api.get('/auth/me');
      // updateUser(userData);
      console.log('User refresh not implemented yet');
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If unauthorized, logout
      if (error.message?.includes('401') || error.message?.includes('token')) {
        logout();
      }
    }
  };

  const value = {
    user,
    loading,
    initialized,
    save,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
    getToken,
    refreshUser,
    // Convenience flags
    isAuthenticated: !!user,
    isFarmer: user?.role === 'farmer',
    isBuyer: user?.role === 'buyer',
    isAdmin: user?.role === 'admin',
    isAgronomist: user?.role === 'agronomist',
    isVerified: user?.is_verified || false
  };

  // Don't render children until auth state is initialized
  if (!initialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: '#60756A' 
      }}>
        <div>
          <div style={{ marginBottom: 12, textAlign: 'center' }}>🌾</div>
          <div>Loading AgriConnect...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 * @returns {Object} Auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // In a real app, you might want to redirect here
      console.warn('User not authenticated');
    }
  }, [user, loading]);

  return { user, loading };
}

/**
 * Hook to require specific role
 * @param {string|string[]} allowedRoles - Role(s) required
 */
export function useRequireRole(allowedRoles) {
  const { user, hasRole, hasAnyRole } = useAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const authorized = hasAnyRole(roles);

  useEffect(() => {
    if (user && !authorized) {
      console.warn(`Access denied. Required role: ${roles.join(' or ')}, User role: ${user.role}`);
    }
  }, [user, authorized]);

  return { user, authorized };
}

export default AuthContext;
