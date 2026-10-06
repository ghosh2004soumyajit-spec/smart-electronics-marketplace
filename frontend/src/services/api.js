/**
 * API facade — the ONLY module that talks to data.
 *
 * Connected to live Node.js + Express + PostgreSQL backend on http://localhost:5000/api
 */

import axios from 'axios';
import * as mock from './mockDb.js';
import { categories as seedCategories } from '../data/seed.js';

// ─── Backend → UI shape normalizers ───────────────────────────────────────────

/**
 * Map from DB category slug → slug used in the local UI seed.
 * The DB now uses 'smartphones' directly; no alias needed.
 * All slugs map 1:1.
 */
const SLUG_ALIAS = {};

/**
 * Enrich a bare DB category row with UI metadata from the local seed.
 * The seed holds art keys, facet definitions, finder configs, etc. that
 * the backend schema doesn't store.
 */
function normalizeCategoryFromDB(dbCat) {
  const uiSlug = SLUG_ALIAS[dbCat.slug] ?? dbCat.slug;
  const seed = seedCategories.find((c) => c.slug === uiSlug) ?? {};
  return {
    // DB fields
    id: dbCat.id,
    slug: dbCat.slug,
    name: dbCat.name,
    description: dbCat.description,
    image_url: dbCat.image_url,
    display_order: dbCat.display_order,
    productCount: dbCat.productCount ?? 0,
    // UI fields from local seed (fallbacks so rendering never crashes)
    index: seed.index ?? String(dbCat.display_order ?? dbCat.id).padStart(2, '0'),
    short: seed.short ?? dbCat.name,
    tagline: seed.tagline ?? dbCat.description ?? '',
    sizeGuide: seed.sizeGuide ?? '',
    art: seed.art ?? 'tv',
    cardSpecs: seed.cardSpecs ?? [],
    facets: seed.facets ?? [],
    finder: seed.finder ?? null,
    hero: seed.hero ?? null,
  };
}

/**
 * DB category slug → hero spec key mapping for product normalization.
 * Used to extract the primary highlighted spec (e.g. tonnage for ACs).
 */
const CATEGORY_HERO_KEY = {
  'air-conditioners': 'tonnage',
  refrigerators: 'capacity_l',
  'washing-machines': 'capacity_kg',
  televisions: 'screen_size_inch',
  smartphones: 'storage_gb',
};

const CATEGORY_CARD_SPECS = {
  'air-conditioners': ['energy_rating', 'inverter', 'room_size_sqft'],
  refrigerators: ['door_type', 'energy_rating', 'inverter_compressor'],
  'washing-machines': ['load_type', 'energy_rating', 'rpm'],
  televisions: ['resolution', 'panel', 'refresh_rate_hz'],
  smartphones: ['ram_gb', 'battery_mah', 'camera_mp'],
};

const CATEGORY_ART = {
  'air-conditioners': 'ac-split',
  refrigerators: 'fridge-dd',
  'washing-machines': 'washer-fl',
  televisions: 'tv',
  smartphones: 'phone',
};

/**
 * Convert a flat DB specs JSONB object into the nested UI spec shape.
 * DB stores: { "tonnage": "1.5", "star_rating": 5 }
 * UI expects: { tonnage: { label: "Capacity", value: 1.5, unit: "ton" } }
 */
const SPEC_META = {
  tonnage: { label: 'Capacity', unit: 'ton' },
  star_rating: { label: 'Energy rating', unit: '★' },
  energy_rating: { label: 'Energy rating', unit: '★' },
  type: { label: 'Type' },
  ac_type: { label: 'Type' },
  room_size_sqft: { label: 'Room coverage', unit: 'sq ft' },
  coverage: { label: 'Room coverage', unit: 'sq ft' },
  inverter: { label: 'Inverter' },
  copper_condenser: { label: 'Condenser' },
  capacity_l: { label: 'Gross capacity', unit: 'L' },
  capacity_kg: { label: 'Wash capacity', unit: 'kg' },
  capacity_bucket: { label: 'Capacity band' },
  door_type: { label: 'Door type' },
  defrost_type: { label: 'Defrost' },
  cooling: { label: 'Cooling' },
  inverter_compressor: { label: 'Inverter compressor' },
  load_type: { label: 'Load type' },
  loading_type: { label: 'Load type' },
  rpm: { label: 'Spin speed', unit: 'RPM' },
  steam_wash: { label: 'Steam wash' },
  screen_size_inch: { label: 'Screen', unit: '"' },
  screen_inches: { label: 'Screen', unit: '"' },
  screen_bucket: { label: 'Size band' },
  display_tech: { label: 'Panel' },
  panel: { label: 'Panel' },
  resolution: { label: 'Resolution' },
  refresh_rate_hz: { label: 'Refresh rate', unit: 'Hz' },
  refresh_rate: { label: 'Refresh rate', unit: 'Hz' },
  smart_os: { label: 'Smart OS' },
  hdr: { label: 'HDR' },
  storage_gb: { label: 'Storage', unit: 'GB' },
  ram_gb: { label: 'RAM', unit: 'GB' },
  battery_mah: { label: 'Battery', unit: 'mAh' },
  battery_bucket: { label: 'Battery' },
  display_type: { label: 'Display type' },
  display_inches: { label: 'Display', unit: '"' },
  camera_mp: { label: 'Camera', unit: 'MP' },
  processor: { label: 'Processor' },
  warranty_years: { label: 'Warranty', unit: 'yr' },
  noise_db: { label: 'Noise level', unit: 'dB' },
};

