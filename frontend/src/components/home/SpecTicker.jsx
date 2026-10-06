import { tickerFacts } from '../../data/seed';

/**
 * SpecTicker — a marquee of buying rules, not marketing slogans.
 * Pure CSS animation (cheap), pauses on hover, and the global
 * prefers-reduced-motion rule stops it dead. Content is duplicated for a
 * seamless loop; the duplicate is hidden from screen readers.
 */
export default function SpecTicker() {
  const row = [...tickerFacts, ...tickerFacts];
  return (
    <div
      className="group relative overflow-hidden border-b border-ink bg-ink py-2.5 text-paper"
      aria-label="VoltHaus buying rules"
    >
      <div className="flex w-max animate-marquee items-center gap-10 group-hover:[animation-play-state:paused]">
        {row.map((fact, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.22em]">
            {fact}
            <span className="text-voltbright" aria-hidden="true">
              ✳
            </span>
          </span>
        ))}
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-ink to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-ink to-transparent" aria-hidden="true" />
    </div>
  );
}
