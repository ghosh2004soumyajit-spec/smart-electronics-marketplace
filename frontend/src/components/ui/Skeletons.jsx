/**
 * Skeleton loaders — same geometry as the real components so there is
 * zero layout shift (CLS ≈ 0) when data lands. Paper-toned shimmer,
 * never grey boxes on white.
 */

export function LineSkeleton({ className = 'h-3 w-full' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/** Mirrors ProductCard geometry exactly */
export function ProductCardSkeleton() {
  return (
    <article className="border border-line bg-card" aria-hidden="true">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <LineSkeleton className="h-2.5 w-16" />
        <LineSkeleton className="h-2.5 w-10" />
      </div>
      <div className="aspect-[4/3] p-6">
        <LineSkeleton className="h-full w-full" />
      </div>
      <div className="space-y-3 border-t border-line p-4">
        <LineSkeleton className="h-9 w-24" />
        <LineSkeleton className="h-3.5 w-full" />
        <LineSkeleton className="h-3.5 w-2/3" />
        <div className="space-y-2 pt-1">
          <LineSkeleton className="h-2.5 w-full" />
          <LineSkeleton className="h-2.5 w-full" />
          <LineSkeleton className="h-2.5 w-4/5" />
        </div>
        <div className="flex items-end justify-between pt-2">
          <LineSkeleton className="h-6 w-28" />
          <LineSkeleton className="h-9 w-full max-w-[45%]" />
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div
      className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading products…</span>
    </div>
  );
}

/** Filter sidebar skeleton */
export function FilterSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {[0, 1, 2].map((g) => (
        <div key={g} className="space-y-2.5">
          <LineSkeleton className="h-2.5 w-24" />
          {[0, 1, 2, 3].map((i) => (
            <LineSkeleton key={i} className="h-3 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
