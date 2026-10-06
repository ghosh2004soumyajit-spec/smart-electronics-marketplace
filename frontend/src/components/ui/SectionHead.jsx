import Reveal from './Reveal';

/**
 * SectionHead — the site's section marker: mono index (01/02/…), a hairline
 * rule, and an oversized display heading. Used by every home section so the
 * "document structure" reads consistently, like a real datasheet.
 */
export default function SectionHead({ index, title, note = null, align = 'left', className = '' }) {
  return (
    <Reveal className={`mb-8 sm:mb-10 ${className}`}>
      <div className="flex items-center gap-4">
        {index && <span className="label-volt font-bold">{index}</span>}
        <div className="h-px flex-1 bg-line2" aria-hidden="true" />
        {note && <span className="label hidden sm:block">{note}</span>}
      </div>
      <h2
        className={`mt-4 font-display text-data2 font-bold balance ${align === 'center' ? 'text-center' : ''}`}
      >
        {title}
      </h2>
    </Reveal>
  );
}
