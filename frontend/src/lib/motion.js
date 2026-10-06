/**
 * Motion tokens — one easing language across the whole site.
 * "sheet"  : long confident deceleration (reveals, panels)
 * "snap"   : tactile overshort (add-to-cart, hearts, badges)
 * Durations stay short: motion must never slow browsing or checkout.
 */

export const EASE = {
  sheet: [0.16, 1, 0.3, 1], // expo-out
  snap: [0.34, 1.56, 0.64, 1], // back-out
  soft: [0.25, 0.1, 0.25, 1],
};

/** Fade + rise reveal used by <Reveal/> */
export const revealUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE.sheet },
  },
};

/** Clip-path line-mask reveal for headings (text "prints" onto the sheet) */
export const maskReveal = {
  hidden: { clipPath: 'inset(0 0 100% 0)' },
  show: { clipPath: 'inset(0 0 0% 0)', transition: { duration: 0.7, ease: EASE.sheet } },
};

/** Stagger container for lists/grids — 40ms is enough to feel ordered, not slow */
export const stagger = (delayChildren = 0.05, staggerChildren = 0.04) => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
});

/** Page transition: 180ms — present but never in the way */
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: EASE.soft } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};
