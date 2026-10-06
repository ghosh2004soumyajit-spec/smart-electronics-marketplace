import { IconChevronDown } from '../ui/Icons';

const OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price ↑ low to high' },
  { value: 'price-desc', label: 'Price ↓ high to low' },
  { value: 'rating', label: 'Buyer rating' },
  { value: 'discount', label: 'Discount' },
  { value: 'newest', label: 'Newest first' },
];

/**
 * SortMenu — a styled native <select>: full keyboard/screen-reader support
 * for free, zero custom-dropdown edge cases. Sorting changes are instant;
 * no animation on results beyond the standard grid re-layout.
 */
export default function SortMenu({ value, onChange }) {
  return (
    <div className="relative">
      <label htmlFor="sort-select" className="sr-only">
        Sort products
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none border border-line bg-paper py-2 pl-3 pr-9 font-mono text-[11px] uppercase tracking-[0.1em] text-ink2 transition-colors hover:border-ink focus:border-ink focus:outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            Sort: {o.label}
          </option>
        ))}
      </select>
      <IconChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink3" />
    </div>
  );
}
