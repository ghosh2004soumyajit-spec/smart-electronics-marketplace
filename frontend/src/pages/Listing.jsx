import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../services/api';
import { readFilters, writeFilters, activeFilterCount } from '../lib/urlFilters';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ProductGrid from '../components/product/ProductGrid';
import { ProductGridSkeleton, FilterSkeleton, LineSkeleton } from '../components/ui/Skeletons';
import FilterPanel from '../components/filters/FilterPanel';
import MobileFilterSheet from '../components/filters/MobileFilterSheet';
import SortMenu from '../components/filters/SortMenu';
import ActiveChips from '../components/filters/ActiveChips';
import Pagination from '../components/filters/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { IconSliders, IconSearch } from '../components/ui/Icons';

const PER_PAGE = 9;

const POPULAR = ['1.5 ton inverter', 'frost free', 'oled', 'front load', '5000 mah', '4k 55'];

/**
 * Listing — ONE component, four modes:
 *   /c/:categorySlug  category mode (spec facets generated from the category)
 *   /b/:brandSlug     brand mode
 *   /search?q=…       search mode (forgiving, debounced upstream)
 *   /shop             everything
 *
 * All filter state lives in the URL (shareable, back-safe, deep-linkable).
 * Data fetches keep previous results on screen while refetching, so
 * filtering never flashes an empty grid.
 */
