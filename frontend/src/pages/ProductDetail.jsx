import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../services/api';
import Recommendations from '../components/product/Recommendations';
import { useShop } from '../context/ShopContext';
import { useCompare } from '../context/CompareContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice, discountPct } from '../lib/format';
import ProductVisual from '../components/product/ProductVisual';
import PincodeCheck from '../components/product/PincodeCheck';
import ReviewsSection from '../components/product/ReviewsSection';
import ProductCard from '../components/product/ProductCard';
import Rating from '../components/ui/Rating';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import MagneticButton from '../components/ui/MagneticButton';
import Reveal from '../components/ui/Reveal';
import { LineSkeleton } from '../components/ui/Skeletons';
import EmptyState from '../components/ui/EmptyState';
import { IconBag, IconCheck, IconHeart, IconMinus, IconPlus, IconTruck, IconArrowRight, IconSliders } from '../components/ui/Icons';
import { EASE } from '../lib/motion';

/**
 * ProductDetail — the full datasheet. Everything is a spec-sheet element:
 * the illustration is Fig. 01, the spec table uses dotted leaders, price and
 * stock are data rows. Dual-mode support for mock data and live API responses.
 */
export default function ProductDetail() {
  const { slug } = useParams();
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.getProduct(slug),
  });
  const reduce = useReducedMotion();

  if (isLoading) return <DetailSkeleton />;
  if (isError || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          code="404 / NO_DATASHEET"
          title="This datasheet doesn’t exist."
          message="The product may have been discontinued or the link mistyped. The catalog index has everything currently in stock."
          action={{ label: 'Browse the catalog', to: '/shop' }}
        />
      </div>
    );
  }

  return <Detail product={product} reduce={reduce} />;
}

