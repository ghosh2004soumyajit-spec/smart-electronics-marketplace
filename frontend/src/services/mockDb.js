/**
 * Mock database — stands in for the Node/Express + PostgreSQL API during
 * frontend development. Every function mirrors a real endpoint (noted in
 * comments) so swapping is mechanical:
 *
 *   listProducts()      → GET /api/products
 *   getProduct()        → GET /api/products/:idOrSlug
 *   listCategories()    → GET /api/categories
 *   listBrands()        → GET /api/brands
 *   listOffers()        → GET /api/offers
 *   checkPincode()      → GET /api/delivery/check?pincode=
 *   searchSuggest()     → GET /api/products?q=…&limit=6&fields=suggest
 *   listReviews()       → GET /api/products/:id/reviews
 *
 * Filtering semantics deliberately match what the backend must implement:
 * token search, exact-match facets on spec keys, numeric ranges on spec
 * values, price band on selling price, sort modes, pagination.
 */

import {
  products,
  categories,
  brands,
  offers,
  reviews,
  deliveryZones,
  deliveryDefault,
  featuredProductIds,
} from '../data/seed.js';

/* Artificial network latency so skeletons/states are honest in dev. */
const delay = (ms = 140 + Math.random() * 160) => new Promise((r) => setTimeout(r, ms));

/* ---------- helpers ---------- */

const norm = (s) => String(s ?? '').toLowerCase().trim();

/** Flattened search haystack per product, built once. */
const haystacks = new Map(
  products.map((p) => {
    const cat = categories.find((c) => c.slug === p.categorySlug);
    const brand = brands.find((b) => b.slug === p.brandSlug);
    const specText = Object.entries(p.specs)
      .map(([key, s]) => `${key} ${s.label} ${s.value} ${s.unit || ''}`)
      .join(' ');
    return [
      p.id,
      [p.name, brand?.name, cat?.name, cat?.short, p.tagline, p.description, specText]
        .map(norm)
        .join(' '),
    ];
  })
);

/** Token match with prefix tolerance: "inv" → "inverter", "sam" → "samsung". */
function tokenMatch(hay, token) {
  if (hay.includes(token)) return true;
  return hay.split(/\s+/).some((w) => w.startsWith(token));
}

/** Does a product satisfy one numeric range {min,max} on a spec key? */
function inRange(product, key, range) {
  const spec = product.specs[key];
  if (!spec) return false;
  const v = Number(spec.value);
  if (Number.isNaN(v)) return false;
  if (range.min != null && v < Number(range.min)) return false;
  if (range.max != null && v > Number(range.max)) return false;
  return true;
}

const normSlug = (s) => String(s ?? '').toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '');

const bySlug = (arr, slug) => {
  if (!slug) return null;
  const raw = norm(slug);
  const normalized = normSlug(slug);
  return arr.find((x) => x.slug === raw || x.slug === normalized || norm(x.name) === raw || normSlug(x.name) === normalized);
};

const productImageMap = {
  1: '/images/products/ac-split.jpg',
  2: '/images/products/ac-split.jpg',
  3: '/images/products/ac-split.jpg',
  4: '/images/products/ac-windfree.jpg',
  5: '/images/products/ac-split.jpg',
  6: '/images/products/ac-split.jpg',
  7: '/images/products/ac-window.jpg',
  8: '/images/products/fridge-double-door.jpg',
  9: '/images/products/fridge-double-door.jpg',
  10: '/images/products/fridge-single-door.jpg',
  11: '/images/products/fridge-single-door.jpg',
  12: '/images/products/fridge-bottom-mount.jpg',
  13: '/images/products/fridge-side-by-side.jpg',
  14: '/images/products/washer-front-load.jpg',
  15: '/images/products/washer-top-load.jpg',
  16: '/images/products/washer-front-load.jpg',
  17: '/images/products/washer-front-load.jpg',
  18: '/images/products/washer-top-load.jpg',
  19: '/images/products/washer-top-load.jpg',
  20: '/images/products/tv-qled.jpg',
  21: '/images/products/tv-qled.jpg',
  22: '/images/products/tv-oled.jpg',
  23: '/images/products/tv-qled.jpg',
  24: '/images/products/tv-qled.jpg',
  25: '/images/products/tv-qled.jpg',
  26: '/images/products/phone-galaxy.jpg',
  27: '/images/products/phone-android.jpg',
  28: '/images/products/phone-xiaomi.jpg',
  29: '/images/products/phone-android.jpg',
  30: '/images/products/phone-iphone.jpg',
  31: '/images/products/phone-xiaomi.jpg',
  32: '/images/products/ac-split.jpg',
  33: '/images/products/fridge-side-by-side.jpg',
  34: '/images/products/washer-front-load.jpg',
  35: '/images/products/tv-qled.jpg',
  36: '/images/products/tv-oled.jpg',
  37: '/images/products/phone-galaxy.jpg',
  38: '/images/products/phone-iphone.jpg',
  39: '/images/products/phone-android.jpg',
  40: '/images/products/phone-xiaomi.jpg',
};

