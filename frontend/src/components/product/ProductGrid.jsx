import { motion, useReducedMotion } from 'framer-motion';
import ProductCard from './ProductCard';
import { EASE } from '../../lib/motion';

/**
 * ProductGrid — a true datasheet table: cards separated by 1px rules
 * (gap-px over a line-colored background) instead of floating shadow boxes.
 * Layout animation keeps filter changes legible: items ease to new spots in
 * 240ms, never slower.
 */
export default function ProductGrid({ products, perPage = 9 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      layout={!reduce}
      className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-3"
    >
      {products.map((p, i) => (
        <motion.div
          key={p.id}
          layout={!reduce}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: EASE.sheet, delay: reduce ? 0 : Math.min(i % perPage, 8) * 0.03 }}
          className="h-full"
        >
          <ProductCard product={p} index={i} />
        </motion.div>
      ))}
    </motion.div>
  );
}
