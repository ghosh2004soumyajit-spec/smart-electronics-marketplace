import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SectionHead from '../ui/SectionHead';
import Reveal from '../ui/Reveal';
import { IconCheck, IconCopy } from '../ui/Icons';
import { LineSkeleton } from '../ui/Skeletons';
import { formatPrice } from '../../lib/format';
import { useShop } from '../../context/ShopContext';
import api from '../../services/api';

/**
 * OffersBand — offers as ruled datasheet rows with the small print printed
 * right on the row (min order, cap, validity). Copy-code gives tactile
 * feedback. No countdown timers, no pressure tactics.
 */
export default function OffersBand() {
  const { data: offers } = useQuery({ queryKey: ['offers'], queryFn: api.listOffers });
  const { toast } = useShop();
  const [copied, setCopied] = useState(null);

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard can be blocked — the code is visible anyway */
    }
    setCopied(code);
    toast(`Offer code ${code} copied — apply it at checkout`, 'info');
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1600);
  };

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 lg:px-8 lg:py-24" aria-labelledby="offers-title">
      <SectionHead
        index="04"
        note="one offer per order unless marked stackable"
        title={<span id="offers-title">Current offers. Small print included.</span>}
      />

      <div className="border-t border-ink">
        {!offers &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-b border-line py-6">
              <LineSkeleton className="h-4 w-full max-w-md" />
            </div>
          ))}

        {offers?.map((o, i) => (
          <Reveal key={o.code} delay={i * 0.05}>
            <div className="grid items-center gap-3 border-b border-line py-5 sm:grid-cols-[auto_1fr_auto] sm:gap-8">
              {/* the code itself, as a stamped box */}
              <button
                type="button"
                onClick={() => copy(o.code)}
                aria-label={`Copy offer code ${o.code}`}
                className={`flex h-12 w-36 shrink-0 items-center justify-center gap-2 border-2 border-dashed font-mono text-sm font-bold tracking-[0.12em] transition-all duration-200 active:scale-95
                  ${copied === o.code ? 'border-volt bg-volt text-paper' : 'border-line2 text-ink hover:border-ink'}`}
              >
                {copied === o.code ? (
                  <>
                    <IconCheck size={15} /> COPIED
                  </>
                ) : (
                  <>
                    {o.code} <IconCopy size={14} className="opacity-50" />
                  </>
                )}
              </button>

              <div className="min-w-0">
                <p className="text-[15px] font-medium leading-snug">{o.description}</p>
                <p className="label mt-1.5">
                  {o.minOrder ? `Min. order ${formatPrice(o.minOrder)}` : 'No minimum'}
                  {o.maxDiscount ? ` · max discount ${formatPrice(o.maxDiscount)}` : ''}
                  {o.stackable ? ' · stackable' : ''} · valid till{' '}
                  {new Date(o.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <span className="label hidden justify-self-end sm:block">
                {o.type === 'PERCENT' ? `${o.value}% off` : o.type === 'FLAT' ? `${formatPrice(o.value)} off` : 'Free delivery'}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
