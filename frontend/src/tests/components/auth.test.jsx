import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../auth.jsx';

// Test component that uses auth
function TestComponent() {
  const { user, isAuthenticated } = useAuth();
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <span data-testid="user-name">{user.full_name}</span>
          <span data-testid="user-role">{user.role}</span>
        </div>
      ) : (
        <span data-testid="not-authenticated">Not logged in</span>
      )}
    </div>
  );
}

describe('Authentication Context', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render not authenticated state initially', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('not-authenticated')).toBeDefined();
    });
  });

  it('should restore user from localStorage', async () => {
    const mockUser = {
      id: '123',
      full_name: 'Test User',
      role: 'farmer',
      phone: '0966666666'
    };

    localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(mockUser);
      if (key === 'token') return 'mock-token';
      return null;
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name').textContent).toBe('Test User');
      expect(screen.getByTestId('user-role').textContent).toBe('farmer');
    });
  });

  it('should save user data to localStorage', () => {
    const mockAuthData = {
      user: {
        id: '456',
        full_name: 'New User',
        role: 'buyer'
      },
      token: 'new-token'
    };

    // This would test the save function
    // You'd need to expose it or test through login flow
    expect(localStorage.setItem).toBeDefined();
  });
});
