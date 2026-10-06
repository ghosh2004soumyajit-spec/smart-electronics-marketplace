import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompare } from '../../context/CompareContext';
import { IconClose, IconSliders, IconTrash } from '../ui/Icons';
import ProductVisual from '../product/ProductVisual';

export default function CompareBar() {
  const compareCtx = useCompare() || {};
  const compareItems = compareCtx.compareItems || [];
  const { removeFromCompare, clearCompare } = compareCtx;

  if (compareItems.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-4xl -translate-x-1/2 border border-ink bg-paper/95 p-3.5 shadow-2xl backdrop-blur-md"
        aria-label="Product comparison bar"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="bg-volt px-2 py-0.5 font-bold uppercase tracking-wider text-paper">
              COMPARE ({compareItems.length}/4)
            </span>
            <span className="hidden sm:inline text-ink2">Side-by-side spec sheet view</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {compareItems.map((p) => {
              const title = p.title || p.name;
              const img = p.primary_image;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-2 border border-line bg-card px-2.5 py-1 text-[11px]"
                >
                  <div className="h-6 w-8 shrink-0 overflow-hidden flex items-center justify-center bg-blueprint">
                    {img ? (
                      <img src={img} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <ProductVisual art={p.art} alt="" className="h-full w-full" />
                    )}
                  </div>
                  <span className="max-w-[100px] truncate font-bold text-ink">{title}</span>
                  <button
                    type="button"
                    onClick={() => removeFromCompare(p.id)}
                    aria-label={`Remove ${title} from compare`}
                    className="text-ink3 hover:text-red-500 transition-colors"
                  >
                    <IconClose size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={clearCompare}
              className="px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink3 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
            <Link
              to="/compare"
              className="inline-flex h-9 items-center gap-1.5 border border-ink bg-ink px-4 font-mono text-[11px] uppercase tracking-wider text-paper transition-colors hover:bg-volt hover:border-volt"
            >
              <IconSliders size={14} /> View Comparison Sheet
            </Link>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
