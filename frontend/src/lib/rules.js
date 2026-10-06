/**
 * Rule-based recommendation logic — plain rules, no ML (per scope).
 * The home "finder" and the future /find flow both compile user answers
 * into listing URL params through here, so the rules live in ONE place.
 */

import { categories } from '../data/seed.js';

export const getCategory = (slug) => categories.find((c) => c.slug === slug);

/**
 * Compile finder answers into product-query params.
 *
 * @param {string} categorySlug
 * @param {{ budgetIdx?: number, needIdx?: number }} answers
 * @returns {{ priceMin: number|null, priceMax: number|null, facets: object, ranges: object, explain: string[] }}
 *   `explain` holds human-readable rule sentences shown next to matches —
 *   recommendations must justify themselves ("1.5 ton because your room is ~180 sq ft").
 */
export function compileRules(categorySlug, { budgetIdx = null, needIdx = null } = {}) {
  const cat = getCategory(categorySlug);
  const out = { priceMin: null, priceMax: null, facets: {}, ranges: {}, explain: [] };
  if (!cat) return out;

  // Budget rule: a price band, never a single number.
  if (budgetIdx != null && cat.finder.budgets[budgetIdx]) {
    const b = cat.finder.budgets[budgetIdx];
    out.priceMin = b.min || null;
    out.priceMax = b.max;
    out.explain.push(`Budget ${b.label.toLowerCase()} — we filter on selling price, not inflated MRP.`);
  }

  // Need rule: room size / household size / distance / priority → spec range.
  if (needIdx != null && cat.finder.needOptions[needIdx]) {
    const n = cat.finder.needOptions[needIdx];
    if (n.rule.ranges) Object.assign(out.ranges, n.rule.ranges);
    if (n.rule.facets) {
      for (const [k, v] of Object.entries(n.rule.facets)) out.facets[k] = v;
    }
    out.explain.push(`${cat.finder.needLabel}: ${n.label} — matched against verified spec data.`);
  }

  return out;
}

/**
 * Score & explain a product against compiled rules (used by the future
 * recommendation page; the finder preview only needs the match count).
 * Higher is better; every point can be narrated back to the buyer.
 */
export function scoreProduct(product, rules) {
  let score = 0;
  const reasons = [];

  const price = product.price.sale;
  if (rules.priceMin != null && price < rules.priceMin) return { score: -1, reasons: [] };
  if (rules.priceMax != null && price > rules.priceMax) return { score: -1, reasons: [] };
  score += 2;
  reasons.push(`₹${price.toLocaleString('en-IN')} fits your budget band`);

  for (const [key, range] of Object.entries(rules.ranges || {})) {
    const spec = product.specs[key];
    if (!spec) continue;
    const v = Number(spec.value);
    const okMin = range.min == null || v >= range.min;
    const okMax = range.max == null || v <= range.max;
    if (!okMin || !okMax) return { score: -1, reasons: [] };
    score += 3;
    reasons.push(`${spec.label} ${spec.value}${spec.unit ? ' ' + spec.unit : ''} matches your requirement`);
  }

  for (const [key, values] of Object.entries(rules.facets || {})) {
    const spec = product.specs[key];
    if (!spec || !values.includes(String(spec.value))) return { score: -1, reasons: [] };
    score += 3;
    reasons.push(`${spec.label}: ${spec.value}`);
  }

  // In-stock products only (per the recommendation scope).
  if (product.stock <= 0) return { score: -1, reasons: [] };

  // Tiebreakers: rating, then energy rating where the spec exists.
  score += product.rating / 2;
  const er = product.specs.energy_rating;
  if (er) {
    score += Number(er.value) * 0.25;
    if (Number(er.value) >= 4) reasons.push(`${er.value}★ energy rating keeps running costs down`);
  }
  if (product.specs.inverter?.value === 'Yes') {
    score += 0.5;
    reasons.push('Inverter technology — quieter, cheaper to run');
  }

  return { score, reasons };
}
