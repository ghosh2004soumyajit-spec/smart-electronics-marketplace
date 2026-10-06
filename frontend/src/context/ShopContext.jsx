/**
 * ShopContext — cart, wishlist, toasts.
 *
 * Strategy:
 *  - AUTHENTICATED: cart & wishlist are server-side (/api/cart, /api/wishlist).
 *    All mutations call the backend; local state is just a mirror of the response.
 *  - GUEST (not logged in): cart is held in localStorage (same as before).
 *    Wishlist is also localStorage for guests.
 *  - ON LOGIN: guest cart items are pushed to the server cart automatically.
 *
 * The Cart and Wishlist pages consume `cartItems` and `wishlistItems` directly —
 * they always get fully-hydrated product objects regardless of auth state.
 * Product shape from backend: { id, title, slug, base_price, discount_price,
 *   primary_image, stock_quantity, brand_name, brand_slug, ... }
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ShopCtx = createContext(null);
export const useShop = () => useContext(ShopCtx);

// ─── Guest localStorage keys ───────────────────────────────────────────────
const LS_GUEST_CART = 'volthaus.guest.cart.v2'; // [{id, qty}]
const LS_GUEST_WISH = 'volthaus.guest.wish.v2'; // [id, id, ...]

const loadLS = (key) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

// ─── Provider ──────────────────────────────────────────────────────────────
export function ShopProvider({ children }) {
  const { isAuthenticated, user } = useAuth();

  // Server-side cart/wishlist (used when authenticated)
  const [serverCart, setServerCart] = useState(null);   // null = not loaded yet
  const [serverWish, setServerWish] = useState(null);

  // Guest-side cart/wishlist (used when NOT authenticated)
  const [guestCart, setGuestCart] = useState(() => loadLS(LS_GUEST_CART)); // [{id,qty}]
  const [guestWish, setGuestWish] = useState(() => loadLS(LS_GUEST_WISH)); // [id, id, ...]
  // Hydrated guest products (fetched individually from API)
  const [guestCartItems, setGuestCartItems] = useState([]);
  const [guestWishItems, setGuestWishItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastSeq = useRef(0);

  // ─── Toasts ──────────────────────────────────────────────────────────────
  const toast = useCallback((message, kind = 'info') => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t.slice(-2), { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  // ─── Guest localStorage persistence ──────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) localStorage.setItem(LS_GUEST_CART, JSON.stringify(guestCart));
  }, [guestCart, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) localStorage.setItem(LS_GUEST_WISH, JSON.stringify(guestWish));
  }, [guestWish, isAuthenticated]);

  // ─── Hydrate guest cart from API ─────────────────────────────────────────
  const guestCartKey = guestCart.map((i) => `${i.id}:${i.qty}`).join(',');
  const guestWishKey = guestWish.join(',');

  useEffect(() => {
    if (isAuthenticated) return;
    let alive = true;
    const ids = [...new Set([...guestCart.map((i) => i.id), ...guestWish])];
    if (!ids.length) {
      setGuestCartItems([]);
      setGuestWishItems([]);
      return;
    }
    (async () => {
      const prods = await Promise.all(ids.map((id) => api.getProduct(id).catch(() => null)));
      if (!alive) return;
      // Normalize backend shape to a consistent internal shape
      const byId = Object.fromEntries(
        prods.filter(Boolean).map((p) => [p.id, normalizeProduct(p)])
      );
      setGuestCartItems(
        guestCart.map((i) => ({ ...i, product: byId[i.id] })).filter((i) => i.product)
      );
      setGuestWishItems(guestWish.map((id) => byId[id]).filter(Boolean));
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestCartKey, guestWishKey, isAuthenticated]);

  // ─── Fetch server cart & wishlist when authenticated ──────────────────────
  const fetchServerCart = useCallback(async () => {
    try {
      const data = await api.getCart();
      // data = { items: [...], subtotal }
      setServerCart(data.items.map((i) => ({ ...i, product: normalizeProduct(i) })));
    } catch (e) {
      console.error('Failed to fetch server cart', e);
    }
  }, []);

  const fetchServerWish = useCallback(async () => {
    try {
      const data = await api.getWishlist();
      setServerWish(data.map((i) => normalizeProduct(i)));
    } catch (e) {
      console.error('Failed to fetch server wishlist', e);
    }
  }, []);

  // On auth state change: load server data or merge guest cart
  useEffect(() => {
    if (!isAuthenticated) {
      setServerCart(null);
      setServerWish(null);
      return;
    }
    // Sync guest cart items to server first, then fetch
    (async () => {
      setLoading(true);
      const guestItems = loadLS(LS_GUEST_CART);
      if (guestItems.length > 0) {
        await Promise.all(
          guestItems.map((i) =>
            api.addToCart(i.id, i.qty).catch(() => null)
          )
        );
        localStorage.removeItem(LS_GUEST_CART);
        localStorage.removeItem(LS_GUEST_WISH);
        setGuestCart([]);
        setGuestWish([]);
      }
      await Promise.all([fetchServerCart(), fetchServerWish()]);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ─── Cart actions ──────────────────────────────────────────────────────────
  const addToCart = useCallback(
    async (product, qty = 1) => {
      const name = product.title || product.name || 'Item';
      if (isAuthenticated) {
        try {
          await api.addToCart(product.id, qty);
          await fetchServerCart();
          toast(`Added to cart — ${name}`, 'cart');
        } catch (err) {
          toast(err?.response?.data?.error || 'Could not add to cart.', 'error');
        }
      } else {
        setGuestCart((cur) => {
          const found = cur.find((i) => i.id === product.id);
          if (found) return cur.map((i) => i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, product.stock_quantity ?? 99) } : i);
          return [...cur, { id: product.id, qty: Math.min(qty, product.stock_quantity ?? 99) }];
        });
        toast(`Added to cart — ${name}`, 'cart');
      }
    },
    [isAuthenticated, fetchServerCart, toast]
  );

  const setQty = useCallback(
    async (productId, qty, stock) => {
      if (isAuthenticated) {
        if (qty <= 0) return removeFromCart(productId);
        try {
          await api.updateCartItem(productId, qty);
          await fetchServerCart();
        } catch (err) {
          toast(err?.response?.data?.error || 'Could not update quantity.', 'error');
        }
      } else {
        if (qty <= 0) {
          setGuestCart((cur) => cur.filter((i) => i.id !== productId));
        } else {
          setGuestCart((cur) =>
            cur.map((i) => i.id === productId ? { ...i, qty: Math.min(qty, stock ?? 99) } : i)
          );
        }
      }
    },
    [isAuthenticated, fetchServerCart, toast]
  );

  const removeFromCart = useCallback(
    async (productId) => {
      if (isAuthenticated) {
        try {
          await api.removeCartItem(productId);
          await fetchServerCart();
        } catch {
          toast('Could not remove item.', 'error');
        }
      } else {
        setGuestCart((cur) => cur.filter((i) => i.id !== productId));
      }
    },
    [isAuthenticated, fetchServerCart, toast]
  );

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      await fetchServerCart(); // will reflect empty after order placed
    } else {
      setGuestCart([]);
    }
  }, [isAuthenticated, fetchServerCart]);

  // ─── Wishlist actions ─────────────────────────────────────────────────────
  const inWishlist = useCallback(
    (id) => {
      if (isAuthenticated) return (serverWish ?? []).some((p) => p.id === id);
      return guestWish.includes(id);
    },
    [isAuthenticated, serverWish, guestWish]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      const name = product.title || product.name || 'Item';
      const inList = inWishlist(product.id);
      if (isAuthenticated) {
        try {
          if (inList) {
            await api.removeFromWishlist(product.id);
            toast(`Removed from wishlist — ${name}`, 'wish-off');
          } else {
            await api.addToWishlist(product.id);
            toast(`Saved to wishlist — ${name}`, 'wish');
          }
          await fetchServerWish();
        } catch {
          toast('Could not update wishlist.', 'error');
        }
      } else {
        setGuestWish((cur) => {
          if (inList) {
            toast(`Removed from wishlist — ${name}`, 'wish-off');
            return cur.filter((x) => x !== product.id);
          }
          toast(`Saved to wishlist — ${name}`, 'wish');
          return [...cur, product.id];
        });
      }
    },
    [isAuthenticated, inWishlist, fetchServerWish, toast]
  );

  const moveToCart = useCallback(
    async (product) => {
      await addToCart(product, 1);
      const name = product.title || product.name || 'Item';
      if (isAuthenticated) {
        try {
          await api.removeFromWishlist(product.id);
          await fetchServerWish();
          toast(`Moved to cart — ${name}`, 'cart');
        } catch { /* ignore */ }
      } else {
        setGuestWish((cur) => cur.filter((x) => x !== product.id));
        toast(`Moved to cart — ${name}`, 'cart');
      }
    },
    [isAuthenticated, addToCart, fetchServerWish, toast]
  );

  // ─── Computed values ──────────────────────────────────────────────────────
  const cartItems = isAuthenticated ? (serverCart ?? []) : guestCartItems;
  const wishlistItems = isAuthenticated ? (serverWish ?? []) : guestWishItems;

  const cartTotals = useMemo(() => {
    const subtotal = cartItems.reduce((s, i) => {
      const price = parseFloat(i.product?.discount_price || i.product?.base_price || 0);
      const qty = i.quantity ?? i.qty ?? 1;
      return s + price * qty;
    }, 0);
    const mrpTotal = cartItems.reduce((s, i) => {
      const mrp = parseFloat(i.product?.base_price || 0);
      const qty = i.quantity ?? i.qty ?? 1;
      return s + mrp * qty;
    }, 0);
    const count = cartItems.reduce((s, i) => s + (i.quantity ?? i.qty ?? 1), 0);
    return { subtotal, savings: Math.max(0, mrpTotal - subtotal), count };
  }, [cartItems]);

  const value = useMemo(
    () => ({
      // Cart
      cartItems,
      cartCount: cartTotals.count,
      cartTotals,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      // Wishlist
      wishlistItems,
      wishlistCount: wishlistItems.length,
      inWishlist,
      toggleWishlist,
      moveToCart,
      // Loading
      loading,
      // Toasts
      toasts,
      toast,
      dismissToast: (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    }),
    [cartItems, cartTotals, wishlistItems, loading, toasts, addToCart, setQty, removeFromCart, clearCart, inWishlist, toggleWishlist, moveToCart, toast]
  );

  return <ShopCtx.Provider value={value}>{children}</ShopCtx.Provider>;
}

