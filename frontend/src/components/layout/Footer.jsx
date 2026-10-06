import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogoMark } from '../ui/Icons';
import { categories as seedCategories } from '../../data/seed';
import api from '../../services/api';

/**
 * Footer — practical, dense, honest. Categories, real support facts, and
 * contact info. No newsletter dark pattern, no social icon soup, no
 * mega-footer of dead links. Graphite block to bookend the paper site.
 */
export default function Footer() {
  const { data: fetchedCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.listCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const categories = (fetchedCategories && fetchedCategories.length > 0)
    ? fetchedCategories
    : seedCategories;
  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* identity */}
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark size={30} />
              <span className="font-display text-lg font-bold uppercase tracking-[0.2em]">
                Volt<span className="text-voltbright">Haus</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-paper/70">
              A single-store electronics shop that sells with spec sheets, not slogans. Every
              capacity, star rating and rupee on this site is checked against the product before
              it goes live.
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-paper/50">
              Servicing 19,240 pincodes · 2–5 day delivery
            </p>
          </div>

          {/* categories */}
          <nav aria-label="Footer categories">
            <p className="label !text-paper/50">Catalog</p>
            <ul className="mt-4 space-y-2.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link to={`/c/${c.slug}`} className="ul-link text-[13.5px] text-paper/85 transition-colors hover:text-paper">
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/shop" className="ul-link text-[13.5px] text-paper/85 transition-colors hover:text-paper">
                  All products
                </Link>
              </li>
            </ul>
          </nav>

          {/* support facts — real numbers, not dead policy links */}
          <div>
            <p className="label !text-paper/50">Support</p>
            <ul className="mt-4 space-y-2.5 text-[13.5px] text-paper/85">
              <li>7-day replacement on manufacturing defects</li>
              <li>Brand warranty handled at authorised centres</li>
              <li>
                <a href="mailto:support@volthaus.in" className="ul-link transition-colors hover:text-paper">
                  support@volthaus.in
                </a>
              </li>
              <li>
                <a href="tel:+918047182200" className="ul-link tnum transition-colors hover:text-paper">
                  +91 80-4718-2200
                </a>
                <span className="block font-mono text-[11px] text-paper/50">Mon–Sat, 9 am – 7 pm IST</span>
              </li>
            </ul>
          </div>

          {/* policies + account */}
          <div>
            <p className="label !text-paper/50">Account & policies</p>
            <ul className="mt-4 space-y-2.5 text-[13.5px] text-paper/85">
              <li>
                <Link to="/cart" className="ul-link transition-colors hover:text-paper">Your cart</Link>
              </li>
              <li>
                <Link to="/wishlist" className="ul-link transition-colors hover:text-paper">Your wishlist</Link>
              </li>
              <li>Shipping & delivery — calculated per pincode at checkout</li>
              <li>Returns & replacements — 7-day window, original packaging</li>
              <li>Privacy — we store your address to deliver, nothing else</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-paper/15 pt-6 font-mono text-[11px] tracking-wide text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 VoltHaus Retail Pvt. Ltd. · Bengaluru, India</p>
          <p>All prices in ₹, inclusive of taxes · No payment gateway in this build phase</p>
        </div>
      </div>
    </footer>
  );
}
