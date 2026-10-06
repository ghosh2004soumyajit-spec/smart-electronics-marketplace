import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { EASE } from '../../lib/motion';
import { formatNumber } from '../../lib/format';

/**
 * AnimatedNumber — counts up to `value` with the signature expo-out curve.
 * Used for hero prices and cart totals so money changes are FELT, not just
 * swapped. Reduced motion → instant value.
 */
export default function AnimatedNumber({
  value,
  format = formatNumber,
  duration = 0.8,
  className = '',
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: EASE.sheet,
      onUpdate: (v) => setDisplay(v),
      onComplete: () => (prev.current = value),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce, duration]);

  return <span className={`tnum ${className}`}>{format(display)}</span>;
}
