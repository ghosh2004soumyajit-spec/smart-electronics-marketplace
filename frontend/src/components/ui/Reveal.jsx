import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '../../lib/motion';

/**
 * Scroll reveal — fades + rises content into view once.
 * Reduced-motion users get instant, static content (no y-offset).
 */
export default function Reveal({ children, delay = 0, y = 24, className = '', as = 'div' }) {
  const reduce = useReducedMotion();
  const M = motion[as] ?? motion.div;
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: EASE.sheet, delay: reduce ? 0 : delay }}
    >
      {children}
    </M>
  );
}

/**
 * Line-mask reveal for display headings: text "prints" onto the sheet.
 * Lines are revealed bottom-to-top with a clip, staggered.
 */
export function MaskLines({ lines, className = '', lineClassName = '', delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className={`block overflow-hidden ${lineClassName}`}>
          <motion.span
            className="block"
            initial={reduce ? false : { y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, ease: EASE.sheet, delay: reduce ? 0 : delay + i * 0.08 }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
