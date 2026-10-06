import { IconStar } from './Icons';
import { formatRating, compact } from '../../lib/format';

/**
 * Rating — mono numeral + star glyph + compact review count.
 * Deliberately not five outlined stars on every card: one star + the number
 * reads as data, which is the concept. (Full 5-star input lives in the
 * review form on the product page.)
 */
export default function Rating({ value, count, className = '', size = 'sm' }) {
  const starSize = size === 'lg' ? 18 : 13;
  return (
    <span className={`inline-flex items-center gap-1 font-mono ${size === 'lg' ? 'text-base' : 'text-xs'} ${className}`}>
      <span className="text-volt" aria-hidden="true">
        <IconStar size={starSize} />
      </span>
      <span className="font-bold tnum text-ink">{formatRating(value)}</span>
      {count != null && <span className="text-ink3 tnum">({compact(count)})</span>}
      <span className="sr-only">{`Rated ${formatRating(value)} out of 5 from ${count} reviews`}</span>
    </span>
  );
}

/** Static 5-star display for review rows and the review input form. */
export function StarRow({ value = 0, size = 16, onChange, interactive = false }) {
  return (
    <span className="inline-flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined} aria-label={interactive ? 'Your rating' : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={interactive ? () => onChange(n) : undefined}
          aria-label={interactive ? `${n} star${n > 1 ? 's' : ''}` : undefined}
          aria-pressed={interactive ? n === value : undefined}
          className={`${interactive ? 'cursor-pointer transition-transform hover:scale-125 focus-visible:scale-125' : 'cursor-default'} ${n <= Math.round(value) ? 'text-volt' : 'text-line2'}`}
        >
          <IconStar size={size} />
        </button>
      ))}
    </span>
  );
}
