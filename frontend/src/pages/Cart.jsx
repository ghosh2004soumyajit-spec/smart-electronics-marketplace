import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useShop } from '../context/ShopContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice } from '../lib/format';
import EmptyState from '../components/ui/EmptyState';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { IconBag, IconMinus, IconPlus, IconTrash, IconTruck } from '../components/ui/Icons';
import { EASE } from '../lib/motion';
import { categories } from '../data/seed';

export default function Cart() {
  useDocumentTitle('Your cart');
  const { cartItems, cartTotals, setQty, removeFromCart } = useShop();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:py-24">
        <EmptyState
          code="CART / EMPTY"
          icon={<IconBag size={26} />}
          title="Nothing on the sheet yet."
          message="Your cart is empty — which is fine. When you're ready, start from a category or let the rule-based finder size things to your room."
          action={{ label: 'Browse the catalog', to: '/shop' }}
        />
        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/c/${c.slug}`}
              className="border border-line2 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink2 transition-colors hover:border-volt hover:text-volt"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-8 lg:px-8">
      <header className="border-b border-ink pb-6">
        <p className="label-volt font-bold">CART / {cartTotals.count} ITEM{cartTotals.count === 1 ? '' : 'S'}</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-bold uppercase leading-none tracking-tight">
          Your cart.
        </h1>
        <p className="label mt-3">Prices verified against the live catalog · stock re-checked at checkout</p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* line items */}
        <ul className="border-t border-line">
          <AnimatePresence initial={false}>
            {cartItems.map((item) => {
              const p = item.product;
              const qty = item.quantity ?? item.qty ?? 1;
              const salePrice = parseFloat(p.discount_price ?? p.base_price ?? 0);
              const mrpPrice = parseFloat(p.base_price ?? 0);
              const stock = p.stock_quantity ?? p.stock ?? 0;

              return (
                <motion.li
                  key={p.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.28, ease: EASE.sheet }}
                  className="grid grid-cols-[88px_1fr] gap-4 border-b border-line py-5 sm:grid-cols-[120px_1fr_auto] sm:gap-6"
                >
                  {/* Product image */}
                  <Link to={`/p/${p.slug}`} className="block border border-line bg-paper2 overflow-hidden" aria-label={`View ${p.title}`}>
                    <div className="aspect-[4/3] p-2">
                      {p.primary_image ? (
                        <img src={p.primary_image} alt={p.title} className="h-full w-full object-contain" />
                      ) : (
                        <div className="h-full w-full bg-blueprint" />
                      )}
                    </div>
                  </Link>

                  {/* Product info */}
                  <div className="min-w-0">
                    <p className="label">{p.brand_name}</p>
                    <h2 className="mt-1 font-display text-[15.5px] font-medium leading-snug">
                      <Link to={`/p/${p.slug}`} className="transition-colors hover:text-volt">{p.title}</Link>
                    </h2>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {/* qty stepper */}
                      <div className="flex items-center border border-line2" role="group" aria-label={`Quantity for ${p.title}`}>
                        <button
                          type="button"
                          onClick={() => setQty(p.id, qty - 1, stock)}
                          aria-label="Decrease quantity"
                          className="grid h-9 w-9 place-items-center text-ink2 transition-colors hover:bg-paper2 hover:text-ink"
                        >
                          <IconMinus size={14} />
                        </button>
                        <span className="w-8 text-center font-mono text-[13px] font-bold tnum" aria-live="polite">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(p.id, qty + 1, stock)}
                          disabled={qty >= stock}
                          aria-label="Increase quantity"
                          className="grid h-9 w-9 place-items-center text-ink2 transition-colors hover:bg-paper2 hover:text-ink disabled:opacity-35"
                        >
                          <IconPlus size={14} />
                        </button>
                      </div>

                      {qty >= stock && <span className="label-volt font-bold tnum">Max stock ({stock})</span>}

                      <button
                        type="button"
                        onClick={() => removeFromCart(p.id)}
                        className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink3 transition-colors hover:text-volt"
                        aria-label={`Remove ${p.title} from cart`}
                      >
                        <IconTrash size={13} /> Remove
                      </button>
                    </div>
                  </div>

                  {/* line total */}
                  <div className="col-span-2 flex items-baseline justify-between sm:col-span-1 sm:w-40 sm:flex-col sm:items-end sm:justify-start">
                    <p className="font-display text-xl font-bold tnum">
                      <AnimatedNumber value={salePrice * qty} format={formatPrice} duration={0.45} />
                    </p>
                    {mrpPrice > salePrice && (
                      <p className="label line-through tnum">{formatPrice(mrpPrice * qty)}</p>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        {/* Order summary */}
        <aside className="h-fit border border-ink bg-paper shadow-sheet lg:sticky lg:top-20" aria-label="Order summary">
          <p className="border-b border-ink bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/80">
            Summary
          </p>
          <dl className="space-y-3 px-4 py-5 font-mono text-[12.5px]">
            <div className="flex items-baseline">
              <dt className="text-ink2">Subtotal ({cartTotals.count} items)</dt>
              <span className="leader" aria-hidden="true" />
              <dd className="font-bold tnum">
                <AnimatedNumber value={cartTotals.subtotal} format={formatPrice} />
              </dd>
            </div>
            <div className="flex items-baseline">
              <dt className="text-ink2">Savings vs MRP</dt>
              <span className="leader" aria-hidden="true" />
              <dd className="font-bold text-volt tnum">−<AnimatedNumber value={cartTotals.savings} format={formatPrice} /></dd>
            </div>
            <div className="flex items-baseline">
              <dt className="text-ink2">Delivery</dt>
              <span className="leader" aria-hidden="true" />
              <dd className="text-ink3">at pincode check</dd>
            </div>
            <div className="flex items-baseline border-t border-line pt-3">
              <dt className="font-bold uppercase tracking-wide">To pay</dt>
              <span className="leader" aria-hidden="true" />
              <dd className="font-display text-2xl font-bold tnum">
                <AnimatedNumber value={cartTotals.subtotal} format={formatPrice} />
              </dd>
            </div>
          </dl>

          <div className="px-4 pb-5">
            <button
              id="cart-checkout-btn"
              type="button"
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full"
            >
              <IconTruck size={15} /> Proceed to checkout
            </button>
            <p className="label mt-3 text-center">No payment gateway — orders placed as confirmed-pending</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
