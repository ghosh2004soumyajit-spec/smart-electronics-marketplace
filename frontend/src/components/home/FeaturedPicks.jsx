import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import SectionHead from '../ui/SectionHead';
import ProductCard from '../product/ProductCard';
import { ProductCardSkeleton } from '../ui/Skeletons';
import { IconArrowRight } from '../ui/Icons';
import { EASE } from '../../lib/motion';
import api from '../../services/api';

/**
 * FeaturedPicks — four editor-selected datasheets, each with a one-line
 * justification ("why this one") printed under the section head.
 */
const WHY = {
  1: 'Best all-round 1.5 ton inverter: 5★, copper condenser, 10-yr compressor cover.',
  8: 'The default right answer for a 3–4 person kitchen. Frost-free, quiet, proven.',
  20: 'QLED colour and a UI that stays fast — the value ceiling for 55-inch panels.',
  27: 'Charges 0–50% in ~10 minutes, and the 100W brick is actually in the box.',
};

export default function FeaturedPicks() {
  const { data: picks, isLoading } = useQuery({ queryKey: ['featured'], queryFn: api.listFeatured });
  const reduce = useReducedMotion();

  return (
    <section className="mx-auto max-w-[1440px] px-4 pb-16 lg:px-8 lg:pb-24" aria-labelledby="featured-title">
      <SectionHead
        index="05"
        note="picked against the spec sheet, not the ad budget"
        title={<span id="featured-title">Spec-verified picks.</span>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
          {picks?.map((p, i) => (
            <motion.div
              key={p.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: EASE.sheet }}
              className="flex h-full flex-col bg-paper"
            >
              <ProductCard product={p} index={i} />
              <p className="border border-t-0 border-line bg-paper2/60 px-4 py-3 font-mono text-[11px] leading-relaxed text-ink2">
                <span className="label-volt font-bold">Why → </span>
                {WHY[p.id] ?? 'Verified specs, honest price, strong owner ratings.'}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Link to="/shop" className="btn-ghost">
          Browse the full catalog <IconArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
