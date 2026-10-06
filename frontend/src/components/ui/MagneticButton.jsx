import { useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * MagneticButton — the primary CTA pulls slightly toward the cursor and
 * springs back on leave. Disabled for touch pointers and reduced motion;
 * never wraps form-critical controls (checkout keeps plain buttons).
 */
export default function MagneticButton({ to, href, children, className = '', strength = 10, onClick, type = 'button', disabled = false, ariaLabel }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(my, { stiffness: 220, damping: 18, mass: 0.4 });

  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const active = !reduce && !coarse && !disabled;

  const onMove = (e) => {
    if (!active) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX - (r.left + r.width / 2)) / r.width) * strength * 2);
    my.set(((e.clientY - (r.top + r.height / 2)) / r.height) * strength * 2);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const content = <motion.span style={{ x, y }} className="inline-flex items-center gap-2">{children}</motion.span>;
  const cls = `btn-primary ${className}`;

  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={cls} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick} aria-label={ariaLabel}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} type={type} disabled={disabled} className={cls} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick} aria-label={ariaLabel}>
      {content}
    </button>
  );
}
