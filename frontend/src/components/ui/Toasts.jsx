import { AnimatePresence, motion } from 'framer-motion';
import { useShop } from '../../context/ShopContext';
import { IconCheck, IconHeart, IconBag } from './Icons';
import { EASE } from '../../lib/motion';

/**
 * Toasts — mono, bottom-left, ink-on-paper inverted card. Confirmation that
 * an action landed (add-to-cart, wishlist) without hijacking the screen.
 */
export default function Toasts() {
  const { toasts, dismissToast } = useShop();
  return (
    <div
      className="pointer-events-none fixed bottom-4 left-4 z-[90] flex max-w-[min(92vw,26rem)] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => dismissToast(t.id)}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease: EASE.snap }}
            className="pointer-events-auto flex items-center gap-3 border border-ink bg-ink px-4 py-3 text-left text-paper shadow-lift"
          >
            <span className="text-voltbright" aria-hidden="true">
              {t.kind === 'wish' ? <IconHeart size={16} filled /> : t.kind === 'cart' ? <IconBag size={16} /> : <IconCheck size={16} />}
            </span>
            <span className="font-mono text-[11px] leading-snug tracking-wide">{t.message}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