function buildSpecs(rawSpecs) {
  if (!rawSpecs || typeof rawSpecs !== 'object') return {};
  const result = {};
  for (const [k, v] of Object.entries(rawSpecs)) {
    const meta = SPEC_META[k];
    const targetKey = meta?.key ?? k;
    const displayVal = typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v;
    result[targetKey] = {
      label: meta?.label ?? k,
      value: displayVal,
      unit: meta?.unit ?? null,
    };
  }
  return result;
}

/**
 * Normalise a backend product row to the UI shape that Hero, ProductCard, etc. consume.
 */
export function normalizeProductFromDB(p) {
  const catSlug = p.category_slug ?? '';
  const specs = buildSpecs(p.specs ?? {});
  const heroKey = CATEGORY_HERO_KEY[catSlug];
  const heroSpec = heroKey ? (specs[heroKey] ?? null) : null;
  const cardSpecKeys = CATEGORY_CARD_SPECS[catSlug] ?? [];
  const cardSpecs = cardSpecKeys.map((k) => specs[k]).filter(Boolean);
  const art = CATEGORY_ART[catSlug] ?? 'tv';
  const mrp = parseFloat(p.base_price ?? p.mrp ?? 0);
  const sale = parseFloat(p.discount_price ?? p.sale ?? mrp);

  return {
    id: p.id,
    slug: p.slug,
    name: p.title ?? p.name ?? '',
    title: p.title ?? p.name ?? '',
    categorySlug: catSlug,
    brandSlug: p.brand_slug ?? '',
    brand: { slug: p.brand_slug ?? '', name: p.brand_name ?? '' },
    category: { slug: catSlug, name: p.category_name ?? '' },
    tagline: p.description ?? '',
    description: p.description ?? '',
    art,
    primary_image: p.primary_image ?? null,
    price: { mrp, sale },
    base_price: mrp,
    discount_price: sale,
    rating: parseFloat(p.avg_rating ?? p.rating ?? 0),
    reviewCount: parseInt(p.review_count ?? p.reviewCount ?? 0, 10),
    stock: parseInt(p.stock_quantity ?? p.stock ?? 0, 10),
    stock_quantity: parseInt(p.stock_quantity ?? p.stock ?? 0, 10),
    inStock: (p.stock_quantity ?? p.stock ?? 0) > 0,
    specs,
    heroSpec,
    cardSpecs,
    discountPct: mrp > sale ? Math.round(((mrp - sale) / mrp) * 100) : 0,
    is_featured: p.is_featured ?? false,
    badge: p.badge ?? null,
    images: p.images ?? (p.primary_image ? [{ image_url: p.primary_image, is_primary: true }] : []),
  };
}

const env = import.meta.env ?? {};
const USE_MOCK = (env.VITE_USE_MOCK ?? 'false') === 'true';
const BASE = env.VITE_API_URL || 'http://localhost:5000/api';

const http = axios.create({ baseURL: BASE, timeout: 10000 });

