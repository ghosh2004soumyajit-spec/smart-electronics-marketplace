import { AnimatePresence, motion } from 'framer-motion';
import { IconClose } from '../ui/Icons';
import { activeFilterChips, filterUpdaters } from '../../lib/urlFilters';

/**
 * ActiveChips — every active filter rendered as a removable chip, so the
 * current query is always legible and reversible in one tap.
 */
export default function ActiveChips({ state, setState, category, allCategories }) {
  const chips = activeFilterChips(state, category, allCategories);
  if (!chips.length) return null;

  const remove = (chip) => {
    setState((s) => {
      switch (chip.type) {
        case 'brand':
          return filterUpdaters.toggleBrand(s, chip.value);
        case 'category':
          return filterUpdaters.toggleCategory(s, chip.value);
        case 'price':
          return filterUpdaters.setPrice(s, null, null);
        case 'facet':
          return filterUpdaters.toggleFacet(s, chip.key, chip.value);
        case 'range':
          return filterUpdaters.removeRange(s, chip.key);
        default:
          return s;
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence initial={false}>
        {chips.map((chip) => (
          <motion.button
            key={chip.id}
            type="button"
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            onClick={() => remove(chip)}
            aria-label={`Remove filter: ${chip.label}`}
            className="inline-flex items-center gap-1.5 border border-line2 bg-paper px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink2 transition-colors hover:border-volt hover:text-volt"
          >
            {chip.label}
            <IconClose size={11} />
          </motion.button>
        ))}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setState((s) => ({ ...filterUpdaters.clearAll(s), categories: [] }))}
        className="ul-link label text-volt font-bold"
      >
        Clear all
      </button>
    </div>
  );
}