/** Decorate a raw product into the API shape components consume. */
export function toApiProduct(p) {
  const brand = bySlug(brands, p.brandSlug);
  const category = bySlug(categories, p.categorySlug);
  const primaryImg = p.primary_image || productImageMap[p.id] || null;
  return {
    ...p,
    primary_image: primaryImg,
    images: p.images || (primaryImg ? [{ image_url: primaryImg, is_primary: true }] : []),
    brand: brand ? { slug: brand.slug, name: brand.name } : null,
    category: category ? { slug: category.slug, name: category.name } : null,
    heroSpec: category?.hero ? p.specs[category.hero.key] : null,
    cardSpecs: (category?.cardSpecs || []).map((k) => p.specs[k]).filter(Boolean),
    discountPct: p.price.mrp > p.price.sale ? Math.round(((p.price.mrp - p.price.sale) / p.price.mrp) * 100) : 0,
    inStock: p.stock > 0,
  };
}

/* ---------- core matching (shared by list + suggest + counts) ---------- */

/**
 * Apply every filter except an optional facet key (used for facet counts).
 * @returns {Array} matching raw products, unsorted
 */
function applyFilters({
  q = '',
  category = null,
  categories = null,
  brand = null,
  brands: brandList = null,
  priceMin = null,
  priceMax = null,
  facets = {},
  ranges = {},
  exceptFacet = null,
  inStockOnly = false,
}) {
  const tokens = norm(q).split(/\s+/).filter(Boolean);

  return products.filter((p) => {
    if (category && p.categorySlug !== category) return false;
    if (categories?.length && !categories.includes(p.categorySlug)) return false;
    if (brand && p.brandSlug !== brand) return false;
    if (brandList?.length && !brandList.includes(p.brandSlug)) return false;
    if (priceMin != null && p.price.sale < Number(priceMin)) return false;
    if (priceMax != null && p.price.sale > Number(priceMax)) return false;
    if (inStockOnly && p.stock <= 0) return false;

    // Exact-match facets on spec keys (values compared as strings).
    for (const [key, values] of Object.entries(facets)) {
      if (key === exceptFacet) continue;
      if (!values?.length) continue;
      const spec = p.specs[key];
      if (!spec || !values.map(norm).includes(norm(spec.value))) return false;
    }

    // Numeric ranges on spec values (from the rule-based finder).
    for (const [key, range] of Object.entries(ranges)) {
      if (!inRange(p, key, range)) return false;
    }

    // Forgiving token search: every token must hit somewhere in the haystack.
    if (tokens.length) {
      const hay = haystacks.get(p.id);
      if (!tokens.every((t) => tokenMatch(hay, t))) return false;
    }
    return true;
  });
}

