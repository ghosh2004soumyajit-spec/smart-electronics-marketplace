import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import SectionHead from '../ui/SectionHead';
import Reveal from '../ui/Reveal';
import ProductVisual from '../product/ProductVisual';
import { IconArrowRight } from '../ui/Icons';
import { LineSkeleton } from '../ui/Skeletons';
import api from '../../services/api';

/**
 * CategoryIndex — the catalog as a table of contents: numbered, ruled rows
 * with oversized names. Hovering a row floats its technical illustration —
 * the site's "index of datasheets", not a tile grid.
 */
export default function CategoryIndex() {
  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: api.listCategories });
  const [hovered, setHovered] = useState(null);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 lg:px-8 lg:py-24" aria-labelledby="cat-index-title">
      <SectionHead index="02" note="hover a row for the elevation drawing" title={<span id="cat-index-title">The catalog, indexed.</span>} />

      <div className="border-t border-ink">
        {!cats &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 border-b border-line py-6">
              <LineSkeleton className="h-3 w-8" />
              <LineSkeleton className="h-8 flex-1 max-w-md" />
            </div>
          ))}

        {cats?.map((c, i) => {
          const active = hovered === c.slug;
          return (
            <Reveal key={c.slug} delay={i * 0.04}>
              <Link
                to={`/c/${c.slug}`}
                onMouseEnter={() => setHovered(c.slug)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(c.slug)}
                onBlur={() => setHovered(null)}
                className="group relative flex items-center gap-4 border-b border-line py-5 transition-colors duration-300 hover:bg-paper2 sm:gap-8 sm:py-7"
                aria-label={`${c.name} — ${c.productCount} products`}
              >
                <span className={`label w-8 shrink-0 font-bold transition-colors duration-300 ${active ? 'text-volt' : ''}`}>
                  {c.index}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[clamp(1.5rem,4vw,2.6rem)] font-bold leading-tight tracking-tight">
                    <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 ease-sheet group-hover:bg-[length:100%_2px]">
                      {c.name}
                    </span>
                  </span>
                  <span className="mt-1 hidden max-w-xl text-[13px] leading-relaxed text-ink2 sm:block">
                    {c.tagline}
                  </span>
                </span>

                {/* floating elevation drawing (desktop) */}
                <span className="pointer-events-none relative hidden h-24 w-36 shrink-0 lg:block" aria-hidden="true">
                  <motion.span
                    animate={{ opacity: active ? 1 : 0, y: active ? 0 : 10, scale: active ? 1 : 0.92 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 block"
                  >
                    <ProductVisual art={c.art} alt="" className="h-full w-full text-ink" />
                  </motion.span>
                </span>

                <span className="flex shrink-0 items-center gap-3">
                  <span className="label tnum">{c.productCount} items</span>
                  <IconArrowRight
                    size={20}
                    className={`transition-all duration-300 ease-sheet ${active ? 'translate-x-0 text-volt opacity-100' : '-translate-x-2 opacity-40'}`}
                  />
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
