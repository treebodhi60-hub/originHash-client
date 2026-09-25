const Svg = ({ size = 20, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {children}
  </svg>
);

export const ShieldIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="m9 12 2.2 2.2L15.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const QrIcon = ({ size }) => (
  <Svg size={size}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM18 14h2.5M14 18v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
);

export const CheckIcon = ({ size }) => (
  <Svg size={size}>
    <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CrossIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

export const AlertIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M12 7.5v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="12" cy="17" r="1.3" fill="currentColor" />
  </Svg>
);

export const BoxIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M4 7.5 12 3.5l8 4v9l-8 4-8-4v-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="m4 7.5 8 4 8-4M12 11.5v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </Svg>
);

export const ChevronRightIcon = ({ size }) => (
  <Svg size={size}>
    <path d="m9.5 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ArrowLeftIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const FlashIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12L13 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </Svg>
);

export const ImageIcon = ({ size }) => (
  <Svg size={size}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="9" cy="10" r="1.7" stroke="currentColor" strokeWidth="1.5" />
    <path d="m4.5 17.5 4.5-4.5 3 3 2.5-2.5 5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </Svg>
);

export const KeyboardIcon = ({ size }) => (
  <Svg size={size}>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M6.5 10h1M10.5 10h1M14.5 10h1M8 14h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const HomeIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M3 11 12 4l9 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </Svg>
);
