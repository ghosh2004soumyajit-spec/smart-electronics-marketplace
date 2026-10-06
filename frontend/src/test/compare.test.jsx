import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CompareProvider, useCompare } from '../context/CompareContext';
import { ShopProvider, useShop } from '../context/ShopContext';
import { AuthProvider } from '../context/AuthContext';

function TestConsumer() {
  const { compareItems, addToCompare, compareCount, clearCompare } = useCompare();
  const { toasts } = useShop();

  return (
    <div>
      <span data-testid="count">{compareCount}</span>
      <div data-testid="items">
        {compareItems.map((i) => (
          <span key={i.id} data-testid={`item-${i.id}`}>{i.title || i.name}</span>
        ))}
      </div>
      <div data-testid="toasts">
        {toasts.map((t) => (
          <span key={t.id} data-testid={`toast-${t.id}`}>{t.message}</span>
        ))}
      </div>
      <button
        onClick={() => addToCompare({ id: 1, name: 'AC 1', category_slug: 'air-conditioners' })}
        data-testid="add-ac1"
      >
        Add AC 1
      </button>
      <button
        onClick={() => addToCompare({ id: 2, name: 'AC 2', category_slug: 'air-conditioners' })}
        data-testid="add-ac2"
      >
        Add AC 2
      </button>
      <button
        onClick={() => addToCompare({ id: 8, name: 'Fridge 1', category_slug: 'refrigerators' })}
        data-testid="add-fridge"
      >
        Add Fridge
      </button>
      <button onClick={clearCompare} data-testid="clear">Clear</button>
    </div>
  );
}

function renderComponent() {
  return render(
    <AuthProvider>
      <ShopProvider>
        <CompareProvider>
          <TestConsumer />
        </CompareProvider>
      </ShopProvider>
    </AuthProvider>
  );
}

describe('Compare Context Single-Category Restriction', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows adding multiple products from the SAME category', () => {
    renderComponent();

    act(() => {
      screen.getByTestId('add-ac1').click();
    });
    expect(screen.getByTestId('count').textContent).toBe('1');

    act(() => {
      screen.getByTestId('add-ac2').click();
    });
    expect(screen.getByTestId('count').textContent).toBe('2');
  });

  it('blocks adding a product from a DIFFERENT category and shows a toast notification', () => {
    renderComponent();

    act(() => {
      screen.getByTestId('add-ac1').click();
    });
    expect(screen.getByTestId('count').textContent).toBe('1');

    // Attempt to add a refrigerator when an air conditioner is already in comparison
    act(() => {
      screen.getByTestId('add-fridge').click();
    });

    // Count should still be 1
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.queryByTestId('item-8')).toBeNull();

    // Toast notification should announce same-category requirement
    expect(screen.getByTestId('toasts').textContent).toContain('Comparison is only permitted within the same category');
  });
});
