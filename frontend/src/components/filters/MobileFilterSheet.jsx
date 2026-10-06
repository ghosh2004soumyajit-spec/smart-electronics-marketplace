import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FilterPanel from './FilterPanel';
import { IconClose, IconSliders } from '../ui/Icons';
import { activeFilterCount } from '../../lib/urlFilters';
import { EASE } from '../../lib/motion';

/**
 * MobileFilterSheet — bottom sheet version of FilterPanel. Filters apply
 * live (single source of truth is the URL), so the footer button just
 * reports the current match count and closes. Escape + backdrop close it;
 * focus moves into the sheet and is trapped until it closes.
 */
export default function MobileFilterSheet({ open, onClose, panelProps, resultCount }) {
  const sheetRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && sheetRef.current) {
        // simple focus trap
        const f = sheetRef.current.querySelectorAll('a[href],button:not([disabled]),input,select,[tabindex]:not([tabindex="-1"])');
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <>
      {/* trigger button lives in the toolbar */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <motion.button
              type="button"
              aria-label="Close filters"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            />
            <motion.div
              ref={sheetRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%', transition: { duration: 0.22, ease: 'easeIn' } }}
              transition={{ duration: 0.38, ease: EASE.sheet }}
              className="absolute inset-x-0 bottom-0 flex max-h-[86vh] flex-col border-t-2 border-ink bg-paper"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
                  <IconSliders size={15} className="text-volt" /> Filters
                  {activeFilterCount(panelProps.state) > 0 && (
                    <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-volt px-1 font-bold text-paper tnum">
                      {activeFilterCount(panelProps.state)}
                    </span>
                  )}
                </p>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close filters"
                  className="grid h-9 w-9 place-items-center text-ink2 transition-colors hover:text-volt"
                >
                  <IconClose size={19} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                <FilterPanel idPrefix="msheet" {...panelProps} />
              </div>

              <div className="border-t border-line bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <button type="button" onClick={onClose} className="btn-primary w-full">
                  Show {resultCount ?? '—'} result{(resultCount ?? 0) === 1 ? '' : 's'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
