/**
 * Dashboard Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import { AuthProvider } from '../../auth';

// Mock API module
vi.mock('../../api', () => ({
  api: {
    get: vi.fn()
  }
}));

const mockUser = {
  id: '123',
  full_name: 'Test User',
  role: 'farmer',
  phone: '0911111111'
};

const mockDashboardData = {
  stats: {
    listings: 5,
    active_listings: 3,
    inquiries: 10,
    unread_notifications: 2
  },
  recent_listings: [],
  recent_inquiries: []
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'fake-token');
  });

  it('should render dashboard title', async () => {
    const { api } = await import('../../api');
    api.get.mockResolvedValue({ data: mockDashboardData });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i) || screen.getByText(/welcome/i)).toBeTruthy();
    });
  });

  it('should display loading state initially', async () => {
    const { api } = await import('../../api');
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<Dashboard />);

    expect(screen.getByText(/loading/i)).toBeTruthy();
  });

  it('should display statistics after loading', async () => {
    const { api } = await import('../../api');
    api.get.mockResolvedValue({ data: mockDashboardData });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      const stats = screen.getByText(/listing/i) || screen.getByText(/inquir/i);
      expect(stats).toBeTruthy();
    });
  });

  it('should handle API errors gracefully', async () => {
    const { api } = await import('../../api');
    api.get.mockRejectedValue(new Error('API Error'));

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeTruthy();
    });
  });
});
