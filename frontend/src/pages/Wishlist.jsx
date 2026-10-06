import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useShop } from '../context/ShopContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice, discountPct } from '../lib/format';
import ProductVisual from '../components/product/ProductVisual';
import EmptyState from '../components/ui/EmptyState';
import { IconBag, IconClose, IconHeart } from '../components/ui/Icons';
import { EASE } from '../lib/motion';

/**
 * Wishlist — saved datasheets with move-to-cart and remove.
 * Dual mode: live server wishlist for logged-in users, localStorage for guests.
 */
export default function Wishlist() {
  useDocumentTitle('Your wishlist');
  const { wishlistItems, moveToCart, toggleWishlist } = useShop();
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-8 lg:px-8">
      <header className="border-b border-ink pb-6">
        <p className="label-volt font-bold">WISHLIST / {wishlistItems.length} SAVED</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-bold uppercase leading-none tracking-tight">
          Saved datasheets.
        </h1>
        <p className="label mt-3">Prices here are live — if something drops, you’ll see it on this page</p>
      </header>

      {wishlistItems.length === 0 ? (
        <div className="mt-10 max-w-3xl">
          <EmptyState
            code="WISH / EMPTY"
            icon={<IconHeart size={26} />}
            title="No saved datasheets yet."
            message="Tap the heart on any product to park it here while you decide. Saved items sync automatically when you sign in."
            action={{ label: 'Find something worth saving', to: '/shop' }}
          />
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {wishlistItems.map((p) => {
              const mrp = p.price?.mrp ?? p.base_price ?? 0;
              const sale = p.price?.sale ?? p.discount_price ?? 0;
              const stock = p.stock_quantity ?? p.stock ?? 0;
              const dPct = discountPct(mrp, sale);
              const title = p.title || p.name;
              const brandName = p.brand?.name || p.brand_name;
              const img = p.primary_image;

              return (
                <motion.li
                  key={p.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
                  transition={{ duration: 0.3, ease: EASE.sheet }}
                  className="group flex flex-col bg-card"
                >
                  <div className="flex items-start justify-between border-b border-line px-4 py-2">
                    <span className="label tnum">DAT/{String(p.id).padStart(3, '0')}</span>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(p)}
                      aria-label={`Remove ${title} from wishlist`}
                      className="grid h-7 w-7 place-items-center text-ink3 transition-colors hover:text-volt"
                    >
                      <IconClose size={15} />
                    </button>
                  </div>

                  <Link to={`/p/${p.slug}`} className="bg-blueprint" aria-label={`View ${title}`}>
                    <div className="aspect-[16/9] p-5 flex items-center justify-center overflow-hidden">
                      {img ? (
                        <img src={img} alt={title} className="max-h-full max-w-full object-contain transition-transform duration-500 ease-sheet group-hover:scale-[1.05]" />
                      ) : (
                        <ProductVisual art={p.art} alt="" className="h-full w-full transition-transform duration-500 ease-sheet group-hover:scale-[1.03]" />
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col gap-2 border-t border-line p-4">
                    {brandName && <p className="label">{brandName}</p>}
                    <h2 className="font-display text-[14.5px] font-medium leading-snug">
                      <Link to={`/p/${p.slug}`} className="line-clamp-2 transition-colors hover:text-volt">{title}</Link>
                    </h2>
                    <div className="mt-auto flex items-baseline gap-2 pt-2">
                      <span className="font-display text-lg font-bold tnum">{formatPrice(sale)}</span>
                      {dPct > 0 && <span className="label-volt font-bold tnum">−{dPct}%</span>}
                      <span className="label ml-auto">{stock > 0 ? 'In stock' : 'Out of stock'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => moveToCart(p)}
                      disabled={stock === 0}
                      className="mt-1 inline-flex h-10 items-center justify-center gap-2 bg-ink font-mono text-[11px] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-volt disabled:cursor-not-allowed disabled:bg-line2 disabled:text-ink3"
                    >
                      <IconBag size={14} /> {stock === 0 ? 'Out of stock' : 'Move to cart'}
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