// Attach JWT token automatically to every request if present
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('volthaus.token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  /* AUTH */
  login: (credentials) => http.post('/auth/login', credentials).then((r) => r.data),
  register: (userData) => http.post('/auth/register', userData).then((r) => r.data),
  getMe: () => http.get('/auth/me').then((r) => r.data),

  /* CATALOG */
  listCategories: () =>
    USE_MOCK
      ? mock.listCategories()
      : http.get('/categories').then((r) => (r.data || []).map(normalizeCategoryFromDB)),
  listBrands: () => (USE_MOCK ? mock.listBrands() : http.get('/brands').then((r) => r.data)),
  listProducts: (params = {}) =>
    USE_MOCK
      ? mock.listProducts(params)
      : http.get('/products', { params: serialize(params) }).then((r) => ({
          ...r.data,
          items: (r.data.items || []).map(normalizeProductFromDB),
        })),
  getProduct: (idOrSlug) =>
    USE_MOCK
      ? mock.getProduct(idOrSlug)
      : http.get(`/products/${idOrSlug}`).then((r) => normalizeProductFromDB(r.data)),
  listFeatured: () =>
    USE_MOCK
      ? mock.listFeatured()
      : http.get('/products', { params: { featured: true } }).then((r) =>
          (r.data.items || []).map(normalizeProductFromDB)
        ),
  searchSuggest: (q) =>
    USE_MOCK
      ? mock.searchSuggest(q)
      : http.get('/products/suggest', { params: { q } }).then((r) => {
          const rawProds = Array.isArray(r.data) ? r.data : [];
          return { products: rawProds.map(normalizeProductFromDB), categories: [] };
        }),
  listOffers: () => (USE_MOCK ? mock.listOffers() : http.get('/offers').then((r) => r.data)),

  /* CART */
  getCart: () => (USE_MOCK ? mock.getCart() : http.get('/cart').then((r) => r.data)),
  addToCart: (productId, quantity = 1) =>
    USE_MOCK ? mock.addToCart(productId, quantity) : http.post('/cart', { productId, quantity }).then((r) => r.data),
  updateCartItem: (productId, quantity) =>
    USE_MOCK ? mock.updateCartItem(productId, quantity) : http.put(`/cart/${productId}`, { quantity }).then((r) => r.data),
  removeCartItem: (productId) =>
    USE_MOCK ? mock.removeCartItem(productId) : http.delete(`/cart/${productId}`).then((r) => r.data),

  /* WISHLIST */
  getWishlist: () => (USE_MOCK ? mock.getWishlist() : http.get('/wishlist').then((r) => r.data)),
  addToWishlist: (productId) =>
    USE_MOCK ? mock.addToWishlist(productId) : http.post('/wishlist', { productId }).then((r) => r.data),
  removeFromWishlist: (productId) =>
    USE_MOCK ? mock.removeFromWishlist(productId) : http.delete(`/wishlist/${productId}`).then((r) => r.data),

  /* DELIVERY */
  checkPincode: (pincode) =>
    USE_MOCK ? mock.checkPincode(pincode) : http.get('/delivery/check', { params: { pincode } }).then((r) => r.data),

  /* ORDERS */
  createOrder: (orderData) =>
    USE_MOCK ? mock.createOrder(orderData) : http.post('/orders', orderData).then((r) => r.data),
  getUserOrders: () => (USE_MOCK ? mock.getUserOrders() : http.get('/orders').then((r) => r.data)),
  getOrderById: (id) => (USE_MOCK ? mock.getOrderById(id) : http.get(`/orders/${id}`).then((r) => r.data)),
  cancelOrder: (id) => (USE_MOCK ? mock.cancelOrder(id) : http.put(`/orders/${id}/cancel`).then((r) => r.data)),

  /* REVIEWS */
  listReviews: (productId) =>
    USE_MOCK ? mock.listReviews(productId) : http.get(`/products/${productId}/reviews`).then((r) => r.data),
  submitReview: (productId, reviewData) =>
    USE_MOCK
      ? mock.submitReview(productId, reviewData)
      : http.post(`/products/${productId}/reviews`, reviewData).then((r) => r.data),

  /* ADMIN */
  getAdminStats: () => (USE_MOCK ? mock.getAdminStats() : http.get('/admin/stats').then((r) => r.data)),
  createProduct: (data) => (USE_MOCK ? mock.createProduct(data) : http.post('/admin/products', data).then((r) => r.data)),
  updateProduct: (id, data) => (USE_MOCK ? mock.updateProduct(id, data) : http.put(`/admin/products/${id}`, data).then((r) => r.data)),
  deleteProduct: (id) => (USE_MOCK ? mock.deleteProduct(id) : http.delete(`/admin/products/${id}`).then((r) => r.data)),
  updateInventory: (id, stock_quantity) => (USE_MOCK ? mock.updateInventory(id, stock_quantity) : http.put(`/admin/products/${id}/inventory`, { stock_quantity }).then((r) => r.data)),
  getAllOrdersAdmin: () => (USE_MOCK ? mock.getAllOrdersAdmin() : http.get('/admin/orders').then((r) => r.data)),
  updateOrderStatus: (id, order_status) => (USE_MOCK ? mock.updateOrderStatus(id, order_status) : http.put(`/admin/orders/${id}/status`, { order_status }).then((r) => r.data)),
  getOffersAdmin: () => (USE_MOCK ? mock.getOffersAdmin() : http.get('/admin/offers').then((r) => r.data)),
  createOfferAdmin: (data) => (USE_MOCK ? mock.createOfferAdmin(data) : http.post('/admin/offers', data).then((r) => r.data)),
  updateOfferAdmin: (id, data) => (USE_MOCK ? mock.updateOfferAdmin(id, data) : http.put(`/admin/offers/${id}`, data).then((r) => r.data)),
  deleteOfferAdmin: (id) => (USE_MOCK ? mock.deleteOfferAdmin(id) : http.delete(`/admin/offers/${id}`).then((r) => r.data)),
  getCategoriesAdmin: () => (USE_MOCK ? mock.getCategoriesAdmin() : http.get('/admin/categories').then((r) => r.data)),
  createCategoryAdmin: (data) => (USE_MOCK ? mock.createCategoryAdmin(data) : http.post('/admin/categories', data).then((r) => r.data)),
  updateCategoryAdmin: (id, data) => (USE_MOCK ? mock.updateCategoryAdmin(id, data) : http.put(`/admin/categories/${id}`, data).then((r) => r.data)),
  deleteCategoryAdmin: (id) => (USE_MOCK ? mock.deleteCategoryAdmin(id) : http.delete(`/admin/categories/${id}`).then((r) => r.data)),
  getBrandsAdmin: () => (USE_MOCK ? mock.getBrandsAdmin() : http.get('/admin/brands').then((r) => r.data)),
  createBrandAdmin: (data) => (USE_MOCK ? mock.createBrandAdmin(data) : http.post('/admin/brands', data).then((r) => r.data)),
  updateBrandAdmin: (id, data) => (USE_MOCK ? mock.updateBrandAdmin(id, data) : http.put(`/admin/brands/${id}`, data).then((r) => r.data)),
  deleteBrandAdmin: (id) => (USE_MOCK ? mock.deleteBrandAdmin(id) : http.delete(`/admin/brands/${id}`).then((r) => r.data)),
  getUsersAdmin: () => (USE_MOCK ? mock.getUsersAdmin() : http.get('/admin/users').then((r) => r.data)),
  getUserDetailsAdmin: (id) => (USE_MOCK ? mock.getUserDetailsAdmin(id) : http.get(`/admin/users/${id}`).then((r) => r.data)),
  getReviewsAdmin: () => (USE_MOCK ? mock.getReviewsAdmin() : http.get('/admin/reviews').then((r) => r.data)),
  deleteReviewAdmin: (id) => (USE_MOCK ? mock.deleteReviewAdmin(id) : http.delete(`/admin/reviews/${id}`).then((r) => r.data)),

  /* USER PROFILE & ADDRESSES */
  getProfile: () => http.get('/user/profile').then((r) => r.data),
  updateProfile: (data) => http.put('/user/profile', data).then((r) => r.data),
  getAddresses: () => http.get('/user/addresses').then((r) => r.data),
  addAddress: (data) => http.post('/user/addresses', data).then((r) => r.data),
  updateAddress: (id, data) => http.put(`/user/addresses/${id}`, data).then((r) => r.data),
  deleteAddress: (id) => http.delete(`/user/addresses/${id}`).then((r) => r.data),
  setDefaultAddress: (id) => http.put(`/user/addresses/${id}/default`).then((r) => r.data),

  /* Utility */
  countMatches: (params) =>
    USE_MOCK ? mock.countMatches(params) : http.get('/products', { params: serialize(params) }).then((r) => r.data.total),
  getCategorySync: (slug) => (USE_MOCK ? mock.getCategorySync(slug) : null),
};

