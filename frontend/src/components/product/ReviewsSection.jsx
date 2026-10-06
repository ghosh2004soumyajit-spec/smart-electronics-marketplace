import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { StarRow } from '../ui/Rating';
import { LineSkeleton } from '../ui/Skeletons';
import { formatRating } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';

function StarSelector({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none"
        >
          <span className={(hovered || value) >= star ? 'text-volt' : 'text-line2'}>★</span>
        </button>
      ))}
      <span className="ml-2 font-mono text-xs text-ink3">{value} of 5 stars</span>
    </div>
  );
}

/**
 * ReviewsSection — average rating, distribution histogram, individual
 * reviews (GET /api/products/:id/reviews), and verified review submission form.
 */
export default function ReviewsSection({ product }) {
  const { isAuthenticated, user } = useAuth();
  const shop = useShop();
  const toast = shop?.toast;
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', product.id],
    queryFn: () => api.listReviews(product.id),
  });

  const items = Array.isArray(data) ? data : (data?.items || []);
  const total = data?.total ?? items.length;
  const distribution = data?.distribution || [5, 4, 3, 2, 1].map((stars) => {
    const count = items.filter((r) => (r.rating ?? r.stars) === stars).length;
    const percentage = total ? Math.round((count / total) * 100) : 0;
    return { stars, count, percentage };
  });

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      if (toast) toast('Please write a review comment before submitting.', 'error');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.submitReview(product.id, {
        rating,
        title: title.trim(),
        comment: comment.trim(),
        userId: user?.id,
        userName: user?.full_name,
      });
      if (toast) toast('Thank you! Your review has been submitted.', 'success');
      setShowForm(false);
      setTitle('');
      setComment('');
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['reviews', product.id] });
    } catch (err) {
      if (toast) toast(err?.response?.data?.error || 'Failed to submit review.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="reviews-title" className="border-t border-line pt-10">
      <div className="flex items-center gap-4">
        <span className="label-volt font-bold">04</span>
        <span className="h-px flex-1 bg-line2" aria-hidden="true" />
        <span className="label hidden sm:block">verified buyers only</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h2 id="reviews-title" className="font-display text-3xl font-bold sm:text-4xl">
          What owners say.
        </h2>

        {!showForm && (
          <div>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 border border-ink bg-ink px-4 py-2 font-mono text-xs uppercase tracking-wider text-paper transition-colors hover:bg-volt hover:border-volt"
              >
                Write a Review
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 border border-line bg-paper px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:border-ink hover:text-volt"
              >
                Sign in to review
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Review Submission Form */}
      {showForm && (
        <form
          onSubmit={handleSubmitReview}
          className="mt-6 border border-volt bg-volt/5 p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-display text-lg font-bold uppercase text-ink">
              Write a Verified Review
            </h3>
            <span className="font-mono text-xs text-ink3">Reviewing: {product.title || product.name}</span>
          </div>

          <div>
            <label className="label mb-1.5 block">Overall Rating *</label>
            <StarSelector value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="label mb-1 block">Review Headline</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Excellent cooling, very quiet compressor"
              className="w-full border border-line bg-paper px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-volt"
            />
          </div>

          <div>
            <label className="label mb-1 block">Your Review *</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience regarding performance, build quality, power usage, or installation..."
              required
              className="w-full border border-line bg-paper px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-volt"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="border border-volt bg-volt px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-paper hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-line bg-paper px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-ink2 hover:border-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="mt-8 space-y-3">
          <LineSkeleton className="h-4 w-40" />
          <LineSkeleton className="h-24 w-full" />
        </div>
      ) : total === 0 ? (
        <div className="mt-8 border border-line bg-card p-6">
          <p className="text-[14.5px] text-ink2">
            No reviews for this product yet. Once you’ve bought and used it, your rating will appear
            here — reviews are limited to verified purchases.
          </p>
          {!showForm && (
            <p className="label mt-3">Be the first verified owner to share your feedback above.</p>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[280px_1fr]">
          {/* summary + distribution */}
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[4.5rem] font-bold leading-none tnum">
                {formatRating(product.rating)}
              </span>
              <div>
                <StarRow value={product.rating} size={15} />
                <p className="label mt-1.5 tnum">{product.reviewCount?.toLocaleString('en-IN') ?? 0} ratings</p>
              </div>
            </div>

            <ul className="mt-6 space-y-1.5" aria-label="Rating distribution of sampled reviews">
              {distribution.map((d) => {
                const pct = d.percentage ?? (total ? Math.round((d.count / total) * 100) : 0);
                return (
                  <li key={d.stars} className="flex items-center gap-2.5 font-mono text-[11px]">
                    <span className="w-8 text-ink3 tnum">{d.stars}★</span>
                    <span className="h-2 flex-1 bg-paper2" role="img" aria-label={`${d.count} of ${total} sampled reviews at ${d.stars} stars`}>
                      <span className="block h-full bg-ink transition-[width] duration-500 ease-sheet" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-6 text-right text-ink3 tnum">{d.count}</span>
                  </li>
                );
              })}
            </ul>
            <p className="label mt-3">Sample of {total} written review{total === 1 ? '' : 's'}</p>
          </div>

          {/* review list */}
          <ul className="divide-y divide-line border-y border-line">
            {items.map((r) => {
              const reviewer = r.userName || r.user_name || r.reviewer_name || 'Verified Buyer';
              const isVerified = r.verified ?? r.is_verified ?? true;
              const rating = r.rating ?? r.stars ?? 5;
              const dateStr = r.createdAt || r.created_at || new Date().toISOString();

              return (
                <li key={r.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <StarRow value={rating} size={13} />
                    <span className="text-[13.5px] font-medium">{reviewer}</span>
                    {isVerified && <span className="label-volt font-bold">✓ Verified purchase</span>}
                    <span className="label ml-auto tnum">
                      {new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {r.title && <p className="mt-1 font-mono text-xs font-bold text-ink">{r.title}</p>}
                  <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-ink2">{r.comment}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