// ─── Shape normalizer ─────────────────────────────────────────────────────
// Backend returns fields like `title`, `discount_price`, `primary_image`, etc.
// This gives every product a consistent internal shape that both pages can use.
export function normalizeProduct(p) {
  if (!p) return null;
  return {
    id: p.id ?? p.product_id,
    title: p.title ?? p.name ?? '',
    name: p.title ?? p.name ?? '',           // alias for legacy components
    slug: p.slug ?? '',
    brand_name: p.brand_name ?? p.brand?.name ?? '',
    brand_slug: p.brand_slug ?? p.brand?.slug ?? '',
    brand: { name: p.brand_name ?? p.brand?.name ?? '', slug: p.brand_slug ?? p.brand?.slug ?? '' },
    base_price: parseFloat(p.base_price ?? p.price?.mrp ?? 0),
    discount_price: parseFloat(p.discount_price ?? p.price?.sale ?? p.base_price ?? 0),
    price: {
      mrp: parseFloat(p.base_price ?? p.price?.mrp ?? 0),
      sale: parseFloat(p.discount_price ?? p.price?.sale ?? p.base_price ?? 0),
    },
    primary_image: p.primary_image ?? p.image_url ?? null,
    stock_quantity: p.stock_quantity ?? p.stock ?? 0,
    stock: p.stock_quantity ?? p.stock ?? 0,
    avg_rating: parseFloat(p.avg_rating ?? 0),
    review_count: parseInt(p.review_count ?? 0, 10),
    specs: p.specs ?? {},
    is_featured: p.is_featured ?? false,
    category_slug: p.category_slug ?? p.categorySlug ?? '',
    category_name: p.category_name ?? '',
    // Legacy fields for components that use mock data shape
    art: p.art ?? null,
    cardSpecs: p.cardSpecs ?? [],
  };
}
