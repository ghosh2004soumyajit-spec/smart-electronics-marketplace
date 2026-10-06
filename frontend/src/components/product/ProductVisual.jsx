/**
 * ProductVisual — technical line-art elevations drawn as inline SVG.
 *
 * Why line art instead of photos: the signature concept is "spec sheet as
 * interface", so products are drawn the way an engineer would document them
 * — front elevation, hairline strokes, dimension lines, one volt indicator.
 * Zero image weight, zero CLS, and it stays on-brand at any size.
 *
 * When real photography arrives (Cloudinary / product_images), pass an
 * `imageUrl` and it renders a lazy, responsive <img> instead.
 */

const DIM = { stroke: 'currentColor', strokeWidth: 1, opacity: 0.55 };
const dimText = { fontFamily: "'Space Mono', monospace", fontSize: 10.5, opacity: 0.6 };

/** Small registration crosses in the corners — technical-drawing signature */
const RegistrationMarks = () => (
  <g stroke="currentColor" strokeWidth="1" opacity="0.35">
    {[
      [26, 26],
      [374, 26],
      [26, 274],
      [374, 274],
    ].map(([x, y]) => (
      <g key={`${x}-${y}`}>
        <line x1={x - 5} y1={y} x2={x + 5} y2={y} />
        <line x1={x} y1={y - 5} x2={x} y2={y + 5} />
      </g>
    ))}
  </g>
);

/** Horizontal dimension line with serif ticks + centered label */
const DimH = ({ x1, x2, y, label }) => (
  <g {...DIM}>
    <line x1={x1} y1={y} x2={x2} y2={y} />
    <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
    <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
    <rect x={(x1 + x2) / 2 - 42} y={y - 9} width="84" height="18" fill="#FAF8F2" stroke="none" opacity="0.9" />
    <text x={(x1 + x2) / 2} y={y + 3.5} textAnchor="middle" fill="currentColor" stroke="none" style={dimText}>
      {label}
    </text>
  </g>
);

/** Vertical dimension line */
const DimV = ({ x, y1, y2, label }) => (
  <g {...DIM}>
    <line x1={x} y1={y1} x2={x} y2={y2} />
    <line x1={x - 5} y1={y1} x2={x + 5} y2={y1} />
    <line x1={x - 5} y1={y2} x2={x + 5} y2={y2} />
    <text x={x + 8} y={(y1 + y2) / 2} fill="currentColor" stroke="none" style={dimText} transform={`rotate(90 ${x + 8} ${(y1 + y2) / 2})`} textAnchor="middle">
      {label}
    </text>
  </g>
);

