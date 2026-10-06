import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASE } from '../../lib/motion';

/**
 * IntroLoader — a ~1.3s "datasheet boot" shown once per browser session:
 * hairline rules draw on, the wordmark prints, then the whole sheet lifts
 * away to reveal the store. Skipped entirely for prefers-reduced-motion
 * users and on repeat visits (sessionStorage flag).
 */
export default function IntroLoader() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    try {
      return sessionStorage.getItem('vh.intro') !== 'seen';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem('vh.intro', 'seen');
    } catch {
      /* private mode — intro simply replays, harmless */
    }
    const t = setTimeout(() => setShow(false), 1450);
    return () => clearTimeout(t);
  }, [show]);

  if (reduce) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-ink"
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.55, ease: EASE.sheet }}
          aria-hidden="true"
        >
          {/* hairline rules drawing across */}
          <motion.div
            className="absolute inset-x-0 top-1/3 h-px bg-paper/25"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: EASE.sheet }}
          />
          <motion.div
            className="absolute inset-x-0 top-2/3 h-px bg-paper/25"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: EASE.sheet, delay: 0.08 }}
          />

          <div className="relative text-center">
            <motion.p
              className="font-mono text-[11px] uppercase tracking-[0.35em] text-voltbright"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              Spec-first electronics · est. 2026
            </motion.p>

            <div className="mt-3 overflow-hidden">
              <motion.h1
                className="font-display text-[clamp(2.5rem,9vw,5.5rem)] font-bold uppercase leading-none tracking-[0.12em] text-paper"
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.65, ease: EASE.sheet, delay: 0.2 }}
              >
                VoltHaus
              </motion.h1>
            </div>

            <motion.p
              className="mt-4 font-mono text-[11px] tracking-[0.2em] text-paper/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.3 }}
            >
              LOADING DATASHEET<span className="animate-blink text-voltbright">_</span>
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
