import { Link } from 'react-router-dom';
import { IconArrowRight } from '../ui/Icons';

/**
 * Pagination — URL-driven links (not buttons with state), so pages are
 * shareable and the back button works. Window of 5 numbers max.
 */
export default function Pagination({ page, pages, basePath, searchParams }) {
  if (pages <= 1) return null;

  const hrefFor = (p) => {
    const sp = new URLSearchParams(searchParams);
    if (p <= 1) sp.delete('page');
    else sp.set('page', String(p));
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ''}`;
  };

  // window: [1] … [p-1, p, p+1] … [pages]
  const window_ = [];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  window_.push(1);
  if (start > 2) window_.push('…');
  for (let i = start; i <= end; i++) window_.push(i);
  if (end < pages - 1) window_.push('…');
  if (pages > 1) window_.push(pages);

  const cls =
    'grid h-9 min-w-9 place-items-center border px-2 font-mono text-[12px] tnum transition-colors duration-150';

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link to={hrefFor(page - 1)} className={`${cls} border-line2 text-ink2 hover:border-ink hover:text-ink`} aria-label="Previous page">
          <IconArrowRight size={15} className="rotate-180" />
        </Link>
      )}
      {window_.map((n, i) =>
        n === '…' ? (
          <span key={`e${i}`} className="px-1 font-mono text-[12px] text-ink3" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={n}
            to={hrefFor(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`${cls} ${
              n === page ? 'border-ink bg-ink text-paper' : 'border-line2 text-ink2 hover:border-ink hover:text-ink'
            }`}
          >
            {n}
          </Link>
        )
      )}
      {page < pages && (
        <Link to={hrefFor(page + 1)} className={`${cls} border-line2 text-ink2 hover:border-ink hover:text-ink`} aria-label="Next page">
          <IconArrowRight size={15} />
        </Link>
      )}
    </nav>
  );
}
