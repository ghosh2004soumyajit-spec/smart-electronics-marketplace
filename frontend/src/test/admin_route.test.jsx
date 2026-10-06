/**
 * Verification test for Milestone 2: Admin Route RBAC Security
 *
 * Verifies:
 * 1. Unauthenticated user accessing /admin -> redirected to /login with state { from: '/admin' }
 * 2. Authenticated user with role 'CUSTOMER' accessing /admin -> blocked, redirected to / with state { unauthorized: true } and toast error
 * 3. Authenticated user with role 'ADMIN' accessing /admin -> allowed to access /admin
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import { ShopProvider } from '../context/ShopContext';
import { AuthProvider } from '../context/AuthContext';
import api from '../services/api';

let currentLocation = null;
function LocationProbe() {
  const loc = useLocation();
  currentLocation = loc;
  return null;
}

function renderAppAt(route) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <ShopProvider>
            <LocationProbe />
            <App />
          </ShopProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Admin Route RBAC Security', () => {
  beforeEach(() => {
    localStorage.clear();
    currentLocation = null;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects unauthenticated user attempting to access /admin to /login with state.from = "/admin"', async () => {
    // Ensure no token or user exists in localStorage
    localStorage.clear();

    renderAppAt('/admin');

    // Should redirect to /login
    await waitFor(() => {
      expect(currentLocation?.pathname).toBe('/login');
    });

    // Verify state preserves intended destination
    expect(currentLocation?.state).toEqual({ from: '/admin' });

    // Login page elements should be visible
    expect(await screen.findByRole('heading', { level: 1, name: /Sign in/i })).toBeTruthy();
    expect(screen.queryByText(/Admin Management/i)).toBeNull();
  });

  it('blocks authenticated user with role "CUSTOMER" from /admin, redirecting to / with unauthorized state and toast error', async () => {
    const customerUser = {
      id: 2,
      role: 'CUSTOMER',
      email: 'customer@example.com',
      name: 'Customer Jane',
    };

    localStorage.setItem('volthaus.token', 'mock-customer-jwt-token');
    localStorage.setItem('volthaus.user', JSON.stringify(customerUser));

    // Mock api.getMe to return the customer profile
    vi.spyOn(api, 'getMe').mockResolvedValue(customerUser);

    renderAppAt('/admin');

    // Should redirect to /
    await waitFor(() => {
      expect(currentLocation?.pathname).toBe('/');
    });

    // Verify navigation state indicates unauthorized access
    expect(currentLocation?.state).toEqual({
      unauthorized: true,
      message: 'Access denied: Administrator privileges required.',
    });

    // In-app toast notification should be displayed
    await waitFor(() => {
      expect(screen.getByText(/Access denied: Administrator privileges required\./i)).toBeTruthy();
    });

    // Admin panel must NOT be visible
    expect(screen.queryByText(/VoltHaus — Admin Management Panel/i)).toBeNull();
  });

  it('allows authenticated user with role "ADMIN" to access /admin', async () => {
    const adminUser = {
      id: 1,
      role: 'ADMIN',
      email: 'admin@volthaus.com',
      name: 'System Admin',
    };

    localStorage.setItem('volthaus.token', 'mock-admin-jwt-token');
    localStorage.setItem('volthaus.user', JSON.stringify(adminUser));

    // Mock backend calls required by Admin page
    vi.spyOn(api, 'getMe').mockResolvedValue(adminUser);
    vi.spyOn(api, 'getAdminStats').mockResolvedValue({
      total_orders: 12,
      total_sales: 120000,
      total_customers: 8,
      total_products: 15,
    });
    vi.spyOn(api, 'listProducts').mockResolvedValue({ items: [], total: 0 });
    vi.spyOn(api, 'getAllOrdersAdmin').mockResolvedValue([]);
    vi.spyOn(api, 'getOffersAdmin').mockResolvedValue([]);

    renderAppAt('/admin');

    // Should remain on /admin
    await waitFor(() => {
      expect(currentLocation?.pathname).toBe('/admin');
    });

    // Admin page header should render
    expect(await screen.findByRole('heading', { level: 1, name: /Admin Management/i })).toBeTruthy();

    // No unauthorized toast should appear
    expect(screen.queryByText(/Access denied/i)).toBeNull();
  });
});
