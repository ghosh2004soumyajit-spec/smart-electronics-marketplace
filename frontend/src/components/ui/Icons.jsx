/**
 * Icon set — inline stroke SVGs (no icon library, no network requests).
 * All inherit currentColor; size via className.
 */

const S = ({ children, size = 20, fill = 'none', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const IconSearch = (p) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </S>
);

export const IconHeart = ({ filled = false, ...p }) => (
  <S {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20.5S4 15.5 4 9.8C4 6.6 6.5 4.5 9 4.5c1.6 0 2.7.8 3 1.6.3-.8 1.4-1.6 3-1.6 2.5 0 5 2.1 5 5.3 0 5.7-8 10.7-8 10.7Z" />
  </S>
);

export const IconBag = (p) => (
  <S {...p}>
    <path d="M6 8h12l1 12H5L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </S>
);

export const IconMenu = (p) => (
  <S {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </S>
);

export const IconClose = (p) => (
  <S {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </S>
);

export const IconChevronDown = (p) => (
  <S {...p}>
    <path d="m6 9 6 6 6-6" />
  </S>
);

export const IconArrowRight = (p) => (
  <S {...p}>
    <path d="M4 12h16m-6-6 6 6-6 6" />
  </S>
);

export const IconStar = (p) => (
  <S {...p} fill="currentColor" stroke="none">
    <path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
  </S>
);

export const IconCheck = (p) => (
  <S {...p}>
    <path d="m5 13 4 4L19 7" />
  </S>
);

export const IconPlus = (p) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);

export const IconMinus = (p) => (
  <S {...p}>
    <path d="M5 12h14" />
  </S>
);

export const IconEdit = (p) => (
  <S {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </S>
);

export const IconTrash = (p) => (
  <S {...p}>
    <path d="M4 7h16M10 7V5h4v2m-7 0 1 13h8l1-13" />
  </S>
);

export const IconTruck = (p) => (
  <S {...p}>
    <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </S>
);

export const IconCopy = (p) => (
  <S {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h8" />
  </S>
);

export const IconSliders = (p) => (
  <S {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </S>
);

export const IconBox = (p) => (
  <S {...p}>
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="M4 7.5 12 12l8-4.5M12 12v9" />
  </S>
);

export const IconDoc = (p) => (
  <S {...p}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4M9 12h6M9 16h6" />
  </S>
);

export const IconPin = (p) => (
  <S {...p}>
    <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </S>
);

export const IconLock = (p) => (
  <S {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </S>
);

export const IconShield = (p) => (
  <S {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </S>
);

/** The VoltHaus mark: a "V" drawn as a voltmeter needle inside a rule box. */
export const LogoMark = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect x="1" y="1" width="30" height="30" fill="#191817" />
    <path d="M8 9.5 16 24l8-14.5" stroke="#CE3607" strokeWidth="2.6" fill="none" strokeLinecap="square" />
    <path d="M5 9.5h3M24 9.5h3" stroke="#F5F2EA" strokeWidth="1.4" />
  </svg>
);
