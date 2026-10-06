import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ProductVisual from './ProductVisual';
import Rating from '../ui/Rating';
import { IconBag, IconCheck, IconHeart, IconSliders } from '../ui/Icons';
import { formatPrice, discountPct } from '../../lib/format';
import { useShop } from '../../context/ShopContext';
import { useCompare } from '../../context/CompareContext';
import { EASE } from '../../lib/motion';

/**
 * ProductCard — one row of the catalog datasheet.
 * Supports both seed objects and normalized API response products seamlessly.
 */
export default function ProductCard({ product, index = 0, compact = false }) {
  const { addToCart, inWishlist, toggleWishlist } = useShop();
  const { addToCompare, removeFromCompare, inCompare } = useCompare();
  const [added, setAdded] = useState(false);
  const addedTimer = useRef(null);
  const reduce = useReducedMotion();
  const cardRef = useRef(null);
  const saved = inWishlist(product.id);
  const compared = inCompare(product.id);

  const title = product.title || product.name || '';
  const brandName = product.brand?.name || product.brand_name || '';
  const mrp = product.price?.mrp ?? product.base_price ?? 0;
  const sale = product.price?.sale ?? product.discount_price ?? 0;
  const stock = product.stock_quantity ?? product.stock ?? 0;
  const rating = product.rating ?? product.avg_rating ?? 0;
  const reviewCount = product.reviewCount ?? product.review_count ?? 0;
  const img = product.primary_image;

  const hero = product.heroSpec;
  const dPct = discountPct(mrp, sale);
  const lowStock = stock > 0 && stock <= 5;

  const specsList = product.cardSpecs || (
    product.specs && typeof product.specs === 'object'
      ? Object.entries(product.specs).slice(0, 3).map(([k, v]) => ({ label: k, value: String(v) }))
      : []
  );

  /* Cursor-aware highlight: a soft volt radial follows the pointer */
  const onMove = (e) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r || !cardRef.current) return;
    cardRef.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
    cardRef.current.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const onAdd = (e) => {
    e.preventDefault();
    addToCart(product, 1);
    setAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1300);
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={onMove}
      className="group relative flex h-full flex-col bg-card transition-shadow duration-300 ease-sheet hover:z-10 hover:shadow-lift hover:outline hover:outline-1 hover:outline-ink"
      aria-label={title}
    >
      {/* cursor highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'radial-gradient(260px circle at var(--mx,50%) var(--my,50%), rgba(206,54,7,0.055), transparent 65%)' }}
      />

      {/* sheet header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="label tnum">DAT/{String(product.id).padStart(3, '0')}</span>
        {product.badge ? (
          <span className="label-volt font-bold">{product.badge}</span>
        ) : (
          <span className="label">{product.category?.name || product.category_name}</span>
        )}
      </div>

      {/* wishlist & compare buttons */}
      <div className="absolute right-3 top-11 z-20 flex flex-col gap-1.5">
        <motion.button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
          aria-pressed={saved}
          whileTap={reduce ? {} : { scale: 0.82 }}
          className={`grid h-9 w-9 place-items-center rounded-full border transition-colors duration-200
            ${saved ? 'border-volt bg-volt/10 text-volt' : 'border-line bg-paper/80 text-ink3 opacity-0 group-hover:opacity-100 hover:border-ink hover:text-ink focus-visible:opacity-100'}
            max-sm:opacity-100`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={String(saved)}
              initial={saved && !reduce ? { scale: 0.4 } : false}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="grid place-items-center"
            >
              <IconHeart size={17} filled={saved} />
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => (compared ? removeFromCompare(product.id) : addToCompare(product))}
          aria-label={compared ? `Remove ${title} from comparison` : `Add ${title} to comparison`}
          aria-pressed={compared}
          whileTap={reduce ? {} : { scale: 0.82 }}
          className={`grid h-9 w-9 place-items-center rounded-full border transition-colors duration-200
            ${compared ? 'border-volt bg-volt text-paper' : 'border-line bg-paper/80 text-ink3 opacity-0 group-hover:opacity-100 hover:border-ink hover:text-ink focus-visible:opacity-100'}
            max-sm:opacity-100`}
        >
          <IconSliders size={16} />
        </motion.button>
      </div>

      {/* illustration */}
      <Link
        to={`/p/${product.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className="block bg-blueprint"
      >
        <div className="aspect-[4/3] p-4 sm:p-5 flex items-center justify-center overflow-hidden">
          {img ? (
            <img src={img} alt={title} className="max-h-full max-w-full object-contain transition-transform duration-[600ms] ease-sheet group-hover:scale-[1.035]" />
          ) : (
            <ProductVisual
              art={product.art}
              alt=""
              className="h-full w-full transition-transform duration-[600ms] ease-sheet group-hover:scale-[1.035]"
            />
          )}
        </div>
      </Link>

      {/* data block */}
      <div className="flex flex-1 flex-col gap-3 border-t border-line p-4">
        {/* hero number */}
        {hero && (
          <Link to={`/p/${product.slug}`} className="block">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[2.6rem] font-bold leading-none tracking-tight tnum transition-colors duration-300 group-hover:text-volt">
                {hero.value}
              </span>
              <span className="label">
                {String(hero.unit || '').toUpperCase()} · {hero.label}
              </span>
            </div>
          </Link>
        )}

        {/* name + brand */}
        <div>
          <h3 className="font-display text-[15px] font-medium leading-snug">
            <Link to={`/p/${product.slug}`} className="transition-colors hover:text-volt focus-visible:text-volt">
              <span className="line-clamp-2">{title}</span>
            </Link>
          </h3>
          {brandName && <p className="label mt-1">{brandName}</p>}
        </div>

        {/* spec lines with dotted leaders */}
        {!compact && specsList.length > 0 && (
          <dl className="space-y-1.5">
            {specsList.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-baseline font-mono text-[11px]">
                <dt className="shrink-0 uppercase tracking-wide text-ink3">{s.label}</dt>
                <span className="leader" aria-hidden="true" />
                <dd className="shrink-0 font-bold tnum">
                  {s.value}
                  {s.unit ? ` ${s.unit}` : ''}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* rating + stock */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Rating value={rating} count={reviewCount} />
          {stock === 0 ? (
            <span className="label text-ink3">Out of stock</span>
          ) : lowStock ? (
            <span className="label-volt font-bold tnum">Only {stock} left</span>
          ) : (
            <span className="label">In stock</span>
          )}
        </div>

        {/* price + CTA */}
        <div className="flex items-end justify-between gap-3 border-t border-line pt-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-bold tnum">{formatPrice(sale)}</span>
              {dPct > 0 && <span className="label-volt font-bold tnum">−{dPct}%</span>}
            </div>
            {dPct > 0 && (
              <span className="label line-through tnum">MRP {formatPrice(mrp)}</span>
            )}
          </div>

          <motion.button
            type="button"
            onClick={onAdd}
            disabled={stock === 0}
            whileTap={reduce ? {} : { scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 600, damping: 20 }}
            aria-label={stock === 0 ? `${title} is out of stock` : `Add ${title} to cart`}
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 px-3.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-200
              ${added ? 'bg-volt text-paper' : stock === 0 ? 'cursor-not-allowed border border-line text-ink3' : 'bg-ink text-paper hover:bg-volt'}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span key="added" initial={reduce ? false : { y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.18, ease: EASE.snap }} className="inline-flex items-center gap-1.5">
                  <IconCheck size={14} /> Added
                </motion.span>
              ) : (
                <motion.span key="add" initial={reduce ? false : { y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.18, ease: EASE.snap }} className="inline-flex items-center gap-1.5">
                  <IconBag size={14} /> {stock === 0 ? 'Sold out' : 'Add'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </article>
  );
}
