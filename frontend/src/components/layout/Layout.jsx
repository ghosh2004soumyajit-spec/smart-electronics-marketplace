import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import Navbar from './Navbar';
import Footer from './Footer';
import IntroLoader from './IntroLoader';
import Toasts from '../ui/Toasts';
import CompareBar from '../compare/CompareBar';
import { pageTransition } from '../../lib/motion';

/**
 * Layout — app shell: skip link, sticky navbar, page-transition wrapper,
 * footer, toasts, Lenis smooth scroll, and scroll restoration on navigate.
 * Lenis is disabled for reduced-motion users; page transitions are 180ms so
 * browsing never feels lagged.
 */
export default function Layout() {
  const location = useLocation();
  const reduce = useReducedMotion();

  /* Smooth scroll — off for reduced motion */
  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.4,
    });
    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [reduce]);

  /* Jump to top on route change (instant — never animate navigation) */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-[110] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:bg-ink focus:px-4 focus:py-2 focus:font-mono focus:text-[12px] focus:uppercase focus:tracking-widest focus:text-paper"
      >
        Skip to content
      </a>

      <IntroLoader />
      <Navbar />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <Toasts />
      <CompareBar />
    </div>
  );
}
