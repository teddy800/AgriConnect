import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../auth.jsx';

// Test component that uses auth
function TestComponent() {
  const { user, isAuthenticated } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      {user && <div data-testid="user-name">{user.full_name}</div>}
    </div>
  );
}

describe('Authentication Context', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render unauthenticated state initially', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
  });

  it('should restore user from localStorage', async () => {
    const mockUser = {
      id: '123',
      full_name: 'Test User',
      role: 'farmer'
    };
    
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'fake-token');

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
  });
});
