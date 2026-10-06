import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '../search/SearchBar';
import { LogoMark, IconBag, IconHeart, IconMenu, IconClose, IconSearch } from '../ui/Icons';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { categories as seedCategories } from '../../data/seed';
import api from '../../services/api';
import { EASE } from '../../lib/motion';

/**
 * Navbar — thin datasheet header: mark + wordmark, category index links,
 * search, wishlist and cart with live counts. Mobile gets a full-screen
 * "catalog index" sheet instead of a generic hamburger dropdown.
 */
export default function Navbar() {
  const { cartCount, wishlistCount } = useShop();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const reduce = useReducedMotion();

  const { data: fetchedCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.listCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const categories = (fetchedCategories && fetchedCategories.length > 0)
    ? fetchedCategories
    : seedCategories;

  /* close sheets on navigation */
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  /* lock body scroll while the mobile sheet is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Escape closes the sheet */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* Close user menu on outside click */
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-[70] border-b bg-paper/92 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? 'border-line shadow-[0_1px_0_rgba(25,24,23,0.04),0_10px_30px_-24px_rgba(25,24,23,0.5)]' : 'border-line'
      }`}
    >
      {/* desktop search toggle strip (mobile) */}
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:gap-6 lg:px-8">
        {/* logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="VoltHaus home">
          <LogoMark size={28} />
          <span className="font-display text-[17px] font-bold uppercase tracking-[0.2em]">
            Volt<span className="text-volt">Haus</span>
          </span>
        </Link>

        {/* category index (desktop) */}
        <nav aria-label="Categories" className="hidden flex-1 items-center gap-1 xl:flex">
          {categories.map((c) => (
            <NavLink
              key={c.slug}
              to={`/c/${c.slug}`}
              className={({ isActive }) =>
                `px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors duration-200 ${
                  isActive ? 'text-volt' : 'text-ink2 hover:text-ink'
                }`
              }
            >
              {c.short}
            </NavLink>
          ))}
          <NavLink
            to="/shop"
            className={({ isActive }) =>
              `px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors duration-200 ${
                isActive ? 'text-volt' : 'text-ink2 hover:text-ink'
              }`
            }
          >
            All ↗
          </NavLink>
        </nav>

        {/* search (desktop, inline) */}
        <div className="ml-auto hidden w-full max-w-sm xl:block">
          <SearchBar />
        </div>

        {/* actions */}
        <div className="ml-auto flex items-center gap-1 xl:ml-0">
          <button
            type="button"
            onClick={() => setSearchOpen((s) => !s)}
            aria-label="Open search"
            aria-expanded={searchOpen}
            className="grid h-10 w-10 place-items-center text-ink2 transition-colors hover:text-volt xl:hidden"
          >
            {searchOpen ? <IconClose size={20} /> : <IconSearch size={20} />}
          </button>

          <Link
            to="/wishlist"
            aria-label={`Wishlist, ${wishlistCount} saved`}
            className="relative grid h-10 w-10 place-items-center text-ink2 transition-colors hover:text-volt"
          >
            <IconHeart size={20} filled={wishlistCount > 0} />
            <CountBadge count={wishlistCount} reduce={reduce} />
          </Link>

          <Link
            to="/cart"
            aria-label={`Cart, ${cartCount} items`}
            className="relative grid h-10 w-10 place-items-center text-ink2 transition-colors hover:text-volt"
          >
            <IconBag size={20} />
            <CountBadge count={cartCount} reduce={reduce} />
          </Link>

          {/* User account button */}
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                id="navbar-user-menu"
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-label="Account menu"
                aria-expanded={userMenuOpen}
                className="grid h-10 w-10 place-items-center"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-volt font-mono text-[12px] font-bold uppercase text-paper">
                  {user?.full_name?.[0] ?? '?'}
                </span>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: EASE.sheet }}
                    className="absolute right-0 top-12 z-[80] w-48 border border-line bg-paper shadow-lg"
                  >
                    <div className="border-b border-line px-4 py-3">
                      <p className="font-mono text-[11px] uppercase tracking-widest text-ink3">Signed in as</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-ink">{user?.full_name}</p>
                    </div>
                    <nav className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-ink2 transition-colors hover:bg-paper2 hover:text-volt"
                      >
                        Profile &amp; Addresses
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-ink2 transition-colors hover:bg-paper2 hover:text-volt"
                      >
                        My Orders
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="block border-t border-line bg-volt/5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-volt font-bold transition-colors hover:bg-volt hover:text-paper"
                        >
                          ⚡ Admin Console
                        </Link>
                      )}
                      <button
                        type="button"
                        id="navbar-logout"
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-widest text-ink2 transition-colors hover:bg-paper2 hover:text-volt border-t border-line"
                      >
                        Sign out
                      </button>
                    </nav>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              id="navbar-login"
              className="hidden xl:inline-flex items-center gap-1.5 border border-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              Sign in
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center text-ink transition-colors hover:text-volt xl:hidden"
          >
            <IconMenu size={22} />
          </button>
        </div>
      </div>

      {/* mobile search row */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE.sheet }}
            className="overflow-visible border-t border-line px-4 py-2.5 xl:hidden"
          >
            <SearchBar id="mobile-search" autoFocus onNavigate={() => setSearchOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* mobile catalog sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.22, ease: 'easeIn' } }}
            transition={{ duration: 0.4, ease: EASE.sheet }}
            className="fixed inset-x-0 top-14 bottom-0 z-[65] overflow-y-auto bg-paper xl:hidden"
          >
            <nav aria-label="Mobile" className="px-4 py-6">
              <p className="label mb-4">Catalog index</p>
              <ul>
                {categories.map((c, i) => (
                  <motion.li
                    key={c.slug}
                    initial={reduce ? false : { opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.35, ease: EASE.sheet }}
                  >
                    <Link
                      to={`/c/${c.slug}`}
                      className="flex items-baseline justify-between border-b border-line py-4"
                    >
                      <span className="font-display text-2xl font-bold">
                        <span className="label-volt mr-3">{c.index}</span>
                        {c.name}
                      </span>
                      <span className="label tnum">{c.productCount ? `${c.productCount} items` : 'Browse'}</span>
                    </Link>
                  </motion.li>
                ))}
                <li className="pt-4">
                  <Link to="/shop" className="btn-primary w-full">
                    Browse everything
                  </Link>
                </li>
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/** Animated count pill — pops when the number changes */
function CountBadge({ count, reduce }) {
  if (!count) return null;
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={count}
        initial={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 550, damping: 22 }}
        className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-volt px-1 font-mono text-[10px] font-bold leading-none text-paper tnum"
      >
        {count > 99 ? '99+' : count}
      </motion.span>
    </AnimatePresence>
  );
}
