import Reveal from '../ui/Reveal';
import { trustFacts } from '../../data/seed';

/**
 * TrustStrip — four concrete claims in a ruled row. Numbers, not adjectives;
 * a strip, not a bento grid.
 */
export default function TrustStrip() {
  return (
    <section aria-label="Why VoltHaus" className="mx-auto max-w-[1440px] px-4 lg:px-8">
      <Reveal>
        <dl className="grid grid-cols-1 gap-px border-y border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {trustFacts.map((f, i) => (
            <div key={f.k} className="bg-paper px-5 py-7">
              <dt className="label">
                <span className="label-volt mr-2 font-bold">0{i + 1}</span>
                {f.k}
              </dt>
              <dd className="mt-2 font-display text-[17px] font-medium leading-snug">{f.v}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
