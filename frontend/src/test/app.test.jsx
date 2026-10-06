/**
 * Runtime smoke tests — mount the real app (mock API layer) and exercise the
 * flows the build can't verify: route rendering, URL-synced filtering,
 * search, add-to-cart, wishlist, pincode check, 404.
 *
 * Run with: npm test   (vitest run)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import { ShopProvider } from '../context/ShopContext';
import { AuthProvider } from '../context/AuthContext';

function renderAt(route) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <ShopProvider>
            <App />
          </ShopProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, queryClient };
}

beforeEach(() => {
  localStorage.clear();
});

describe('Home', () => {
  it('renders the hero promise and the live datasheet panel', async () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    // hero panel loads a real product from the (mock) API — it also appears
    // in FeaturedPicks, so expect at least one occurrence
    const matches = await screen.findAllByText(/Voltas 1.5 Ton 5★ Inverter Split AC/i, {}, { timeout: 3000 });
    expect(matches.length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain('DAT/001');
  });

  it('shows the catalog index with all five categories', async () => {
    renderAt('/');
    await screen.findAllByText('Air Conditioners');
    for (const name of ['Refrigerators', 'Washing Machines', 'Televisions', 'Smartphones']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
  });

  it('finder computes a live match count and explains the rule', async () => {
    const user = userEvent.setup();
    renderAt('/');
    // default category is ACs; pick a budget and a room size
    const budgetPills = await screen.findAllByRole('button', { name: /₹30,000 – ₹45,000/ });
    await user.click(budgetPills[0]);
    const needPills = await screen.findAllByRole('button', { name: /Up to 180 sq ft/ });
    await user.click(needPills[0]);
    await waitFor(() => expect(document.body.textContent).toMatch(/datasheets? match/), { timeout: 3000 });
    expect(document.body.textContent).toContain('Budget');
  });
});

describe('Listing (category mode)', () => {
  it('lists ACs, then narrows via a spec facet with URL sync', async () => {
    const user = userEvent.setup();
    renderAt('/c/air-conditioners');
    await screen.findByText('7 datasheets', {}, { timeout: 3000 });

    // toggle "Inverter: Yes" in the sidebar
    const yes = screen.getByLabelText(/^Yes/);
    await user.click(yes);
    await screen.findByText('5 datasheets', {}, { timeout: 3000 });

    // an active chip appears and is removable (rendered twice: desktop + mobile rows)
    const chips = await screen.findAllByRole('button', { name: /Remove filter: Inverter: Yes/i });
    await user.click(chips[0]);
    await screen.findByText('7 datasheets', {}, { timeout: 3000 });
  });

  it('honours deep-linked price filters', async () => {
    renderAt('/c/air-conditioners?price=30000-45000');
    // appears twice: the active-filter chip and the sidebar price preset
    const chips = await screen.findAllByText(/₹30,000 – ₹45,000/, {}, { timeout: 3000 });
    expect(chips.length).toBeGreaterThanOrEqual(1);
    // only Daikin 38,490 / LG 32,990 / Voltas 44,990 / Lloyd excluded (29,490 < 30k) etc.
    await waitFor(() => expect(document.body.textContent).toContain('datasheets'));
  });
});

describe('Search', () => {
  it('finds the OLED TV via /search?q=oled', async () => {
    renderAt('/search?q=oled');
    await screen.findByText(/LG 65" OLED evo 4K TV/, {}, { timeout: 3000 });
  });

  it('shows a helpful no-results state', async () => {
    renderAt('/search?q=microwave');
    await screen.findByText(/Nothing in the catalog matches/i, {}, { timeout: 3000 });
    expect(document.body.textContent).toContain('Popular searches');
  });

  it('navbar suggest dropdown answers prefixes', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const input = await screen.findByLabelText(/Search products/i);
    await user.type(input, 'sam');
    await waitFor(() => expect(document.body.textContent).toMatch(/Samsung/), { timeout: 3000 });
  });
});

describe('Product detail', () => {
  it('renders the full datasheet: specs, price, reviews', async () => {
    renderAt('/p/voltas-1-5-ton-5-star-inverter-split-ac');
    await screen.findByRole('heading', { level: 1, name: /Voltas 1.5 Ton/i }, { timeout: 3000 });
    expect(document.body.textContent).toContain('₹44,990');
    expect(document.body.textContent).toContain('Full specification');
    // spec rows from product_specifications
    expect(document.body.textContent).toContain('Room coverage');
    const verifiedBadges = await screen.findAllByText(/Verified purchase/i, {}, { timeout: 3000 });
    expect(verifiedBadges.length).toBeGreaterThan(0);
  });

  it('pincode check returns zone, charge and ETA', async () => {
    const user = userEvent.setup();
    renderAt('/p/voltas-1-5-ton-5-star-inverter-split-ac');
    const pin = await screen.findByLabelText(/Enter delivery pincode/i, {}, { timeout: 3000 });
    await user.type(pin, '560001');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await screen.findByText(/Yes — Bengaluru/, {}, { timeout: 3000 });
    expect(document.body.textContent).toContain('Free');
  });

  it('adds to cart and the header badge updates', async () => {
    const user = userEvent.setup();
    renderAt('/p/voltas-1-5-ton-5-star-inverter-split-ac');
    // two "Add to cart" controls exist (desktop column + mobile action bar)
    const addBtns = await screen.findAllByRole('button', { name: /Add to cart/i }, { timeout: 3000 });
    await user.click(addBtns[0]);
    await screen.findByRole('link', { name: /Cart, 1 items?/ }, { timeout: 3000 });
  });
});

describe('Cart & wishlist round-trip (localStorage persistence)', () => {
  it('cart shows the hydrated line item and totals', async () => {
    localStorage.setItem('volthaus.guest.cart.v2', JSON.stringify([{ id: 1, qty: 2 }]));
    renderAt('/cart');
    await screen.findByText(/Voltas 1.5 Ton/i, {}, { timeout: 3000 });
    await waitFor(() => expect(document.body.textContent).toContain('₹89,980'), { timeout: 3000 }); // 44,990 × 2
  });

  it('wishlist renders saved datasheets with move-to-cart', async () => {
    localStorage.setItem('volthaus.guest.wish.v2', JSON.stringify([8]));
    renderAt('/wishlist');
    await screen.findByText(/LG 260 L/i, {}, { timeout: 3000 });
    expect(screen.getByRole('button', { name: /Move to cart/i })).toBeTruthy();
  });

  it('empty cart shows the honest empty state', async () => {
    renderAt('/cart');
    await screen.findByText(/Nothing on the sheet yet/i, {}, { timeout: 3000 });
  });
});

describe('404', () => {
  it('renders the missing-datasheet page', async () => {
    renderAt('/definitely-not-a-page');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/in the catalog/);
    expect(document.body.textContent).toContain('ERR / 404');
  });
});
