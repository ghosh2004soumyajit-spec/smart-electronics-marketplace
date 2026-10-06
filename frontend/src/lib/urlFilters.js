/**
 * URL-synced filter state for the listing page.
 * Filters live in the query string so any filtered view is shareable and
 * back-button friendly: /c/air-conditioners?brand=voltas&price=30000-45000&f_tonnage=1.5&sort=price-asc&page=2
 */

import { serialize, deserialize } from '../services/api.js';

/**
 * Read the full filter state from a URLSearchParams object.
 */
export function readFilters(sp) {
  const p = deserialize(sp);
  const [priceMin, priceMax] = (p.price || '').split('-');
  return {
    q: p.q || '',
    category: p.category || null,
    categories: p.cat ? String(p.cat).split(',').filter(Boolean) : [],
    brands: p.brand ? String(p.brand).split(',').filter(Boolean) : [],
    priceMin: priceMin ? Number(priceMin) : null,
    priceMax: priceMax ? Number(priceMax) : null,
    facets: p.facets || {},
    ranges: p.ranges || {},
    sort: p.sort || 'featured',
    page: p.page || 1,
  };
}

/**
 * Write filter state back to URLSearchParams (pure — caller decides to replace/push).
 * Empty values are dropped so URLs stay clean and short.
 */
export function writeFilters(state) {
  const sp = new URLSearchParams();
  if (state.q) sp.set('q', state.q);
  if (state.categories?.length) sp.set('cat', state.categories.join(','));
  if (state.brands?.length) sp.set('brand', state.brands.join(','));
  if (state.priceMin != null || state.priceMax != null) {
    sp.set('price', `${state.priceMin ?? ''}-${state.priceMax ?? ''}`);
  }
  const flat = serialize({ facets: state.facets, ranges: state.ranges });
  for (const [k, v] of Object.entries(flat)) sp.set(k, v);
  if (state.sort && state.sort !== 'featured') sp.set('sort', state.sort);
  if (state.page > 1) sp.set('page', String(state.page));
  return sp;
}

/** Count of active (non-default) filters — for the mobile "Filters (3)" button */
export function activeFilterCount(state) {
  let n = 0;
  n += state.categories?.length ? 1 : 0;
  n += state.brands?.length ? 1 : 0;
  n += state.priceMin != null || state.priceMax != null ? 1 : 0;
  n += Object.values(state.facets || {}).reduce((acc, v) => acc + (v?.length ? 1 : 0), 0);
  n += Object.keys(state.ranges || {}).length;
  return n;
}

/** Human-readable chips describing every active filter (with removal callbacks) */
export function activeFilterChips(state, category, allCategories = []) {
  const chips = [];
  for (const c of state.categories || []) {
    const meta = allCategories.find((x) => x.slug === c);
    chips.push({ id: `cat:${c}`, label: meta?.name || c, type: 'category', value: c });
  }
  for (const b of state.brands || []) chips.push({ id: `brand:${b}`, label: b, type: 'brand', value: b });
  if (state.priceMin != null || state.priceMax != null) {
    const label =
      state.priceMin != null && state.priceMax != null
        ? `₹${Number(state.priceMin).toLocaleString('en-IN')} – ₹${Number(state.priceMax).toLocaleString('en-IN')}`
        : state.priceMin != null
          ? `From ₹${Number(state.priceMin).toLocaleString('en-IN')}`
          : `Up to ₹${Number(state.priceMax).toLocaleString('en-IN')}`;
    chips.push({ id: 'price', label, type: 'price' });
  }
  for (const [key, vals] of Object.entries(state.facets || {})) {
    const facet = category?.facets.find((f) => f.key === key);
    for (const v of vals)
      chips.push({
        id: `f:${key}:${v}`,
        label: `${facet?.label || key}: ${v}${facet?.unit ? ' ' + facet.unit : ''}${facet?.suffix || ''}`,
        type: 'facet',
        key,
        value: v,
      });
  }
  for (const [key, r] of Object.entries(state.ranges || {})) {
    chips.push({
      id: `r:${key}`,
      label: describeRange(key, r),
      type: 'range',
      key,
    });
  }
  return chips;
}

const RANGE_LABELS = {
  tonnage: 'Capacity',
  capacity_l: 'Capacity',
  capacity_kg: 'Capacity',
  screen_inches: 'Screen size',
  camera_mp: 'Camera',
  battery_mah: 'Battery',
  ram_gb: 'RAM',
};

function describeRange(key, r) {
  const name = RANGE_LABELS[key] || key;
  if (r.min != null && r.max != null) return `${name} ${r.min}–${r.max}`;
  if (r.min != null) return `${name} ≥ ${r.min}`;
  return `${name} ≤ ${r.max}`;
}

/** Immutable state updaters used by FilterPanel / chips / sort menu */
export const filterUpdaters = {
  toggleCategory: (state, slug) => ({
    ...state,
    page: 1,
    categories: (state.categories || []).includes(slug)
      ? (state.categories || []).filter((c) => c !== slug)
      : [...(state.categories || []), slug],
  }),
  toggleBrand: (state, brand) => ({
    ...state,
    page: 1,
    brands: state.brands.includes(brand)
      ? state.brands.filter((b) => b !== brand)
      : [...state.brands, brand],
  }),
  setPrice: (state, min, max) => ({ ...state, page: 1, priceMin: min, priceMax: max }),
  toggleFacet: (state, key, value) => {
    const cur = state.facets[key] || [];
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    const facets = { ...state.facets };
    if (next.length) facets[key] = next;
    else delete facets[key];
    return { ...state, page: 1, facets };
  },
  removeRange: (state, key) => {
    const ranges = { ...state.ranges };
    delete ranges[key];
    return { ...state, page: 1, ranges };
  },
  setSort: (state, sort) => ({ ...state, page: 1, sort }),
  setPage: (state, page) => ({ ...state, page }),
  clearAll: (state) => ({ ...state, page: 1, categories: [], brands: [], priceMin: null, priceMax: null, facets: {}, ranges: {} }),
};