const SORTERS = {
  featured: (a, b) => {
    const rank = (p) => (p.badge === 'Bestseller' ? 0 : p.badge === 'New' ? 1 : 2);
    return rank(a) - rank(b) || b.rating - a.rating || b.reviewCount - a.reviewCount;
  },
  'price-asc': (a, b) => a.price.sale - b.price.sale,
  'price-desc': (a, b) => b.price.sale - a.price.sale,
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  newest: (a, b) => new Date(b.addedAt) - new Date(a.addedAt),
  discount: (a, b) => {
    const d = (p) => (p.price.mrp - p.price.sale) / p.price.mrp;
    return d(b) - d(a);
  },
};

/* ---------- public mock API ---------- */

/** GET /api/products — list with search, filters, sort, pagination, facet counts */
export async function listProducts(params = {}) {
  await delay();
  const perPage = Math.min(Number(params.limit || params.perPage) || 9, 500);
  const page = Math.max(Number(params.page) || 1, 1);
  const sort = SORTERS[params.sort] ? params.sort : 'featured';

  const matched = applyFilters(params);
  matched.sort(SORTERS[sort]);

  const total = matched.length;
  const pages = Math.max(Math.ceil(total / perPage), 1);
  const safePage = Math.min(page, pages);
  const items = matched.slice((safePage - 1) * perPage, safePage * perPage).map(toApiProduct);

  // Facet counts: for each option, how many products match if that option
  // were selected (other active values of the SAME facet are lifted, all
  // other filters held) — standard e-commerce faceting semantics.
  const category = params.category ? bySlug(categories, params.category) : null;
  let facetCounts = {};
  if (category) {
    for (const facet of category.facets) {
      facetCounts[facet.key] = {};
      const otherFacets = Object.fromEntries(
        Object.entries(params.facets || {}).filter(([k]) => k !== facet.key)
      );
      for (const opt of facet.options) {
        facetCounts[facet.key][opt] = applyFilters({
          ...params,
          facets: { ...otherFacets, [facet.key]: [opt] },
        }).length;
      }
    }
  }

  // Brand / category counts for the sidebar (computed with those filters
  // lifted, so users can see what a toggle would yield).
  const noBrand = applyFilters({ ...params, brand: null, brands: null });
  const brandCounts = Object.fromEntries(
    brands.map((b) => [b.slug, noBrand.filter((p) => p.brandSlug === b.slug).length])
  );
  const noCat = applyFilters({ ...params, category: null, categories: null });
  const categoryCounts = Object.fromEntries(
    categories.map((c) => [c.slug, noCat.filter((p) => p.categorySlug === c.slug).length])
  );

  return { items, total, page: safePage, perPage, pages, facetCounts, brandCounts, categoryCounts };
}

/** GET /api/products/:idOrSlug */
export async function getProduct(idOrSlug) {
  await delay(120);
  let p =
    products.find((x) => String(x.id) === String(idOrSlug)) || bySlug(products, idOrSlug);
  if (!p && idOrSlug) {
    const tokens = norm(idOrSlug).split(/\s+/).filter(Boolean);
    if (tokens.length) {
      p = products.find((prod) => {
        const hay = haystacks.get(prod.id);
        return tokens.every((t) => tokenMatch(hay, t));
      });
    }
  }
  if (!p) return null;
  const related = products
    .filter((x) => x.categorySlug === p.categorySlug && x.id !== p.id)
    .slice(0, 3)
    .map(toApiProduct);
  return { ...toApiProduct(p), related };
}

/** GET /api/categories (with live product counts) */
export async function listCategories() {
  await delay(80);
  return categories.map((c) => ({
    ...c,
    productCount: products.filter((p) => p.categorySlug === c.slug).length,
  }));
}

export function getCategorySync(slug) {
  return bySlug(categories, slug);
}

/** GET /api/brands */
export async function listBrands() {
  await delay(80);
  return brands.map((b) => ({
    ...b,
    productCount: products.filter((p) => p.brandSlug === b.slug).length,
  }));
}

/** GET /api/offers */
export async function listOffers() {
  await delay(80);
  return [...offers];
}

