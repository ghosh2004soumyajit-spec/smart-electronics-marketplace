import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import SearchBar from '../components/search/SearchBar';
import MagneticButton from '../components/ui/MagneticButton';
import { EASE } from '../lib/motion';

/**
 * 404 — on-brand: a missing datasheet, filed as an error sheet. The giant
 * "404" is set as data (outlined display type over a blueprint grid), not a
 * whimsical illustration.
 */
export default function NotFound() {
  useDocumentTitle('Page not found (404)');
  const reduce = useReducedMotion();

  return (
    <div className="relative overflow-hidden border-b border-line">
      <div className="bg-blueprint absolute inset-0" aria-hidden="true" />

      {/* oversized outlined 404 */}
      <motion.p
        initial={reduce ? false : { opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE.sheet }}
        className="pointer-events-none absolute -top-[4vw] left-1/2 -translate-x-1/2 select-none font-display text-[38vw] font-bold leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(25,24,23,0.14)]"
        aria-hidden="true"
      >
        404
      </motion.p>

      <div className="relative mx-auto flex max-w-2xl flex-col items-start px-4 py-28 lg:py-40">
        <div className="flex items-center gap-4">
          <span className="label-volt font-bold">ERR / 404 — DATASHEET NOT FOUND</span>
          <span className="h-px w-16 bg-line2" aria-hidden="true" />
        </div>

        <h1 className="mt-5 font-display text-[clamp(2.4rem,6vw,4rem)] font-bold uppercase leading-[0.98] tracking-tight">
          This page isn’t<br />in the catalog.
        </h1>

        <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-ink2">
          It may have been discontinued, or the link was mistyped. Nothing is broken on your end —
          let’s get you back to real spec sheets.
        </p>

        <div className="mt-8 w-full max-w-sm">
          <SearchBar id="404-search" />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <MagneticButton to="/">Back to home</MagneticButton>
          <Link to="/shop" className="ul-link font-mono text-[12px] uppercase tracking-[0.14em] text-ink2 transition-colors hover:text-ink">
            Browse all 31 datasheets
          </Link>
        </div>

        <p className="label mt-10">
          Filed under: broken links · recovery: browse or search · status: resolvable
        </p>
      </div>
    </div>
  );
}
