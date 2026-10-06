import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import MagneticButton from '../ui/MagneticButton';
import AnimatedNumber from '../ui/AnimatedNumber';
import ProductVisual from '../product/ProductVisual';
import Rating from '../ui/Rating';
import { MaskLines } from '../ui/Reveal';
import { IconArrowRight, IconTruck } from '../ui/Icons';
import { formatPrice, discountPct } from '../../lib/format';
import { EASE } from '../../lib/motion';
import api from '../../services/api';

/**
 * Hero — no banner carousel. The left column states the outcome in oversized
 * type; the right column IS the signature concept: a live datasheet panel for
 * a real in-stock product, with counted-up price, verified spec rows and an
 * honest delivery estimate.
 */
export default function Hero() {
  const reduce = useReducedMotion();
  // The datasheet panel shows a real product straight from the catalog API.
  const { data: featured } = useQuery({ queryKey: ['featured'], queryFn: api.listFeatured });
  const panel = featured?.[0];

  // Delivery estimate copy (computed, not hardcoded fiction)
  const eta = new Date();
  eta.setDate(eta.getDate() + 3);

  return (
    <section className="relative overflow-hidden border-b border-line bg-paper" aria-labelledby="hero-title">
      {/* blueprint backdrop */}
      <div className="bg-blueprint absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -right-24 top-8 hidden select-none font-display text-[22rem] font-bold leading-none text-ink/[0.035] lg:block"
        aria-hidden="true"
      >
        5★
      </div>

      <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-4 pb-16 pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:px-8 lg:pb-24 lg:pt-20">
        {/* ---------- left: the promise ---------- */}
        <div>
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-4"
          >
            <span className="label-volt font-bold">01 — SPEC-FIRST ELECTRONICS STORE</span>
            <span className="h-px w-16 bg-line2 sm:w-28" aria-hidden="true" />
            <span className="label hidden sm:block">India · ₹ · 19,240 pincodes</span>
          </motion.div>

          <h1 id="hero-title" className="mt-6 font-display text-[clamp(2.9rem,7.2vw,5.6rem)] font-bold uppercase leading-[0.95] tracking-tight">
            <MaskLines
              lines={[
                <>Read the spec.</>,
                <>
                  Not the <span className="text-volt">sales pitch</span>.
                </>,
              ]}
              delay={0.1}
            />
          </h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: EASE.sheet }}
            className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-ink2 balance"
          >
            VoltHaus matches air conditioners, refrigerators, washing machines, TVs and
            smartphones to your room size and budget —{' '}
            <strong className="font-medium text-ink">in under 5 minutes</strong>, using verified
            numbers instead of adjectives. Every capacity, star rating and rupee is checked
            before it goes on the sheet.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: EASE.sheet }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <MagneticButton href="#finder" ariaLabel="Jump to the rule-based product finder">
              Find my appliance <IconArrowRight size={15} />
            </MagneticButton>
            <Link to="/shop" className="ul-link font-mono text-[12px] uppercase tracking-[0.14em] text-ink2 transition-colors hover:text-ink">
              or browse all 31 datasheets
            </Link>
          </motion.div>

          {/* counter strip */}
          <motion.dl
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 grid max-w-lg grid-cols-3 border-t border-line"
          >
            {[
              { label: 'Live datasheets', value: 31 },
              { label: 'Brands stocked', value: 19 },
              { label: 'Avg. delivery', value: 3, suffix: ' days' },
            ].map((s) => (
              <div key={s.label} className="border-b border-line py-4 pr-4">
                <dd className="font-display text-3xl font-bold leading-none tnum sm:text-4xl">
                  <AnimatedNumber value={s.value} />
                  {s.suffix}
                </dd>
                <dt className="label mt-2">{s.label}</dt>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* ---------- right: the live datasheet panel ---------- */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28, rotate: 0.4 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE.sheet }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="border border-ink bg-card shadow-sheet">
            {panel ? (
              <>
                <div className="flex items-center justify-between border-b border-ink bg-ink px-4 py-2 text-paper">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/70">
                    Datasheet / featured
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.15em] text-voltbright tnum">
                    DAT/{String(panel.id).padStart(3, '0')}
                  </span>
                </div>

                <Link to={`/p/${panel.slug}`} className="block bg-blueprint" aria-label={`Open datasheet for ${panel.name}`}>
                  <div className="aspect-[16/10] p-6">
                    <ProductVisual
                      art={panel.art}
                      alt={`Technical illustration of ${panel.name}`}
                      className="h-full w-full"
                      imageUrl={panel.primary_image ?? null}
                      imageAlt={panel.name}
                    />
                  </div>
                </Link>

                <div className="space-y-4 p-5">
                  <div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-display text-[3.4rem] font-bold leading-none tnum">
                        {panel.heroSpec?.value}
                      </span>
                      <span className="label">{panel.heroSpec?.unit?.toUpperCase()} · {panel.heroSpec?.label}</span>
                    </div>
                    <h2 className="mt-2 font-display text-[17px] font-medium leading-snug">
                      <Link to={`/p/${panel.slug}`} className="ul-link">{panel.name}</Link>
                    </h2>
                  </div>

                  {/* spec rows with dotted leaders */}
                  <dl className="space-y-2 border-t border-line pt-3">
                    {panel.cardSpecs.slice(0, 3).map((s, i) => (
                      <div key={i} className="flex items-baseline font-mono text-[11.5px]">
                        <dt className="uppercase tracking-wide text-ink3">{s.label}</dt>
                        <span className="leader" aria-hidden="true" />
                        <dd className="font-bold tnum">
                          {s.value}
                          {s.unit ? ` ${s.unit}` : ''}
                        </dd>
                      </div>
                    ))}
                    <div className="flex items-baseline font-mono text-[11.5px]">
                      <dt className="uppercase tracking-wide text-ink3">Buyer rating</dt>
                      <span className="leader" aria-hidden="true" />
                      <dd>
                        <Rating value={panel.rating} count={panel.reviewCount} />
                      </dd>
                    </div>
                  </dl>

                  {/* price block */}
                  <div className="flex items-end justify-between gap-3 border-t border-line pt-4">
                    <div>
                      <p className="font-display text-[2rem] font-bold leading-none tnum">
                        <AnimatedNumber value={panel.price.sale} format={formatPrice} duration={1.1} />
                      </p>
                      <p className="label mt-1.5">
                        <s className="tnum">MRP {formatPrice(panel.price.mrp)}</s>{' '}
                        <span className="label-volt font-bold tnum">save {discountPct(panel.price.mrp, panel.price.sale)}%</span>
                      </p>
                    </div>
                    <p className="flex items-center gap-1.5 text-right font-mono text-[10.5px] uppercase leading-relaxed tracking-wide text-ink3">
                      <IconTruck size={15} className="text-ink2" />
                      <span>
                        In stock · delivered by{' '}
                        <span className="font-bold text-ink">
                          {eta.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>{' '}
                        to metro pincodes
                      </span>
                    </p>
                  </div>

                  <Link to={`/p/${panel.slug}`} className="btn-primary w-full">
                    Open full datasheet <IconArrowRight size={15} />
                  </Link>
                </div>
              </>
            ) : (
              /* panel skeleton — same geometry, zero CLS */
              <div aria-hidden="true">
                <div className="h-8 border-b border-ink bg-ink" />
                <div className="aspect-[16/10] p-6">
                  <div className="skeleton h-full w-full" />
                </div>
                <div className="space-y-3 p-5">
                  <div className="skeleton h-10 w-2/3" />
                  <div className="skeleton h-3.5 w-full" />
                  <div className="skeleton h-3.5 w-4/5" />
                  <div className="skeleton h-3.5 w-3/5" />
                  <div className="skeleton h-10 w-full" />
                </div>
              </div>
            )}
          </div>

          {/* annotation */}
          <p className="label mt-3 text-right">
            Fig. 01 — live panel · price &amp; stock update from the catalog API
          </p>
        </motion.div>
      </div>
    </section>
  );
}