/** GET /api/delivery/check?pincode= — matches delivery_zones on first 3 digits */
export async function checkPincode(pincode) {
  await delay(260); // delivery checks feel slower on purpose — they hit zones
  const pin = String(pincode || '').trim();
  if (!/^\d{6}$/.test(pin)) {
    return {
      serviceable: false,
      is_serviceable: false,
      error: 'Enter a valid 6-digit pincode.',
      charge: 0,
      deliveryCharge: 0,
      freeAbove: 499,
    };
  }
  const zone = deliveryZones.find((z) => pin.startsWith(z.prefix)) || deliveryDefault;
  const eta = new Date();
  eta.setDate(eta.getDate() + zone.etaDays);
  const city = zone.region?.split(',')[0]?.trim() || zone.region || '';
  const state = zone.region?.split(',')[1]?.trim() || '';
  const minDays = zone.etaDays > 1 ? zone.etaDays - 1 : 1;
  const maxDays = zone.etaDays + 1;
  const charge = zone.charge;

  return {
    pincode: pin,
    city,
    state,
    region: zone.region,
    serviceable: true,
    is_serviceable: true,
    charge,
    deliveryCharge: charge,
    delivery_charge: charge,
    freeAbove: 499,
    free_above: 499,
    etaDays: zone.etaDays,
    minDays,
    maxDays,
    min_days: minDays,
    max_days: maxDays,
    etaLabel: `${minDays}-${maxDays} business days`,
    estimatedDelivery: eta.toISOString().split('T')[0],
    estimated_delivery: `${minDays} - ${maxDays} business days`,
  };
}

/** Search suggestions — top products + category shortcuts for the navbar dropdown */
export async function searchSuggest(q) {
  const term = norm(q);
  if (term.length < 2) return { products: [], categories: [] };
  const scored = products
    .map((p) => {
      const hay = haystacks.get(p.id);
      const tokens = term.split(/\s+/);
      const hits = tokens.filter((t) => tokenMatch(hay, t)).length;
      return { p, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits || b.p.rating - a.p.rating)
    .slice(0, 5)
    .map((x) => toApiProduct(x.p));

  const cats = categories.filter(
    (c) => norm(c.name).includes(term) || norm(c.short).includes(term)
  );
  return { products: scored, categories: cats };
}

let localReviews = [...reviews];

/** GET /api/products/:id/reviews (+ distribution for the rating histogram) */
export async function listReviews(productId) {
  await delay(100);
  const rows = localReviews
    .filter((r) => r.productId === Number(productId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = rows.length;
  let sum = 0;
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const items = rows.map((r) => {
    const rating = Number(r.rating);
    sum += rating;
    if (rating >= 1 && rating <= 5) {
      counts[rating] = (counts[rating] || 0) + 1;
    }
    const userName = r.userName || 'Verified Buyer';
    const isVerified = r.verified !== undefined ? Boolean(r.verified) : true;
    const createdAt = r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString();

    return {
      id: r.id,
      productId: r.productId,
      product_id: r.productId,
      userId: r.userId || 2,
      user_id: r.userId || 2,
      userName,
      user_name: userName,
      reviewer_name: userName,
      rating,
      title: r.title || '',
      comment: r.comment || '',
      verified: isVerified,
      is_verified: isVerified,
      createdAt,
      created_at: createdAt,
    };
  });

  const average = total > 0 ? parseFloat((sum / total).toFixed(1)) : 0;

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars] || 0,
    percentage: total > 0 ? Math.round(((counts[stars] || 0) / total) * 100) : 0,
  }));

  return { items, distribution, total, average };
}

/** POST /api/products/:id/reviews — submit review in mockDb */
export async function submitReview(productId, reviewData) {
  await delay(100);
  const targetId = Number(productId);
  const rating = Number(reviewData.rating) || 5;
  const newReview = {
    id: localReviews.length + 1,
    productId: targetId,
    userId: reviewData.userId || 1,
    userName: reviewData.userName || 'Verified Buyer',
    rating,
    title: reviewData.title || '',
    comment: reviewData.comment || '',
    verified: true,
    createdAt: new Date().toISOString(),
  };
  localReviews.unshift(newReview);
  return {
    ...newReview,
    product_id: targetId,
    user_id: newReview.userId,
    user_name: newReview.userName,
    is_verified: true,
    created_at: newReview.createdAt,
  };
}
export const createReview = submitReview;

