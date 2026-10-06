import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { formatPrice } from '../../lib/format';
import { IconSearch, IconArrowRight } from '../ui/Icons';
import { EASE } from '../../lib/motion';

/**
 * SearchBar — debounced (250ms), forgiving, keyboard-first.
 * Suggestions come from the same endpoint the backend will expose
 * (GET /products/suggest). Enter always lands on /search?q=… so nothing
 * dead-ends; arrows walk the list, Escape closes.
 */
export default function SearchBar({ onNavigate, autoFocus = false, id = 'site-search' }) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState({ products: [], categories: [] });
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(term, 250);
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  /* fetch suggestions */
  useEffect(() => {
    let alive = true;
    const q = debounced.trim();
    if (q.length < 2) {
      setItems({ products: [], categories: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    api.searchSuggest(q).then((res) => {
      if (!alive) return;
      setItems(res);
      setLoading(false);
      setActive(-1);
    });
    return () => {
      alive = false;
    };
  }, [debounced]);

  /* close on outside click */
  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  /* flat list for keyboard nav: categories, products, then "search all" */
  const rows = [
    ...items.categories.map((c) => ({ kind: 'cat', to: `/c/${c.slug}`, label: c.name, sub: `${c.productCount} products` })),
    ...items.products.map((p) => ({ kind: 'prod', to: `/p/${p.slug}`, label: p.name, sub: formatPrice(p.price.sale), art: p.art })),
    ...(term.trim().length >= 2 ? [{ kind: 'all', to: `/search?q=${encodeURIComponent(term.trim())}`, label: `Search everything for “${term.trim()}”`, sub: '' }] : []),
  ];

  const go = (to) => {
    navigate(to);
    setOpen(false);
    setTerm('');
    onNavigate?.();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % Math.max(rows.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a <= 0 ? rows.length - 1 : a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && rows[active]) go(rows[active].to);
      else if (term.trim()) go(`/search?q=${encodeURIComponent(term.trim())}`);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  const listId = `${id}-list`;

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (term.trim()) go(`/search?q=${encodeURIComponent(term.trim())}`);
        }}
      >
        <label htmlFor={id} className="sr-only">
          Search products
        </label>
        <div className="flex items-center gap-2 border border-line bg-paper px-3 transition-colors duration-200 focus-within:border-ink">
          <IconSearch size={16} className="shrink-0 text-ink3" />
          <input
            id={id}
            ref={inputRef}
            type="search"
            autoComplete="off"
            role="combobox"
            aria-expanded={open && rows.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            placeholder="Search “1.5 ton inverter”, “OLED”, “Samsung”…"
            className="w-full bg-transparent py-2.5 font-mono text-[12px] tracking-wide text-ink placeholder:text-ink3/70 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            autoFocus={autoFocus}
          />
          {loading && <span className="h-1.5 w-1.5 shrink-0 animate-blink rounded-full bg-volt" aria-hidden="true" />}
        </div>
      </form>

      {/* suggestions */}
      <AnimatePresence>
        {open && rows.length > 0 && (
          <motion.div
            id={listId}
            role="listbox"
            aria-label="Search suggestions"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.22, ease: EASE.sheet }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 border border-ink bg-card shadow-lift"
          >
            {rows.map((r, i) => (
              <button
                key={`${r.kind}-${r.to}-${i}`}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.to)}
                className={`flex w-full items-center justify-between gap-3 border-b border-line px-3.5 py-2.5 text-left last:border-b-0 ${
                  i === active ? 'bg-ink text-paper' : 'text-ink hover:bg-paper2'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[10px] uppercase tracking-[0.14em] opacity-60">
                    {r.kind === 'cat' ? 'Category' : r.kind === 'all' ? 'Full search' : 'Product'}
                  </span>
                  <span className="block truncate text-[13px] font-medium leading-snug">{r.label}</span>
                </span>
                {r.sub && <span className="shrink-0 font-mono text-[11px] tnum opacity-70">{r.sub}</span>}
                {r.kind === 'all' && <IconArrowRight size={15} className="shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
