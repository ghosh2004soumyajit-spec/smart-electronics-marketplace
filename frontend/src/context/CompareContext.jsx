import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useShop } from './ShopContext';

const CompareCtx = createContext(null);

const defaultCompareContext = {
  compareItems: [],
  addToCompare: () => {},
  removeFromCompare: () => {},
  clearCompare: () => {},
  inCompare: () => false,
  compareCount: 0,
};

export const useCompare = () => useContext(CompareCtx) || defaultCompareContext;

const LS_COMPARE_KEY = 'volthaus.compare.v1';

export function CompareProvider({ children }) {
  const shop = useShop();
  const toast = shop?.toast || (() => {});

  const [compareItems, setCompareItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_COMPARE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_COMPARE_KEY, JSON.stringify(compareItems));
  }, [compareItems]);

  const addToCompare = useCallback((product) => {
    if (compareItems.some((p) => p.id === product.id)) return;
    if (compareItems.length >= 4) {
      toast('Compare limit reached — you can compare up to 4 products at a time.', 'error');
      return;
    }
    // Enforce same-category restriction
    const productCat = product.categorySlug || product.category_slug || product.category?.slug || '';
    if (compareItems.length > 0) {
      const existingCat = compareItems[0].categorySlug || compareItems[0].category_slug || compareItems[0].category?.slug || '';
      if (productCat && existingCat && productCat !== existingCat) {
        toast('Comparison is only permitted within the same category. Clear your list or remove items first.', 'error');
        return;
      }
    }
    toast(`Added to comparison — ${product.title || product.name || 'Item'}`, 'info');
    setCompareItems((cur) => [...cur, product]);
  }, [compareItems, toast]);

  const removeFromCompare = (productId) => {
    setCompareItems((cur) => cur.filter((p) => p.id !== productId));
  };

  const clearCompare = () => {
    setCompareItems([]);
  };

  const inCompare = (productId) => {
    return compareItems.some((p) => p.id === productId);
  };

  return (
    <CompareCtx.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        inCompare,
        compareCount: compareItems.length,
      }}
    >
      {children}
    </CompareCtx.Provider>
  );
}