/** Featured picks for the home page */
export async function listFeatured() {
  await delay(100);
  return featuredProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)
    .map(toApiProduct);
}

/** Quick match count for the finder's live "Show N matches" button */
export async function countMatches(params) {
  const res = await listProducts({ ...params, perPage: 1, page: 1 });
  return res.total;
}

/* ---------- Mock Cart & Order Operations ---------- */

let mockCart = [];

let mockOrders = [
  {
    id: 1,
    order_number: 'ORD-2026-10-001',
    user_id: 1,
    total_amount: 44990,
    final_amount: 44990,
    order_status: 'PENDING',
    payment_status: 'PAID',
    items: [
      {
        id: 1,
        productId: 1,
        product_id: 1,
        title: 'Voltas 1.5 Ton 5★ Inverter Split AC',
        price: 44990,
        quantity: 1,
      },
    ],
  },
];

/** GET /api/cart */
export async function getCart() {
  await delay(40);
  const items = mockCart.map((i) => {
    const p = products.find((x) => x.id === i.productId);
    return {
      ...i,
      product: p ? toApiProduct(p) : i.product,
    };
  });
  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.price?.sale ?? item.product?.discount_price ?? item.product?.base_price ?? 0;
    return sum + price * item.quantity;
  }, 0);
  return { items, subtotal };
}

/** POST /api/cart — enforces cumulative stock validation */
export async function addToCart(productId, quantity = 1) {
  await delay(40);
  const prodId = Number(productId);
  const p = products.find((x) => x.id === prodId);
  if (!p) {
    const err = new Error('Product not found.');
    err.status = 404;
    err.response = { status: 404, data: { error: 'Product not found.' } };
    throw err;
  }

  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    const err = new Error('Quantity must be a positive integer.');
    err.status = 400;
    err.response = { status: 400, data: { error: 'Quantity must be a positive integer.' } };
    throw err;
  }

  const existing = mockCart.find((i) => i.productId === prodId);
  const existingQty = existing ? existing.quantity : 0;

  // Validate cumulative stock limit
  if (existingQty + parsedQty > p.stock) {
    const err = new Error('Requested quantity exceeds available stock.');
    err.status = 400;
    err.response = {
      status: 400,
      data: {
        error: 'Requested quantity exceeds available stock.',
        stock: p.stock,
        currentInCart: existingQty,
      },
    };
    throw err;
  }

  if (existing) {
    existing.quantity += parsedQty;
  } else {
    mockCart.push({
      id: mockCart.length + 1,
      productId: prodId,
      product_id: prodId,
      quantity: parsedQty,
      product: toApiProduct(p),
    });
  }

  return getCart();
}

/** PUT /api/cart/:productId */
export async function updateCartItem(productId, quantity) {
  await delay(40);
  const prodId = Number(productId);
  const p = products.find((x) => x.id === prodId);
  const parsedQty = parseInt(quantity, 10);

  if (isNaN(parsedQty) || parsedQty <= 0) {
    return removeCartItem(prodId);
  }

  if (p && parsedQty > p.stock) {
    const err = new Error(`Only ${p.stock} units available in stock.`);
    err.status = 400;
    err.response = {
      status: 400,
      data: { error: `Only ${p.stock} units available in stock.`, stock: p.stock },
    };
    throw err;
  }

  const item = mockCart.find((i) => i.productId === prodId);
  if (item) {
    item.quantity = parsedQty;
  }

  return getCart();
}

/** DELETE /api/cart/:productId */
export async function removeCartItem(productId) {
  await delay(40);
  const prodId = Number(productId);
  mockCart = mockCart.filter((i) => i.productId !== prodId);
  return getCart();
}

export async function clearCart() {
  mockCart = [];
  return { items: [], subtotal: 0 };
}

/* ---------- Mock Wishlist Operations ---------- */
let mockWishlist = [];

export async function getWishlist() {
  await delay(30);
  return mockWishlist.map((id) => products.find((p) => p.id === id)).filter(Boolean).map(toApiProduct);
}

