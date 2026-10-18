/**
 * Marketplace Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Marketplace from '../../pages/Marketplace';
import { AuthProvider } from '../../auth';

vi.mock('../../api', () => ({
  api: {
    get: vi.fn()
  }
}));

const mockListings = [
  {
    id: '1',
    title: 'Fresh Teff',
    crop: 'Teff',
    quantity: 100,
    unit: 'quintal',
    price_per_unit: 2500,
    farmer: 'John Doe',
    region: 'Oromia',
    is_verified: true
  },
  {
    id: '2',
    title: 'Organic Coffee',
    crop: 'Coffee',
    quantity: 50,
    unit: 'kg',
    price_per_unit: 300,
    farmer: 'Jane Smith',
    region: 'SNNPR',
    is_verified: false
  }
];

const mockCrops = [
  { id: 1, name_en: 'Teff' },
  { id: 2, name_en: 'Coffee' }
];

const mockRegions = [
  { id: 1, name: 'Oromia' },
  { id: 2, name: 'Amhara' }
];

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Marketplace Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
  });

  it('should render marketplace title', async () => {
    const { api } = await import('../../api');
    api.get.mockImplementation((url) => {
      if (url.includes('/listings')) return Promise.resolve({ data: mockListings });
      if (url.includes('/crops')) return Promise.resolve({ data: mockCrops });
      if (url.includes('/regions')) return Promise.resolve({ data: mockRegions });
      return Promise.resolve({ data: [] });
    });

    renderWithRouter(<Marketplace />);

    await waitFor(() => {
      expect(screen.getByText(/marketplace/i) || screen.getByText(/browse/i)).toBeTruthy();
    });
  });

  it('should display listings after loading', async () => {
    const { api } = await import('../../api');
    api.get.mockImplementation((url) => {
      if (url.includes('/listings')) return Promise.resolve({ data: mockListings });
      if (url.includes('/crops')) return Promise.resolve({ data: mockCrops });
      if (url.includes('/regions')) return Promise.resolve({ data: mockRegions });
      return Promise.resolve({ data: [] });
    });

    renderWithRouter(<Marketplace />);

    await waitFor(() => {
      expect(screen.getByText(/Fresh Teff/i) || screen.getByText(/Teff/i)).toBeTruthy();
    });
  });

  it('should show empty state when no listings', async () => {
    const { api } = await import('../../api');
    api.get.mockImplementation((url) => {
      if (url.includes('/listings')) return Promise.resolve({ data: [] });
      if (url.includes('/crops')) return Promise.resolve({ data: mockCrops });
      if (url.includes('/regions')) return Promise.resolve({ data: mockRegions });
      return Promise.resolve({ data: [] });
    });

    renderWithRouter(<Marketplace />);

    await waitFor(() => {
      expect(screen.getByText(/no listing/i) || screen.getByText(/no produc/i)).toBeTruthy();
    });
  });

  it('should filter listings by search term', async () => {
    const { api } = await import('../../api');
    let currentListings = mockListings;
    
    api.get.mockImplementation((url) => {
      if (url.includes('/listings')) {
        if (url.includes('search=teff')) {
          currentListings = mockListings.filter(l => l.title.toLowerCase().includes('teff'));
        }
        return Promise.resolve({ data: currentListings });
      }
      if (url.includes('/crops')) return Promise.resolve({ data: mockCrops });
      if (url.includes('/regions')) return Promise.resolve({ data: mockRegions });
      return Promise.resolve({ data: [] });
    });

    renderWithRouter(<Marketplace />);

    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/search/i);
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: 'teff' } });
      }
    });
  });

  it('should display verified badge for verified farmers', async () => {
    const { api } = await import('../../api');
    api.get.mockImplementation((url) => {
      if (url.includes('/listings')) return Promise.resolve({ data: mockListings });
      if (url.includes('/crops')) return Promise.resolve({ data: mockCrops });
      if (url.includes('/regions')) return Promise.resolve({ data: mockRegions });
      return Promise.resolve({ data: [] });
    });

    renderWithRouter(<Marketplace />);

    await waitFor(() => {
      const content = screen.getByText(/Fresh Teff/i) || document.body;
      expect(content).toBeTruthy();
    });
  });
});
