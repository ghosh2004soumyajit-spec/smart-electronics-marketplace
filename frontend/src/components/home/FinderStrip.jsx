import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import api from '../../services/api';
import { categories } from '../../data/seed';
import { compileRules } from '../../lib/rules';
import { writeFilters } from '../../lib/urlFilters';
import { useDebounce } from '../../hooks/useDebounce';
import { IconArrowRight } from '../ui/Icons';
import { EASE } from '../../lib/motion';

/**
 * FinderStrip — the rule-based recommender's front door.
 * Three answered questions (category → budget → need) compile into explicit,
 * explainable filters and a live match count. No ML: every match can state
 * WHY it matched. Results open as a normal shareable listing URL.
 */
export default function FinderStrip() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [catIdx, setCatIdx] = useState(0);
  const [budgetIdx, setBudgetIdx] = useState(null);
  const [needIdx, setNeedIdx] = useState(null);

  const cat = categories[catIdx];

  /* Reset budget/need when the category changes (their options differ) */
  useEffect(() => {
    setBudgetIdx(null);
    setNeedIdx(null);
  }, [catIdx]);

  const rules = useMemo(() => compileRules(cat.slug, { budgetIdx, needIdx }), [cat, budgetIdx, needIdx]);

  /* Live match count — debounced so pill-clicking stays instant */
  const debouncedRules = useDebounce(rules, 250);
  const [count, setCount] = useState(null);
  const [counting, setCounting] = useState(false);
  useEffect(() => {
    let alive = true;
    setCounting(true);
    api
      .countMatches({
        category: cat.slug,
        priceMin: debouncedRules.priceMin,
        priceMax: debouncedRules.priceMax,
        facets: debouncedRules.facets,
        ranges: debouncedRules.ranges,
        inStockOnly: true,
      })
      .then((n) => {
        if (alive) {
          setCount(n);
          setCounting(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [cat, debouncedRules]);

  const apply = () => {
    const sp = writeFilters({
      q: '',
      brands: [],
      priceMin: rules.priceMin,
      priceMax: rules.priceMax,
      facets: rules.facets,
      ranges: rules.ranges,
      sort: 'featured',
      page: 1,
    });
    navigate(`/c/${cat.slug}?${sp.toString()}`);
  };

  return (
    <section id="finder" className="scroll-mt-20 border-y border-ink bg-ink text-paper" aria-labelledby="finder-title">
      <div className="mx-auto max-w-[1440px] px-4 py-16 lg:px-8 lg:py-20">
        {/* head */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-voltbright">03 — Rule-based finder</span>
              <span className="h-px w-16 bg-paper/25 sm:w-28" aria-hidden="true" />
            </div>
            <h2 id="finder-title" className="mt-4 font-display text-data2 font-bold balance">
              Three answers. Verified matches.
            </h2>
            <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-paper/70">
              Plain rules over verified spec data — no machine learning, no guessing. Every match
              can tell you <em className="not-italic text-paper">why</em> it matched.
            </p>
          </div>
        </div>

        {/* steps */}
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <Step n="01" label="Category">
            <div className="flex flex-wrap gap-2">
              {categories.map((c, i) => (
                <Pill key={c.slug} active={i === catIdx} onClick={() => setCatIdx(i)}>
                  {c.short}
                </Pill>
              ))}
            </div>
          </Step>

          <Step n="02" label="Budget">
            <div className="flex flex-wrap gap-2">
              {cat.finder.budgets.map((b, i) => (
                <Pill key={b.label} active={budgetIdx === i} onClick={() => setBudgetIdx(i)}>
                  {b.label}
                </Pill>
              ))}
            </div>
          </Step>

          <Step n="03" label={cat.finder.needLabel}>
            <div className="flex flex-wrap gap-2">
              {cat.finder.needOptions.map((n, i) => (
                <Pill key={n.label} active={needIdx === i} onClick={() => setNeedIdx(i)}>
                  {n.label}
                </Pill>
              ))}
            </div>
          </Step>
        </div>

        {/* result bar */}
        <div className="mt-10 flex flex-col gap-5 border-t border-paper/20 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div aria-live="polite">
            <p className="font-display text-3xl font-bold sm:text-4xl">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`${cat.slug}-${count}-${counting}`}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: EASE.snap }}
                  className="inline-block tnum"
                >
                  {counting ? '··' : count}
                </motion.span>
              </AnimatePresence>{' '}
              <span className="text-paper/70">datasheet{count === 1 ? '' : 's'} match</span>
            </p>
            {rules.explain.length > 0 && (
              <ul className="mt-2 space-y-1 font-mono text-[11px] uppercase tracking-wide text-paper/55">
                {rules.explain.map((e) => (
                  <li key={e}>→ {e}</li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={apply}
            disabled={counting || !count}
            className="btn-primary shrink-0 !bg-paper !text-ink hover:!bg-voltbright hover:!text-paper disabled:opacity-40"
          >
            {count ? `Show ${count} match${count === 1 ? '' : 'es'}` : 'No matches — widen budget'} <IconArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}

function Step({ n, label, children }) {
  return (
    <div>
      <p className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-voltbright">{n}</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/60">{label}</span>
      </p>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-all duration-200
        ${active ? 'border-voltbright bg-voltbright text-paper shadow-[3px_3px_0_0_rgba(245,242,234,0.25)]' : 'border-paper/30 text-paper/80 hover:border-paper hover:text-paper'}`}
    >
      {children}
    </button>
  );
}
