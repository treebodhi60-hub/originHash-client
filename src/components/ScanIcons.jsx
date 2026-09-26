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

export const EyeIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
  </Svg>
);

export const WarningIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M12 4 2.8 19.5h18.4L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M12 10v4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="17" r="1.1" fill="currentColor" />
  </Svg>
);

export const UndoIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M9 7 4.5 11.5 9 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 11.5h9a5 5 0 0 1 0 10h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const CameraIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.4-2h5.6l1.4 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.8" />
  </Svg>
);

export const FlagIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M5.5 21V4.5M5.5 5h11l-2 4 2 4h-11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const PinIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
  </Svg>
);

export const UserIcon = ({ size }) => (
  <Svg size={size}>
    <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4.5 20c1.3-3.6 4.3-5.5 7.5-5.5s6.2 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const ShareIcon = ({ size }) => (
  <Svg size={size}>
    <circle cx="17.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="6.5" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="17.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="m8.7 10.8 6.6-4M8.7 13.2l6.6 4" stroke="currentColor" strokeWidth="1.8" />
  </Svg>
);

export const MapIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M3.5 6.5 9 4l6 2.5 5.5-2.5v13.5L15 20l-6-2.5-5.5 2.5V6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 4v13.5M15 6.5V20" stroke="currentColor" strokeWidth="1.8" />
  </Svg>
);
