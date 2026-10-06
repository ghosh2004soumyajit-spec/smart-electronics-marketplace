import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { useShop } from '../context/ShopContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice, discountPct } from '../lib/format';
import ProductVisual from '../components/product/ProductVisual';
import EmptyState from '../components/ui/EmptyState';
import Rating from '../components/ui/Rating';
import { IconBag, IconClose, IconSliders, IconCheck } from '../components/ui/Icons';

export default function Compare() {
  useDocumentTitle('Product Datasheet Comparison Matrix');
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useShop();

  if (compareItems.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          code="COMPARE / NO_ITEMS"
          icon={<IconSliders size={28} />}
          title="No products selected for comparison."
          message="Select up to 4 items from the catalog index to compare technical specifications, pricing, and features side-by-side."
          action={{ label: 'Browse Electronics Catalog', to: '/shop' }}
        />
      </div>
    );
  }

  // Extract all unique spec keys across all compared products
  const allSpecKeys = Array.from(
    new Set(
      compareItems.flatMap((p) => {
        const specs = p.specs || {};
        return Object.keys(specs).filter((k) => !k.endsWith('_bucket'));
      })
    )
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-8 lg:px-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink pb-6">
        <div>
          <p className="label-volt font-bold">DATASHEET MATRIX / {compareItems.length} PRODUCTS</p>
          <h1 className="mt-2 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-bold uppercase leading-none tracking-tight">
            Spec Comparison.
          </h1>
          <p className="label mt-2">Side-by-side technical evaluation and performance breakdown</p>
        </div>

        <button
          type="button"
          onClick={clearCompare}
          className="inline-flex h-10 items-center gap-1.5 border border-line bg-paper px-4 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:border-red-500 hover:text-red-500"
        >
          Clear All Comparison Items
        </button>
      </header>

      {/* Comparison Matrix Table */}
      <div className="mt-8 border border-ink bg-card overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left font-mono text-xs">
          <thead>
            {/* Product Card Row */}
            <tr className="border-b border-ink bg-paper2">
              <th className="w-48 p-4 font-bold uppercase text-ink3 border-r border-line">
                Specification Key
              </th>
              {compareItems.map((p) => {
                const title = p.title || p.name;
                const img = p.primary_image;
                const mrp = p.price?.mrp ?? p.base_price ?? 0;
                const sale = p.price?.sale ?? p.discount_price ?? 0;
                const stock = p.stock_quantity ?? p.stock ?? 0;
                const dPct = discountPct(mrp, sale);

                return (
                  <th key={p.id} className="p-4 border-r border-line min-w-[220px] align-top bg-card">
                    <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                      <span className="label tnum">DAT/{String(p.id).padStart(3, '0')}</span>
                      <button
                        type="button"
                        onClick={() => removeFromCompare(p.id)}
                        aria-label={`Remove ${title} from comparison`}
                        className="text-ink3 hover:text-red-500 transition-colors"
                      >
                        <IconClose size={15} />
                      </button>
                    </div>

                    <Link to={`/p/${p.slug}`} className="block bg-blueprint mb-3">
                      <div className="aspect-[4/3] p-4 flex items-center justify-center overflow-hidden">
                        {img ? (
                          <img src={img} alt={title} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <ProductVisual art={p.art} alt="" className="h-full w-full" />
                        )}
                      </div>
                    </Link>

                    <h2 className="font-display text-sm font-bold text-ink line-clamp-2">
                      <Link to={`/p/${p.slug}`} className="hover:text-volt transition-colors">{title}</Link>
                    </h2>
                    <p className="label mt-1">{p.brand?.name || p.brand_name}</p>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-lg font-bold tnum text-ink">{formatPrice(sale)}</span>
                      {dPct > 0 && <span className="label-volt font-bold tnum">−{dPct}%</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(p, 1)}
                      disabled={stock === 0}
                      className="mt-3 flex h-10 w-full items-center justify-center gap-2 bg-ink font-mono text-[11px] uppercase tracking-wider text-paper transition-colors hover:bg-volt disabled:opacity-40"
                    >
                      <IconBag size={14} /> {stock === 0 ? 'Out of stock' : 'Add to Cart'}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {/* Stock Row */}
            <tr className="hover:bg-paper2/50 transition-colors">
              <td className="p-4 font-bold text-ink border-r border-line uppercase">Inventory Status</td>
              {compareItems.map((p) => {
                const stock = p.stock_quantity ?? p.stock ?? 0;
                return (
                  <td key={p.id} className="p-4 border-r border-line font-bold">
                    {stock === 0 ? (
                      <span className="text-red-500">Out of Stock</span>
                    ) : (
                      <span className="text-volt">{stock} Units Available</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Rating Row */}
            <tr className="hover:bg-paper2/50 transition-colors">
              <td className="p-4 font-bold text-ink border-r border-line uppercase">Customer Rating</td>
              {compareItems.map((p) => {
                const rating = p.rating ?? p.avg_rating ?? 0;
                const count = p.reviewCount ?? p.review_count ?? 0;
                return (
                  <td key={p.id} className="p-4 border-r border-line">
                    <Rating value={rating} count={count} />
                  </td>
                );
              })}
            </tr>

            {/* Category Row */}
            <tr className="hover:bg-paper2/50 transition-colors">
              <td className="p-4 font-bold text-ink border-r border-line uppercase">Category</td>
              {compareItems.map((p) => (
                <td key={p.id} className="p-4 border-r border-line text-ink2">
                  {p.category?.name || p.category_name || 'Electronics'}
                </td>
              ))}
            </tr>

            {/* Unique Spec Rows */}
            {allSpecKeys.map((key) => {
              const label = key.replace(/_/g, ' ').toUpperCase();
              return (
                <tr key={key} className="hover:bg-paper2/50 transition-colors">
                  <td className="p-4 font-bold text-ink border-r border-line">{label}</td>
                  {compareItems.map((p) => {
                    const specs = p.specs || {};
                    const val = specs[key];
                    let displayVal = '—';
                    if (val != null) {
                      if (typeof val === 'object' && 'value' in val) {
                        displayVal = `${val.value}${val.unit ? ' ' + val.unit : ''}`;
                      } else {
                        displayVal = String(val);
                      }
                    }
                    return (
                      <td key={p.id} className="p-4 border-r border-line text-ink">
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