export default function Listing() {
  const { categorySlug, brandSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  const state = useMemo(() => readFilters(searchParams), [searchParams]);
  const setState = (updater) => {
    const next = typeof updater === 'function' ? updater(readFilters(searchParams)) : updater;
    setSearchParams(writeFilters(next), { replace: true });
  };

  /* mode resolution */
  const mode = categorySlug ? 'category' : brandSlug ? 'brand' : state.q ? 'search' : 'all';

  const { data: allCategories } = useQuery({ queryKey: ['categories'], queryFn: api.listCategories });
  const { data: allBrands } = useQuery({ queryKey: ['brands'], queryFn: api.listBrands });

  const category = categorySlug ? allCategories?.find((c) => c.slug === categorySlug) ?? api.getCategorySync(categorySlug) : null;
  const brand = brandSlug ? allBrands?.find((b) => b.slug === brandSlug) : null;

  /* products query — key includes every filter dimension */
  const queryKey = ['products', mode, categorySlug, brandSlug, searchParams.toString()];
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      api.listProducts({
        q: state.q || undefined,
        category: categorySlug || undefined,
        categories: mode === 'category' ? undefined : state.categories.length ? state.categories : undefined,
        brand: brandSlug || undefined,
        brands: mode === 'brand' ? undefined : state.brands.length ? state.brands : undefined,
        priceMin: state.priceMin ?? undefined,
        priceMax: state.priceMax ?? undefined,
        facets: state.facets,
        ranges: state.ranges,
        sort: state.sort,
        page: state.page,
        perPage: PER_PAGE,
      }),
    placeholderData: keepPreviousData,
  });

  /* panel option lists */
  const panelData = useMemo(() => {
    const brandOptions =
      mode === 'category'
        ? (allBrands || []).filter((b) => b.categorySlugs?.includes(categorySlug) || (data?.brandCounts?.[b.slug] ?? 0) > 0)
        : allBrands || [];
    return {
      facetCounts: data?.facetCounts,
      brandCounts: data?.brandCounts,
      categoryCounts: data?.categoryCounts,
      brandOptions,
      categoryOptions: allCategories || [],
    };
  }, [allBrands, allCategories, data, mode, categorySlug]);

  /* header copy */
  const title = categorySlug
    ? category?.name || 'Category'
    : brandSlug
      ? brand?.name || 'Brand'
      : state.q
        ? `Search: “${state.q}”`
        : 'The full catalog';
  useDocumentTitle(title);

  const panelProps = { state, setState, mode, category, data: panelData };
  const total = data?.total ?? 0;

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-20 lg:px-8">
      {/* ---------- header ---------- */}
      <header className="border-b border-ink pb-6 pt-8 lg:pt-12">
        <nav aria-label="Breadcrumb" className="label">
          <Link to="/" className="transition-colors hover:text-ink">Home</Link>
          <span className="px-2 text-line2" aria-hidden="true">/</span>
          {mode === 'category' && <span className="text-ink">{category?.name}</span>}
          {mode === 'brand' && (
            <>
              <Link to="/shop" className="transition-colors hover:text-ink">Catalog</Link>
              <span className="px-2 text-line2" aria-hidden="true">/</span>
              <span className="text-ink">{brand?.name}</span>
            </>
          )}
          {mode === 'search' && <span className="text-ink">Search</span>}
          {mode === 'all' && <span className="text-ink">All products</span>}
        </nav>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(2.2rem,5.5vw,4rem)] font-bold uppercase leading-[0.95] tracking-tight">
              {isLoading && !title ? <LineSkeleton className="h-12 w-64" /> : title}
            </h1>
            {category?.sizeGuide && (
              <p className="mt-3 max-w-2xl font-mono text-[11.5px] leading-relaxed text-ink2">
                <span className="label-volt font-bold">Sizing rule → </span>
                {category.sizeGuide}
              </p>
            )}
            {mode === 'search' && (
              <p className="label mt-3">
                Matching name, brand, category and every spec value — prefixes count (“inv” finds “inverter”)
              </p>
            )}
          </div>
          <p className="label tnum" aria-live="polite">
            {isFetching ? 'Updating…' : `${total} datasheet${total === 1 ? '' : 's'}`}
          </p>
        </div>
      </header>

      {/* ---------- toolbar ---------- */}
      <div className="sticky top-14 z-40 -mx-4 mb-6 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-md lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center gap-2 border border-line2 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink lg:hidden"
            aria-expanded={sheetOpen}
          >
            <IconSliders size={15} className="text-volt" />
            Filters
            {activeFilterCount(state) > 0 && (
              <span className="grid h-[17px] min-w-[17px] place-items-center rounded-full bg-volt px-1 text-[10px] font-bold text-paper tnum">
                {activeFilterCount(state)}
              </span>
            )}
          </button>

          <p className="hidden label lg:block" aria-live="polite">
            {isFetching ? 'Filtering…' : `Showing ${data?.items.length ?? 0} of ${total}`}
          </p>

          <div className="flex items-center gap-2">
            <SortMenu
              value={state.sort}
              onChange={(sort) => setState((s) => ({ ...s, sort, page: 1 }))}
            />
          </div>
        </div>

        <div className="mt-3 hidden lg:block">
          <ActiveChips state={state} setState={setState} category={category} allCategories={allCategories || []} />
        </div>
        <div className="mt-3 lg:hidden">
          <ActiveChips state={state} setState={setState} category={category} allCategories={allCategories || []} />
        </div>
      </div>

      {/* ---------- body: sidebar + results ---------- */}
      <div className="grid gap-8 lg:grid-cols-[232px_1fr] lg:gap-10">
        <aside className="hidden lg:block" aria-label="Product filters">
          <div className="sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto pb-8 pr-2 no-bar">
            {!allCategories && !allBrands ? <FilterSkeleton /> : <FilterPanel {...panelProps} />}
          </div>
        </aside>

        <div>
          {isLoading ? (
            <ProductGridSkeleton count={PER_PAGE} />
          ) : isError ? (
            <EmptyState
              code="ERR / FETCH"
              title="The catalog didn’t answer."
              message="Something interrupted the request. Your filters are safe in the URL — retry and they’ll apply exactly as before."
              action={{ label: 'Retry', onClick: () => refetch() }}
            />
          ) : total === 0 ? (
            <NoResults state={state} mode={mode} setState={setState} />
          ) : (
            <>
              <ProductGrid products={data.items} perPage={PER_PAGE} />
              <Pagination page={data.page} pages={data.pages} basePath={window.location.pathname} searchParams={searchParams} />
            </>
          )}
        </div>
      </div>

      <MobileFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        panelProps={panelProps}
        resultCount={isFetching && !data ? null : total}
      />
    </div>
  );
}

/** No-results state — helpful, never blaming, with concrete way outs */
function NoResults({ state, mode, setState }) {
  return (
    <div className="space-y-6">
      <EmptyState
        code={mode === 'search' ? 'SRCH / 0 HITS' : 'FILT / 0 HITS'}
        icon={<IconSearch size={26} />}
        title={
          mode === 'search'
            ? `Nothing in the catalog matches “${state.q}”.`
            : 'No datasheets match this combination of filters.'
        }
        message={
          mode === 'search'
            ? 'Check the spelling, or try a spec instead of a model name — searching “1.5 ton inverter” or “frost free” works better than part numbers.'
            : 'Every filter narrows the same 31-product catalog — loosening one usually brings matches back. The price band is the usual suspect.'
        }
        action={{ label: 'Clear all filters', onClick: () => setState((s) => ({ ...s, page: 1, brands: [], categories: [], priceMin: null, priceMax: null, facets: {}, ranges: {} })) }}
      />
      <div>
        <p className="label mb-3">Popular searches</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR.map((q) => (
            <Link
              key={q}
              to={`/search?q=${encodeURIComponent(q)}`}
              className="border border-line2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-ink2 transition-colors hover:border-volt hover:text-volt"
            >
              {q}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
