/** @type {import('tailwindcss').Config} */
// VoltHaus design tokens — "Spec sheet as interface".
// One bold accent (volt) on a warm paper base with graphite ink.
// Contrast-checked: volt #CE3607 on paper = 4.5:1+, white on volt = 5.0:1.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F2EA', // warm off-white base
        paper2: '#EDE8DB', // banded sections
        card: '#FAF8F2', // raised surfaces
        ink: '#191817', // deep graphite
        ink2: '#44413A', // secondary text
        ink3: '#75705F', // muted text / annotations
        line: '#DCD5C4', // hairline rules
        line2: '#C6BDA6', // stronger rules
        volt: '#CE3607', // the one bold accent
        voltbright: '#E8480D', // large text / decorative only
        voltdeep: '#9C2904', // hover / pressed
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Oversized data-display scale
        data: ['clamp(3.5rem,9vw,7.5rem)', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        data2: ['clamp(2.25rem,5vw,4rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        label: ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.14em' }],
      },
      letterSpacing: {
        label: '0.14em',
      },
      transitionTimingFunction: {
        // Signature easing — a long, confident deceleration
        sheet: 'cubic-bezier(0.16, 1, 0.3, 1)',
        snap: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // tactile overshoot for add-to-cart etc.
      },
      boxShadow: {
        sheet: '6px 6px 0 0 #191817', // hard offset "paper stack" shadow
        lift: '0 12px 32px -12px rgba(25,24,23,0.18)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.35)' },
          '100%': { transform: 'scale(1)' },
        },
        blink: {
          '0%,100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        pop: 'pop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        blink: 'blink 1.1s steps(1) infinite',
      },
    },
  },
  plugins: [],
};