function Detail({ product, reduce }) {
  const { addToCart, inWishlist, toggleWishlist } = useShop();
  const { addToCompare, removeFromCompare, inCompare } = useCompare();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef(null);
  const saved = inWishlist(product.id);
  const compared = inCompare(product.id);

  const title = product.title || product.name || '';
  const brandName = product.brand?.name || product.brand_name || '';
  const brandSlug = product.brand?.slug || product.brand_slug || '';
  const categoryName = product.category?.name || product.category_name || '';
  const categorySlug = product.category?.slug || product.category_slug || '';
  const mrp = product.price?.mrp ?? product.base_price ?? 0;
  const sale = product.price?.sale ?? product.discount_price ?? 0;
  const stock = product.stock_quantity ?? product.stock ?? 0;
  const rating = product.rating ?? product.avg_rating ?? 0;
  const reviewCount = product.reviewCount ?? product.review_count ?? 0;
  const img = product.primary_image;

  useDocumentTitle(title);

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  const dPct = discountPct(mrp, sale);
  const lowStock = stock > 0 && stock <= 5;

  // Format specs list safely
  const rawSpecs = product.specs || {};
  const specRows = Object.entries(rawSpecs)
    .filter(([k]) => !k.endsWith('_bucket'))
    .map(([key, val]) => {
      if (val && typeof val === 'object' && 'label' in val) {
        return [key, val];
      }
      const label = key.replace(/_/g, ' ').toUpperCase();
      return [key, { label, value: String(val) }];
    });

  const cardSpecsList = product.cardSpecs || specRows.slice(0, 3).map(([, s]) => s);

  const onAdd = () => {
    addToCart(product, qty);
    setAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-28 lg:px-8 lg:pb-20">
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="label pt-8">
        <Link to="/" className="transition-colors hover:text-ink">Home</Link>
        <span className="px-2 text-line2" aria-hidden="true">/</span>
        {categorySlug ? (
          <>
            <Link to={`/c/${categorySlug}`} className="transition-colors hover:text-ink">{categoryName}</Link>
            <span className="px-2 text-line2" aria-hidden="true">/</span>
          </>
        ) : null}
        <span className="text-ink">{title}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        {/* ---------- left: illustration ---------- */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <figure className="border border-ink bg-card">
            <figcaption className="flex items-center justify-between border-b border-line px-4 py-2">
              <span className="label">Fig. 01 — front elevation</span>
              <span className="label tnum">DAT/{String(product.id).padStart(3, '0')}</span>
            </figcaption>
            <motion.div
              className="bg-blueprint aspect-[4/3] p-8 sm:p-12 flex items-center justify-center overflow-hidden"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE.sheet }}
            >
              {img ? (
                <img src={img} alt={`Photo of ${title}`} className="max-h-full max-w-full object-contain" />
              ) : (
                <ProductVisual art={product.art} alt={`Technical illustration of ${title}`} className="h-full w-full" />
              )}
            </motion.div>
            <figcaption className="border-t border-line px-4 py-2.5 font-mono text-[10.5px] leading-relaxed text-ink3">
              Drawing is representative of the product class; colour and finish vary by model.
            </figcaption>
          </figure>

          {/* quick spec chips */}
          {cardSpecsList.length > 0 && (
            <ul className="mt-4 grid grid-cols-3 gap-px border border-line bg-line">
              {cardSpecsList.slice(0, 3).map((s, i) => (
                <li key={i} className="bg-paper px-3 py-3 text-center">
                  <p className="font-display text-lg font-bold leading-none tnum">
                    {s.value}
                    {s.unit ? <span className="ml-1 font-mono text-[10px] font-normal text-ink3">{s.unit}</span> : null}
                  </p>
                  <p className="label mt-1.5">{s.label}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ---------- right: buy column ---------- */}
        <div>
          <p className="label">
            {brandSlug ? (
              <Link to={`/b/${brandSlug}`} className="ul-link font-bold text-ink transition-colors hover:text-volt">
                {brandName}
              </Link>
            ) : (
              <span className="font-bold text-ink">{brandName}</span>
            )}
            {product.badge && <span className="label-volt ml-3 font-bold">{product.badge}</span>}
          </p>

          <h1 className="mt-2.5 font-display text-[clamp(1.8rem,3.6vw,2.7rem)] font-bold leading-[1.05] tracking-tight balance">
            {title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href="#reviews" className="transition-opacity hover:opacity-80">
              <Rating value={rating} count={reviewCount} size="lg" />
            </a>
            <span className="label tnum">
              {stock === 0 ? (
                'Out of stock'
              ) : lowStock ? (
                <span className="label-volt font-bold">Only {stock} left in inventory</span>
              ) : (
                <>
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ink align-middle" aria-hidden="true" />
                  In stock — {stock} units
                </>
              )}
            </span>
          </div>

          {/* tagline */}
          {product.tagline && (
            <p className="mt-5 max-w-xl border-l-2 border-volt pl-4 text-[15.5px] leading-relaxed text-ink2">
              {product.tagline}
            </p>
          )}

          {/* price block */}
          <div className="mt-7 border-y border-ink py-5">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-display text-[2.6rem] font-bold leading-none tnum">
                <AnimatedNumber value={sale} format={formatPrice} />
              </span>
              {dPct > 0 && (
                <>
                  <s className="font-mono text-sm text-ink3 tnum">{formatPrice(mrp)}</s>
                  <span className="bg-volt px-2 py-0.5 font-mono text-[12px] font-bold text-paper tnum">−{dPct}%</span>
                </>
              )}
            </div>
            {mrp > sale && (
              <p className="label mt-2">Inclusive of all taxes · you save {formatPrice(mrp - sale)} over MRP</p>
            )}
          </div>

          {/* qty + actions */}
          <div className="mt-6 flex flex-wrap items-stretch gap-3">
            <div className="flex items-center border border-line2" role="group" aria-label="Quantity">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
                className="grid h-12 w-11 place-items-center text-ink2 transition-colors hover:bg-paper2 hover:text-ink disabled:opacity-35"
              >
                <IconMinus size={16} />
              </button>
              <span className="w-10 text-center font-mono text-sm font-bold tnum" aria-live="polite" aria-label={`Quantity ${qty}`}>
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(stock, q + 1))}
                disabled={qty >= stock}
                aria-label="Increase quantity"
                className="grid h-12 w-11 place-items-center text-ink2 transition-colors hover:bg-paper2 hover:text-ink disabled:opacity-35"
              >
                <IconPlus size={16} />
              </button>
            </div>

            <MagneticButton onClick={onAdd} disabled={stock === 0} className="h-12 flex-1 !px-6 sm:flex-none sm:!px-10">
              {stock === 0 ? (
                'Out of stock'
              ) : added ? (
                <span className="inline-flex items-center gap-2">
                  <IconCheck size={15} /> Added to cart
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <IconBag size={15} /> Add to cart
                </span>
              )}
            </MagneticButton>

            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-pressed={saved}
              className={`inline-flex h-12 items-center gap-2 border px-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                saved ? 'border-volt bg-volt/10 text-volt' : 'border-line2 text-ink2 hover:border-ink hover:text-ink'
              }`}
            >
              <motion.span animate={saved && !reduce ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.35, ease: EASE.snap }}>
                <IconHeart size={16} filled={saved} />
              </motion.span>
              {saved ? 'Saved' : 'Wishlist'}
            </button>

            <button
              type="button"
              onClick={() => (compared ? removeFromCompare(product.id) : addToCompare(product))}
              aria-pressed={compared}
              className={`inline-flex h-12 items-center gap-2 border px-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                compared ? 'border-volt bg-volt text-paper font-bold' : 'border-line2 text-ink2 hover:border-ink hover:text-ink'
              }`}
            >
              <IconSliders size={16} />
              {compared ? 'Comparing' : 'Compare'}
            </button>
          </div>

          {/* delivery facts + pincode check */}
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <PincodeCheck />
            <ul className="space-y-2.5 border border-line bg-paper2/50 p-4 font-mono text-[11.5px] text-ink2">
              <li className="flex items-start gap-2">
                <IconTruck size={14} className="mt-0.5 shrink-0 text-volt" /> Standard installation available at checkout
              </li>
              <li className="flex items-start gap-2">
                <IconCheck size={14} className="mt-0.5 shrink-0 text-volt" /> 7-day replacement on manufacturing defects
              </li>
              <li className="flex items-start gap-2">
                <IconCheck size={14} className="mt-0.5 shrink-0 text-volt" /> {rawSpecs.warranty?.value || rawSpecs.warranty || '1 year'} warranty at authorised centres
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ---------- description ---------- */}
      {product.description && (
        <Reveal className="mx-auto mt-16 max-w-3xl lg:mx-0">
          <div className="flex items-center gap-4">
            <span className="label-volt font-bold">02</span>
            <span className="h-px flex-1 bg-line2" aria-hidden="true" />
            <span className="label hidden sm:block">plain language, no adjectives</span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold">Why it earns its spec sheet.</h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink2">{product.description}</p>
        </Reveal>
      )}

      {/* ---------- full spec table ---------- */}
      {specRows.length > 0 && (
        <Reveal className="mt-14">
          <div className="flex items-center gap-4">
            <span className="label-volt font-bold">03</span>
            <span className="h-px flex-1 bg-line2" aria-hidden="true" />
            <span className="label hidden sm:block">from product_specifications</span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold">Full specification.</h2>

          <dl className="mt-6 grid gap-x-16 border-t border-ink md:grid-cols-2">
            {specRows.map(([key, s]) => (
              <div key={key} className="flex items-baseline border-b border-line py-3.5">
                <dt className="label !text-ink2">{s.label}</dt>
                <span className="leader" aria-hidden="true" />
                <dd className="font-mono text-[13px] font-bold tnum">
                  {String(s.value)}
                  {s.unit ? <span className="ml-1 font-normal text-ink3">{s.unit}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      )}

      {/* ---------- reviews ---------- */}
      <div id="reviews" className="mt-16 scroll-mt-24">
        <ReviewsSection product={product} />
      </div>

      {/* ---------- smart recommendations ---------- */}
      <Recommendations categorySlug={categorySlug} currentProductId={product.id} />

      {/* ---------- related ---------- */}
      {product.related?.length > 0 && (
        <section className="mt-16" aria-labelledby="related-title">
          <div className="flex items-center gap-4">
            <span className="label-volt font-bold">05</span>
            <span className="h-px flex-1 bg-line2" aria-hidden="true" />
            {categorySlug && (
              <Link to={`/c/${categorySlug}`} className="label ul-link">
                All {categoryName} <IconArrowRight size={12} className="ml-1 inline align-[-1px]" />
              </Link>
            )}
          </div>
          <h2 id="related-title" className="mt-4 font-display text-3xl font-bold">
            Compare within <span className="text-volt">{categoryName || 'Category'}</span>.
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
            {product.related.slice(0, 3).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- mobile action bar ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-3 border-t border-ink bg-paper/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-none tnum">{formatPrice(sale)}</p>
          <p className="label mt-1">{dPct > 0 ? `−${dPct}% vs MRP` : 'Incl. taxes'}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={stock === 0}
          className={`ml-auto inline-flex h-11 items-center gap-2 px-5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
            stock === 0 ? 'cursor-not-allowed bg-line2 text-ink3' : added ? 'bg-volt text-paper' : 'bg-ink text-paper'
          }`}
        >
          {added ? <IconCheck size={14} /> : <IconBag size={14} />}
          {stock === 0 ? 'Sold out' : added ? 'Added' : 'Add to cart'}
        </button>
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={saved}
          className={`grid h-11 w-11 place-items-center border transition-colors ${saved ? 'border-volt text-volt' : 'border-line2 text-ink2'}`}
        >
          <IconHeart size={17} filled={saved} />
        </button>
      </div>
    </div>
  );
}

/** Skeleton with the same geometry as the real page (no CLS) */
function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8" aria-busy="true" aria-label="Loading product">
      <LineSkeleton className="h-3 w-64" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div className="border border-line">
          <div className="aspect-[4/3] skeleton" />
        </div>
        <div className="space-y-4">
          <LineSkeleton className="h-3 w-24" />
          <LineSkeleton className="h-10 w-full" />
          <LineSkeleton className="h-10 w-2/3" />
          <LineSkeleton className="h-4 w-40" />
          <LineSkeleton className="h-20 w-full" />
          <LineSkeleton className="h-14 w-full" />
          <LineSkeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