const ART = {
  'ac-split': (
    <>
      {/* Indoor unit */}
      <rect x="80" y="66" width="240" height="64" rx="9" fill="none" strokeWidth="2" />
      <line x1="94" y1="108" x2="306" y2="108" strokeWidth="1.5" opacity="0.8" />
      <line x1="94" y1="118" x2="306" y2="118" strokeWidth="1.5" opacity="0.8" />
      <circle cx="302" cy="82" r="3.4" fill="#CE3607" stroke="none" />
      <line x1="92" y1="82" x2="128" y2="82" strokeWidth="1.5" opacity="0.5" />
      {/* Airflow */}
      <g stroke="currentColor" strokeWidth="1.25" opacity="0.45" strokeDasharray="4 6" fill="none">
        <path d="M126 138 q14 26 4 50" />
        <path d="M200 138 q0 30 -6 54" />
        <path d="M274 138 q-12 26 -2 50" />
      </g>
      <DimH x1={80} x2={320} y={216} label="≈ 980 mm" />
      <DimV x={352} y1={66} y2={130} label="≈ 220 mm" />
    </>
  ),

  'ac-window': (
    <>
      <rect x="90" y="86" width="220" height="122" rx="5" fill="none" strokeWidth="2" />
      {/* Grille */}
      <g strokeWidth="1.25" opacity="0.65">
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={i} x1={106 + i * 15} y1={100} x2={106 + i * 15} y2={168} />
        ))}
      </g>
      <line x1="100" y1="182" x2="240" y2="182" strokeWidth="1.5" opacity="0.7" />
      <line x1="100" y1="192" x2="240" y2="192" strokeWidth="1.5" opacity="0.7" />
      {/* Controls */}
      <rect x="258" y="98" width="40" height="98" rx="3" fill="none" strokeWidth="1.5" />
      <circle cx="278" cy="120" r="9" fill="none" strokeWidth="1.5" />
      <line x1="278" y1="120" x2="278" y2="112" strokeWidth="1.5" />
      <circle cx="278" cy="176" r="3.4" fill="#CE3607" stroke="none" />
      <DimH x1={90} x2={310} y={236} label="≈ 660 mm" />
    </>
  ),

  'fridge-sd': (
    <>
      <rect x="142" y="36" width="116" height="228" rx="4" fill="none" strokeWidth="2" />
      <line x1="142" y1="98" x2="258" y2="98" strokeWidth="1.5" />
      <line x1="246" y1="56" x2="246" y2="84" strokeWidth="3" strokeLinecap="round" />
      <line x1="246" y1="116" x2="246" y2="164" strokeWidth="3" strokeLinecap="round" />
      <rect x="160" y="112" width="26" height="12" rx="2" fill="none" strokeWidth="1.25" opacity="0.8" />
      <circle cx="180" cy="118" r="2.4" fill="#CE3607" stroke="none" />
      <line x1="154" y1="264" x2="154" y2="272" strokeWidth="2" />
      <line x1="246" y1="264" x2="246" y2="272" strokeWidth="2" />
      <DimV x={292} y1={36} y2={264} label="≈ 1250 mm" />
    </>
  ),

  'fridge-dd': (
    <>
      <rect x="138" y="28" width="124" height="240" rx="4" fill="none" strokeWidth="2" />
      <line x1="138" y1="108" x2="262" y2="108" strokeWidth="1.5" />
      <line x1="250" y1="48" x2="250" y2="88" strokeWidth="3" strokeLinecap="round" />
      <line x1="250" y1="128" x2="250" y2="184" strokeWidth="3" strokeLinecap="round" />
      <rect x="156" y="124" width="26" height="12" rx="2" fill="none" strokeWidth="1.25" opacity="0.8" />
      <circle cx="176" cy="130" r="2.4" fill="#CE3607" stroke="none" />
      <line x1="150" y1="268" x2="150" y2="276" strokeWidth="2" />
      <line x1="250" y1="268" x2="250" y2="276" strokeWidth="2" />
      <DimV x={296} y1={28} y2={268} label="≈ 1650 mm" />
    </>
  ),

  'fridge-bm': (
    <>
      <rect x="138" y="28" width="124" height="240" rx="4" fill="none" strokeWidth="2" />
      <line x1="138" y1="192" x2="262" y2="192" strokeWidth="1.5" />
      <line x1="176" y1="214" x2="224" y2="214" strokeWidth="3" strokeLinecap="round" />
      <line x1="250" y1="60" x2="250" y2="140" strokeWidth="3" strokeLinecap="round" />
      <rect x="156" y="48" width="26" height="12" rx="2" fill="none" strokeWidth="1.25" opacity="0.8" />
      <circle cx="176" cy="54" r="2.4" fill="#CE3607" stroke="none" />
      <DimV x={296} y1={28} y2={268} label="≈ 1800 mm" />
    </>
  ),

  'fridge-sbs': (
    <>
      <rect x="96" y="34" width="208" height="232" rx="4" fill="none" strokeWidth="2" />
      <line x1="200" y1="34" x2="200" y2="266" strokeWidth="1.5" />
      <line x1="190" y1="104" x2="190" y2="176" strokeWidth="3" strokeLinecap="round" />
      <line x1="210" y1="104" x2="210" y2="176" strokeWidth="3" strokeLinecap="round" />
      {/* Water dispenser */}
      <rect x="118" y="92" width="44" height="58" rx="3" fill="none" strokeWidth="1.25" opacity="0.8" />
      <line x1="140" y1="104" x2="140" y2="118" strokeWidth="1.5" opacity="0.8" />
      <circle cx="140" cy="136" r="2.6" fill="#CE3607" stroke="none" />
      <DimH x1={96} x2={304} y={286} label="≈ 908 mm" />
    </>
  ),

  'washer-fl': (
    <>
      <rect x="110" y="40" width="180" height="216" rx="6" fill="none" strokeWidth="2" />
      <line x1="110" y1="84" x2="290" y2="84" strokeWidth="1.5" />
      {/* Controls */}
      <circle cx="256" cy="62" r="12" fill="none" strokeWidth="1.5" />
      <line x1="256" y1="62" x2="256" y2="52" strokeWidth="1.5" />
      <rect x="132" y="54" width="62" height="17" rx="2" fill="none" strokeWidth="1.25" opacity="0.8" />
      <circle cx="140" cy="62" r="2.6" fill="#CE3607" stroke="none" />
      {/* Door */}
      <circle cx="200" cy="170" r="58" fill="none" strokeWidth="2" />
      <circle cx="200" cy="170" r="43" fill="none" strokeWidth="1.25" opacity="0.7" />
      <path d="M200 127 a43 43 0 0 1 37 21" fill="none" strokeWidth="1.25" opacity="0.5" />
      <line x1="258" y1="164" x2="268" y2="164" strokeWidth="3" strokeLinecap="round" />
      <DimH x1={110} x2={290} y={278} label="600 mm" />
    </>
  ),

  'washer-tl': (
    <>
      <rect x="118" y="52" width="164" height="204" rx="6" fill="none" strokeWidth="2" />
      {/* Lid */}
      <line x1="118" y1="96" x2="282" y2="96" strokeWidth="1.5" />
      <line x1="168" y1="74" x2="232" y2="74" strokeWidth="3" strokeLinecap="round" />
      {/* Rear panel */}
      <rect x="130" y="58" width="140" height="12" rx="2" fill="none" strokeWidth="1.25" opacity="0.8" />
      <circle cx="256" cy="64" r="2.6" fill="#CE3607" stroke="none" />
      {/* Tub hint */}
      <circle cx="200" cy="170" r="46" fill="none" strokeWidth="1.25" opacity="0.4" strokeDasharray="4 5" />
      <line x1="130" y1="234" x2="270" y2="234" strokeWidth="1.25" opacity="0.6" />
      <DimH x1={118} x2={282} y={278} label="550 mm" />
    </>
  ),

  tv: (
    <>
      <rect x="52" y="44" width="296" height="176" rx="3" fill="none" strokeWidth="2" />
      <rect x="60" y="52" width="280" height="154" rx="1" fill="none" strokeWidth="1" opacity="0.55" />
      <circle cx="200" cy="212" r="2.6" fill="#CE3607" stroke="none" />
      {/* Stand */}
      <line x1="188" y1="220" x2="182" y2="244" strokeWidth="2" />
      <line x1="212" y1="220" x2="218" y2="244" strokeWidth="2" />
      <line x1="146" y1="246" x2="254" y2="246" strokeWidth="3" strokeLinecap="round" />
      {/* Diagonal dimension */}
      <line x1="62" y1="204" x2="338" y2="54" strokeWidth="1" opacity="0.5" strokeDasharray="5 6" />
      <rect x="164" y="119" width="72" height="18" fill="#FAF8F2" stroke="none" opacity="0.92" />
      <text x="200" y="132" textAnchor="middle" fill="currentColor" stroke="none" style={dimText}>
        diagonal
      </text>
      <DimH x1={52} x2={348} y={272} label="see spec sheet →" />
    </>
  ),

  phone: (
    <>
      <rect x="146" y="24" width="108" height="252" rx="17" fill="none" strokeWidth="2" />
      <rect x="153" y="31" width="94" height="238" rx="12" fill="none" strokeWidth="1" opacity="0.55" />
      {/* Punch-hole camera */}
      <circle cx="200" cy="46" r="4.2" fill="none" strokeWidth="1.75" stroke="#CE3607" />
      {/* Buttons */}
      <line x1="254" y1="88" x2="254" y2="120" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="254" y1="134" x2="254" y2="158" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="146" y1="100" x2="146" y2="114" strokeWidth="2.5" strokeLinecap="round" />
      {/* USB-C */}
      <line x1="188" y1="270.5" x2="212" y2="270.5" strokeWidth="1.5" opacity="0.7" />
      {/* Fingerprint hint */}
      <circle cx="200" cy="238" r="9" fill="none" strokeWidth="1" opacity="0.4" strokeDasharray="3 4" />
      <DimV x={118} y1={24} y2={276} label="≈ 160 mm" />
    </>
  ),
};

export default function ProductVisual({ art = 'tv', alt = 'Product illustration', className = '', imageUrl = null, imageAlt = null }) {
  // Real photography path (Cloudinary) — used once product_images exist.
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={imageAlt || alt}
        loading="lazy"
        decoding="async"
        className={`h-full w-full object-contain ${className}`}
      />
    );
  }
  return (
    <svg
      viewBox="0 0 400 300"
      role="img"
      aria-label={alt}
      className={`text-ink ${className}`}
      fill="none"
      stroke="currentColor"
      preserveAspectRatio="xMidYMid meet"
    >
      <RegistrationMarks />
      {ART[art] ?? ART.tv}
    </svg>
  );
}