export async function addToWishlist(productId) {
  await delay(30);
  const id = Number(productId);
  if (!mockWishlist.includes(id)) mockWishlist.push(id);
  return { message: 'Added to wishlist' };
}

export async function removeFromWishlist(productId) {
  await delay(30);
  const id = Number(productId);
  mockWishlist = mockWishlist.filter((x) => x !== id);
  return { message: 'Removed from wishlist' };
}

/** POST /api/orders — atomic deduction with rollback compensation */
export async function createOrder(orderData = {}) {
  await delay(50);
  const items = orderData.items || mockCart;
  if (!items || items.length === 0) {
    const err = new Error('Your cart is empty. Add products before placing an order.');
    err.status = 400;
    err.response = { status: 400, data: { error: 'Your cart is empty. Add products before placing an order.' } };
    throw err;
  }

  // Deduct inventory atomically with rollback
  const deducted = [];
  let failed = null;

  for (const item of items) {
    const p = products.find((x) => x.id === (item.productId || item.product_id));
    if (!p || p.stock < item.quantity) {
      failed = item;
      break;
    }
    p.stock -= item.quantity;
    deducted.push({ p, quantity: item.quantity });
  }

  if (failed) {
    for (const d of deducted) {
      d.p.stock += d.quantity;
    }
    const err = new Error(`Insufficient stock for "${failed.title || failed.name || 'item'}".`);
    err.status = 400;
    err.response = {
      status: 400,
      data: { error: `Insufficient stock for "${failed.title || failed.name || 'item'}".` },
    };
    throw err;
  }

  const newOrder = {
    id: mockOrders.length + 1,
    order_number: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    user_id: 1,
    order_status: 'PENDING',
    payment_status: 'PAID',
    items: [...items],
    ...orderData,
  };

  mockOrders.push(newOrder);
  mockCart = [];
  return { message: 'Order placed successfully.', order: newOrder };
}

