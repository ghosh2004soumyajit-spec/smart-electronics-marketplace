import { useEffect, useState } from 'react';
import { filterUpdaters, activeFilterCount } from '../../lib/urlFilters';
import { formatPrice } from '../../lib/format';
import { IconCheck } from '../ui/Icons';

/**
 * FilterPanel — shared between the desktop sidebar and the mobile sheet.
 * Every control maps 1:1 to a URL parameter (see lib/urlFilters.js), so any
 * filtered view is shareable and back-button safe.
 *
 * `mode` decides which groups appear:
 *  - category mode (/c/:slug): brand list + spec facets + price
 *  - brand mode (/b/:slug): category list + price
 *  - all/search mode: category list + brand list + price
 */
export default function FilterPanel({ state, setState, mode, category, data, idPrefix = 'fp' }) {
  const upd = (fn) => (...args) => setState((s) => fn(s, ...args));

  return (
    <div className="space-y-8">
      {mode !== 'category' && (
        <Group title="Category" n="01">
          <OptionList
            idPrefix={`${idPrefix}-cat`}
            options={(data.categoryOptions || []).map((c) => ({
              value: c.slug,
              label: c.name,
              count: data.categoryCounts?.[c.slug] ?? 0,
            }))}
            selected={state.categories || []}
            onToggle={(v) =>
              setState((s) => ({
                ...s,
                page: 1,
                categories: (s.categories || []).includes(v)
                  ? (s.categories || []).filter((x) => x !== v)
                  : [...(s.categories || []), v],
              }))
            }
          />
        </Group>
      )}

      {mode !== 'brand' && (
        <Group title="Brand" n="02">
          <OptionList
            idPrefix={`${idPrefix}-brand`}
            options={(data.brandOptions || []).map((b) => ({
              value: b.slug,
              label: b.name,
              count: data.brandCounts?.[b.slug] ?? 0,
            }))}
            selected={state.brands}
            onToggle={upd(filterUpdaters.toggleBrand)}
          />
        </Group>
      )}

      {mode === 'category' && category && (
        <>
          {category.facets.map((facet, fi) => (
            <Group key={facet.key} title={facet.label} n={String(fi + 3).padStart(2, '0')} hint={facet.hint}>
              <OptionList
                idPrefix={`${idPrefix}-${facet.key}`}
                options={facet.options.map((opt) => ({
                  value: opt,
                  label: `${opt}${facet.unit ? ' ' + facet.unit : ''}${facet.suffix || ''}`,
                  count: data.facetCounts?.[facet.key]?.[opt] ?? 0,
                }))}
                selected={state.facets[facet.key] || []}
                onToggle={(v) => upd(filterUpdaters.toggleFacet)(facet.key, v)}
              />
            </Group>
          ))}
        </>
      )}

      <Group title="Price (₹)" n="99">
        <PriceFilter state={state} setState={setState} category={category} />
      </Group>

      {activeFilterCount(state) > 0 && (
        <button type="button" onClick={upd((s) => filterUpdaters.clearAll(s))} className="ul-link label text-volt font-bold">
          Clear all filters
        </button>
      )}
    </div>
  );
}

function Group({ title, n, hint, children }) {
  return (
    <fieldset>
      <legend className="flex w-full items-baseline gap-3">
        <span className="label-volt font-bold">{n}</span>
        <span className="label font-bold !text-ink">{title}</span>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </legend>
      {hint && <p className="mt-2 font-mono text-[10.5px] leading-relaxed text-ink3">{hint}</p>}
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

/** Accessible checkbox list with live result counts; zero-count options stay visible but dimmed */
function OptionList({ options, selected, onToggle, idPrefix }) {
  return (
    <ul className="space-y-0.5">
      {options.map((o) => {
        const checked = selected.includes(o.value);
        const id = `${idPrefix}-${o.value}`;
        const zero = o.count === 0 && !checked;
        return (
          <li key={o.value}>
            <label
              htmlFor={id}
              className={`group flex cursor-pointer items-center gap-2.5 py-1.5 text-[13px] transition-colors ${
                zero ? 'text-ink3/50' : 'text-ink2 group-hover:text-ink'
              }`}
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(o.value)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`grid h-[17px] w-[17px] shrink-0 place-items-center border transition-all duration-150
                  ${checked ? 'border-volt bg-volt text-paper' : 'border-line2 bg-paper group-hover:border-ink'}
                  peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-volt`}
              >
                {checked && <IconCheck size={11} strokeWidth={3} />}
              </span>
              <span className={`flex-1 ${checked ? 'font-medium text-ink' : ''}`}>{o.label}</span>
              <span className="label tnum">{o.count}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/** Price band: quick presets (from the category's budget rules) + manual min/max */
function PriceFilter({ state, setState, category }) {
  const [min, setMin] = useState(state.priceMin ?? '');
  const [max, setMax] = useState(state.priceMax ?? '');

  useEffect(() => {
    setMin(state.priceMin ?? '');
    setMax(state.priceMax ?? '');
  }, [state.priceMin, state.priceMax]);

  const apply = () => {
    const lo = min === '' ? null : Number(min);
    const hi = max === '' ? null : Number(max);
    if (lo != null && hi != null && lo > hi) {
      setState((s) => filterUpdaters.setPrice(s, hi, lo)); // swap reversed input, don't scold
      return;
    }
    setState((s) => filterUpdaters.setPrice(s, lo, hi));
  };

  const presets = category?.finder?.budgets || [
    { label: 'Under ₹15,000', min: 0, max: 15000 },
    { label: '₹15,000 – ₹30,000', min: 15000, max: 30000 },
    { label: '₹30,000 – ₹60,000', min: 30000, max: 60000 },
    { label: '₹60,000+', min: 60000, max: null },
  ];

  const presetActive = (b) =>
    (b.min === 0 ? state.priceMin == null || state.priceMin === 0 : state.priceMin === b.min) &&
    state.priceMax === (b.max ?? null) &&
    (b.min === 0 ? true : state.priceMin === b.min);

  return (
    <div>
      <ul className="space-y-0.5">
        {presets.map((b) => (
          <li key={b.label}>
            <button
              type="button"
              onClick={() => setState((s) => filterUpdaters.setPrice(s, b.min || null, b.max))}
              aria-pressed={presetActive(b)}
              className={`w-full py-1.5 text-left text-[13px] transition-colors ${
                presetActive(b) ? 'font-medium text-volt' : 'text-ink2 hover:text-ink'
              }`}
            >
              <span className={presetActive(b) ? 'text-volt' : 'text-line2'}>{presetActive(b) ? '■' : '□'}</span>{' '}
              {b.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-2">
        <label className="sr-only" htmlFor="price-min">Minimum price</label>
        <input
          id="price-min"
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="Min"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          onBlur={apply}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          className="w-full border border-line bg-paper px-2.5 py-2 font-mono text-[12px] tnum placeholder:text-ink3/60 focus:border-ink focus:outline-none"
        />
        <span className="text-ink3" aria-hidden="true">—</span>
        <label className="sr-only" htmlFor="price-max">Maximum price</label>
        <input
          id="price-max"
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onBlur={apply}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          className="w-full border border-line bg-paper px-2.5 py-2 font-mono text-[12px] tnum placeholder:text-ink3/60 focus:border-ink focus:outline-none"
        />
      </div>
      {(state.priceMin != null || state.priceMax != null) && (
        <p className="label mt-2">
          Active: {state.priceMin != null ? formatPrice(state.priceMin) : '₹0'} –{' '}
          {state.priceMax != null ? formatPrice(state.priceMax) : 'any'}
        </p>
      )}
    </div>
  );
}