export function serialize(params) {
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) continue;
    if (k === 'facets') {
      for (const [fk, vals] of Object.entries(v || {})) if (vals?.length) out[`f_${fk}`] = vals.join(',');
    } else if (k === 'ranges') {
      for (const [rk, r] of Object.entries(v || {}))
        if (r && (r.min != null || r.max != null)) out[`r_${rk}`] = `${r.min ?? ''}-${r.max ?? ''}`;
    } else if (k === 'inStockOnly' && v) {
      out.in_stock = 'true';
    } else if (k === 'categories' && Array.isArray(v) && v.length) {
      out.cat = v.join(',');
    } else if (k === 'brands' && Array.isArray(v) && v.length) {
      out.brand = v.join(',');
    } else if (!Array.isArray(v)) {
      out[k] = v;
    }
  }
  return out;
}

export function deserialize(searchParams) {
  const params = { facets: {}, ranges: {} };
  for (const [key, raw] of searchParams.entries()) {
    if (key.startsWith('f_')) {
      const vals = raw.split(',').filter(Boolean);
      if (vals.length) params.facets[key.slice(2)] = vals;
    } else if (key.startsWith('r_')) {
      const [min, max] = raw.split('-');
      params.ranges[key.slice(2)] = {
        min: min === '' ? null : Number(min),
        max: max === '' ? null : Number(max),
      };
    } else {
      params[key] = raw;
    }
  }
  if (params.q === '') delete params.q;
  if (params.page) params.page = Number(params.page);
  if (params.sort === '') delete params.sort;
  return params;
}

export default api;
