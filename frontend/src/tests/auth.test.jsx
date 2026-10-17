import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth.jsx';

describe('Auth Context', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('provides initial auth state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isFarmer).toBe(false);
    expect(result.current.isBuyer).toBe(false);
  });

  test('saves user data on login', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    const mockUser = {
      id: '123',
      phone: '0966666666',
      full_name: 'Test User',
      role: 'farmer',
      is_verified: true
    };

    const mockToken = 'fake-jwt-token';

    act(() => {
      result.current.save({ user: mockUser, token: mockToken });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isFarmer).toBe(true);
    expect(localStorage.getItem('token')).toBe(mockToken);
  });

  test('clears user data on logout', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    const mockUser = {
      id: '123',
      phone: '0966666666',
      full_name: 'Test User',
      role: 'buyer'
    };

    act(() => {
      result.current.save({ user: mockUser, token: 'token' });
    });

    expect(result.current.user).toEqual(mockUser);

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('hasRole checks user role correctly', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    const mockUser = {
      id: '123',
      role: 'admin'
    };

    act(() => {
      result.current.save({ user: mockUser, token: 'token' });
    });

    expect(result.current.hasRole('admin')).toBe(true);
    expect(result.current.hasRole('farmer')).toBe(false);
    expect(result.current.isAdmin).toBe(true);
  });
});
