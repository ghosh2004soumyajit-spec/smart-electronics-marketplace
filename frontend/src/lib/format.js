/**
 * Formatting helpers — every rupee amount and spec value on the site
 * passes through here so numbers render consistently (tabular, Indian
 * digit grouping: 1,00,000).
 */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** ₹38,990 — used everywhere money appears */
export const formatPrice = (n) => inr.format(Math.round(Number(n) || 0));

/** Plain Indian grouping without the symbol (for animated counters) */
export const formatNumber = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0));

/** Discount percent between MRP and sale price */
export const discountPct = (mrp, price) =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

/** Compact counts: 12.3K for review counts etc. */
export const compact = (n) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return String(n);
};

/** "4.4" rating with one decimal */
export const formatRating = (r) => (Number(r) || 0).toFixed(1);

/**
 * Render one spec value with its unit, e.g. {value: 1.5, unit: 'ton'} → "1.5 ton".
 * Spec values come from product_specifications rows (key/value/unit).
 */
export const formatSpecValue = (spec) => {
  if (spec == null) return '—';
  if (typeof spec === 'object') {
    const v = spec.value ?? '—';
    return spec.unit ? `${v} ${spec.unit}` : String(v);
  }
  return String(spec);
};

/** Slugify free text (used for search suggestion links) */
export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
