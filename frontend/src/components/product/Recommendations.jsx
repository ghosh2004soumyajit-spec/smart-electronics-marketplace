import { useEffect, useState } from 'react';
import api from '../../services/api';
import ProductCard from './ProductCard';
import { LineSkeleton } from '../ui/Skeletons';

export default function Recommendations({ categorySlug, currentProductId, title = 'Recommended for your setup' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let res;
        if (categorySlug) {
          res = await api.listProducts({ cat: categorySlug, limit: 4 });
          res = res.items || res;
        } else {
          res = await api.listFeatured();
        }
        // Filter out current product
        const filtered = (res || []).filter((p) => p.id !== currentProductId).slice(0, 3);
        setItems(filtered);
      } catch (err) {
        console.error('Failed to load recommendations', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [categorySlug, currentProductId]);

  if (!loading && items.length === 0) return null;

  return (
    <section className="mt-14" aria-label="Product recommendations">
      <div className="flex items-center gap-4 border-b border-ink pb-3">
        <span className="label-volt font-bold">RECOMMENDED</span>
        <h2 className="font-display text-xl font-bold uppercase tracking-tight">{title}</h2>
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <LineSkeleton className="h-64 w-full" />
          <LineSkeleton className="h-64 w-full" />
          <LineSkeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
}