/** PUT /api/orders/:id/cancel — atomic, idempotent order cancellation */
export async function cancelOrder(id) {
  await delay(40);
  const isId = /^\d+$/.test(String(id).trim());
  const order = mockOrders.find((o) => (isId ? o.id === Number(id) : o.order_number === String(id).trim()));

  if (!order) {
    const err = new Error('Order not found.');
    err.status = 404;
    err.response = { status: 404, data: { error: 'Order not found.' } };
    throw err;
  }

  // If already cancelled or non-cancellable, reject without restocking
  if (['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(order.order_status)) {
    const err = new Error(`Cannot cancel an order that is already ${order.order_status}.`);
    err.status = 400;
    err.response = {
      status: 400,
      data: {
        error: `Cannot cancel an order that is already ${order.order_status}.`,
        order_status: order.order_status,
        order_number: order.order_number,
      },
    };
    throw err;
  }

  // Atomically transition status
  order.order_status = 'CANCELLED';

  // Restore stock exactly once
  if (Array.isArray(order.items)) {
    for (const item of order.items) {
      const p = products.find((x) => x.id === (item.productId || item.product_id));
      if (p) {
        p.stock = (p.stock || 0) + item.quantity;
      }
    }
  }

  return {
    message: 'Order has been successfully cancelled.',
    order,
  };
}

/** GET /api/orders/:id */
export async function getOrderById(id) {
  await delay(40);
  const isId = /^\d+$/.test(String(id).trim());
  const order = mockOrders.find((o) => (isId ? o.id === Number(id) : o.order_number === String(id).trim()));

  if (!order) {
    const err = new Error('Order not found.');
    err.status = 404;
    err.response = { status: 404, data: { error: 'Order not found.' } };
    throw err;
  }

  return order;
}

/** GET /api/orders */
export async function getUserOrders() {
  await delay(40);
  return [...mockOrders];
}

/** Reset mockDb state for tests */
export function resetMockDb() {
  mockCart = [];
  mockOrders = [
    {
      id: 1,
      order_number: 'ORD-2026-10-001',
      user_id: 1,
      total_amount: 44990,
      final_amount: 44990,
      order_status: 'PENDING',
      payment_status: 'PAID',
      items: [
        {
          id: 1,
          productId: 1,
          product_id: 1,
          title: 'Voltas 1.5 Ton 5★ Inverter Split AC',
          price: 44990,
          quantity: 1,
        },
      ],
    },
  ];
}

/* ---------- Mock Admin Operations ---------- */
let mockCategories = [...categories];
let mockBrands = [...brands];
let mockOffers = [...offers];
let mockUsers = [
  { id: 1, email: 'admin@volthaus.in', full_name: 'Store Administrator', phone: '9876543210', role: 'ADMIN', created_at: '2026-01-01T00:00:00.000Z', order_count: 5, total_spent: 189950 },
  { id: 2, email: 'customer@volthaus.in', full_name: 'Rahul Sharma', phone: '9845012345', role: 'CUSTOMER', created_at: '2026-02-15T00:00:00.000Z', order_count: 2, total_spent: 74980 },
  { id: 3, email: 'priya.nair@example.com', full_name: 'Priya Nair', phone: '9812345678', role: 'CUSTOMER', created_at: '2026-03-10T00:00:00.000Z', order_count: 1, total_spent: 38490 },
];

export async function getAdminStats() {
  await delay(50);
  return {
    totalProducts: products.length,
    totalCustomers: mockUsers.filter((u) => u.role === 'CUSTOMER').length,
    totalOrders: mockOrders.length,
    totalRevenue: mockOrders.reduce((sum, o) => sum + (o.final_amount || 0), 0),
    lowStockAlerts: products.filter((p) => (p.stock || p.stock_quantity || 0) <= 5).length,
  };
}

export async function createProduct(data) {
  await delay(50);
  const id = products.length + 1;
  const newProd = {
    id,
    title: data.title,
    slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    base_price: parseFloat(data.base_price),
    discount_price: data.discount_price ? parseFloat(data.discount_price) : null,
    stock: parseInt(data.stock_quantity || 10, 10),
    stock_quantity: parseInt(data.stock_quantity || 10, 10),
    category_id: data.category_id,
    brand_id: data.brand_id,
    description: data.description,
    primary_image: data.image_url || null,
  };
  products.unshift(newProd);
  return toApiProduct(newProd);
}

export async function updateProduct(id, data) {
  await delay(50);
  const p = products.find((x) => x.id === Number(id));
  if (p) {
    if (data.title) p.title = data.title;
    if (data.base_price) p.base_price = parseFloat(data.base_price);
    if (data.discount_price !== undefined) p.discount_price = data.discount_price ? parseFloat(data.discount_price) : null;
    if (data.description !== undefined) p.description = data.description;
  }
  return p ? toApiProduct(p) : null;
}

export async function deleteProduct(id) {
  await delay(50);
  const idx = products.findIndex((x) => x.id === Number(id));
  if (idx !== -1) products.splice(idx, 1);
  return { message: 'Product deleted successfully.' };
}

export async function updateInventory(id, stock_quantity) {
  await delay(50);
  const p = products.find((x) => x.id === Number(id));
  if (p) {
    p.stock = parseInt(stock_quantity, 10);
    p.stock_quantity = p.stock;
  }
  return { product_id: id, stock_quantity };
}

export async function getAllOrdersAdmin() {
  await delay(50);
  return mockOrders.map((o) => ({
    ...o,
    customer_name: 'Rahul Sharma',
    customer_email: 'customer@volthaus.in',
    item_count: o.items?.length || 1,
  }));
}

export async function updateOrderStatus(id, order_status) {
  await delay(50);
  const o = mockOrders.find((x) => x.id === Number(id));
  if (o) o.order_status = order_status;
  return o;
}

export async function getOffersAdmin() {
  await delay(50);
  return [...mockOffers];
}

export async function createOfferAdmin(data) {
  await delay(50);
  const newOffer = {
    id: mockOffers.length + 1,
    code: data.code.toUpperCase(),
    title: data.title,
    discount_percent: parseFloat(data.discount_percent),
    max_discount: data.max_discount ? parseFloat(data.max_discount) : null,
    min_order_amount: data.min_order_amount ? parseFloat(data.min_order_amount) : 0,
    description: data.description || '',
    is_active: true,
  };
  mockOffers.unshift(newOffer);
  return newOffer;
}

export async function updateOfferAdmin(id, data) {
  await delay(50);
  const o = mockOffers.find((x) => x.id === Number(id));
  if (o) {
    if (data.is_active !== undefined) o.is_active = data.is_active;
    if (data.title) o.title = data.title;
    if (data.discount_percent) o.discount_percent = parseFloat(data.discount_percent);
  }
  return o;
}

export async function deleteOfferAdmin(id) {
  await delay(50);
  const idx = mockOffers.findIndex((x) => x.id === Number(id));
  if (idx !== -1) mockOffers.splice(idx, 1);
  return { message: 'Offer deleted successfully.' };
}

export async function getCategoriesAdmin() {
  await delay(50);
  return mockCategories.map((c) => ({
    ...c,
    product_count: products.filter((p) => p.category_id === c.id || p.categorySlug === c.slug).length,
  }));
}

export async function createCategoryAdmin(data) {
  await delay(50);
  const newCat = {
    id: mockCategories.length + 1,
    name: data.name,
    slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: data.description || '',
    image_url: data.image_url || '',
    display_order: parseInt(data.display_order || 0, 10),
    product_count: 0,
  };
  mockCategories.push(newCat);
  return newCat;
}

export async function updateCategoryAdmin(id, data) {
  await delay(50);
  const c = mockCategories.find((x) => x.id === Number(id));
  if (c) Object.assign(c, data);
  return c;
}

export async function deleteCategoryAdmin(id) {
  await delay(50);
  const idx = mockCategories.findIndex((x) => x.id === Number(id));
  if (idx !== -1) mockCategories.splice(idx, 1);
  return { message: 'Category deleted successfully.' };
}

export async function getBrandsAdmin() {
  await delay(50);
  return mockBrands.map((b) => ({
    ...b,
    product_count: products.filter((p) => p.brand_id === b.id || p.brandSlug === b.slug).length,
  }));
}

export async function createBrandAdmin(data) {
  await delay(50);
  const newBrand = {
    id: mockBrands.length + 1,
    name: data.name,
    slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    logo_url: data.logo_url || '',
    product_count: 0,
  };
  mockBrands.push(newBrand);
  return newBrand;
}

export async function updateBrandAdmin(id, data) {
  await delay(50);
  const b = mockBrands.find((x) => x.id === Number(id));
  if (b) Object.assign(b, data);
  return b;
}

export async function deleteBrandAdmin(id) {
  await delay(50);
  const idx = mockBrands.findIndex((x) => x.id === Number(id));
  if (idx !== -1) mockBrands.splice(idx, 1);
  return { message: 'Brand deleted successfully.' };
}

export async function getUsersAdmin() {
  await delay(50);
  return [...mockUsers];
}

export async function getUserDetailsAdmin(id) {
  await delay(50);
  const u = mockUsers.find((x) => x.id === Number(id));
  const orders = mockOrders.filter((o) => o.user_id === Number(id));
  return { user: u, orders };
}

export async function getReviewsAdmin() {
  await delay(50);
  return localReviews.map((r) => {
    const p = products.find((x) => x.id === (r.productId || r.product_id));
    return {
      id: r.id,
      product_id: r.productId || r.product_id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      created_at: r.createdAt,
      product_title: p?.title || p?.name || 'Electronics Product',
      product_slug: p?.slug || '',
      reviewer_name: r.userName || 'Verified Buyer',
      reviewer_email: 'buyer@volthaus.in',
    };
  });
}

export async function deleteReviewAdmin(id) {
  await delay(50);
  const idx = localReviews.findIndex((x) => x.id === Number(id));
  if (idx !== -1) localReviews.splice(idx, 1);
  return { message: 'Review deleted successfully.' };
}
