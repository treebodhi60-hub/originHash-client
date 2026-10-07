// Line icons for the admin dashboard — 24px grid, 1.7 stroke, round caps, drawn in currentColor
// so each one takes the colour of the chip or text it sits in.
const Svg = ({ size = 20, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const UsersIcon = ({ size }) => (
  <Svg size={size}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19.5c.8-3.3 3.3-5.3 6-5.3s5.2 2 6 5.3" />
    <path d="M15.5 4.9a3.1 3.1 0 0 1 0 6.1M17.6 14.4c1.7.6 2.9 2.3 3.4 5.1" />
  </Svg>
);

export const UserIcon = ({ size }) => (
  <Svg size={size}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c1-3.6 3.8-5.6 7-5.6s6 2 7 5.6" />
  </Svg>
);

export const QrIcon = ({ size }) => (
  <Svg size={size}>
    <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.4" />
    <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.4" />
    <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.4" />
    <path d="M14 14h2.6v2.6M20.5 14v.01M14 20.5h2.6M20.5 18v2.5h-1.4" />
  </Svg>
);

export const ScanIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M7 12h10" />
  </Svg>
);

export const ImageIcon = ({ size }) => (
  <Svg size={size}>
    <rect x="3.5" y="4" width="17" height="16" rx="3" />
    <circle cx="9" cy="9.5" r="1.7" />
    <path d="m4.5 17 4.6-4.6 3.2 3.2 2.2-2.2 5 5" />
  </Svg>
);

export const FolderIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2h7.4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9Z" />
  </Svg>
);

export const LayersIcon = ({ size }) => (
  <Svg size={size}>
    <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8 12 3.5Z" />
    <path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" />
  </Svg>
);

export const ShieldCheckIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Svg>
);

export const CrownIcon = ({ size }) => (
  <Svg size={size}>
    <path d="m4 8 4 3.5L12 5l4 6.5L20 8l-1.6 9.5H5.6L4 8Z" />
    <path d="M6 20.5h12" />
  </Svg>
);

export const ActivityIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M3 12h3.5l2.5-6 4 12 2.5-6H21" />
  </Svg>
);

export const CheckCircleIcon = ({ size }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.2 2.4 2.4 4.6-4.8" />
  </Svg>
);

export const XCircleIcon = ({ size }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" />
  </Svg>
);

export const AlertIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M10.3 4.3 2.9 17.2A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9.5v4M12 16.8v.01" />
  </Svg>
);

export const ClockIcon = ({ size }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const BanIcon = ({ size }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 6 12 12" />
  </Svg>
);

export const LeafIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M5 19c0-8 5-13.5 14-14 .3 9-5.2 14-13 14" />
    <path d="M5 19c3-4 6-6.5 9.5-8.5" />
  </Svg>
);

export const FactoryIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M3.5 20.5v-10l5 3v-3l5 3V4.5h4l2.5 16h-16.5Z" />
    <path d="M7.5 17h2M12 17h2" />
  </Svg>
);

export const TruckIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.2v3.3h-7" />
    <circle cx="6.5" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </Svg>
);

export const StoreIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M4 9.5 5.4 4.5h13.2L20 9.5a2.7 2.7 0 0 1-5.3.4 2.7 2.7 0 0 1-5.4 0A2.7 2.7 0 0 1 4 9.5Z" />
    <path d="M5.5 12.5v7.5h13v-7.5M10 20v-4.5h4V20" />
  </Svg>
);

export const ArrowRightIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const TrendUpIcon = ({ size }) => (
  <Svg size={size}>
    <path d="m4 16 5.5-5.5 3.5 3.5L20 7" />
    <path d="M15 7h5v5" />
  </Svg>
);

export const RefreshIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M20 11.5A8 8 0 0 0 5.6 7M4 12.5A8 8 0 0 0 18.4 17" />
    <path d="M5 3.5V7h3.5M19 20.5V17h-3.5" />
  </Svg>
);

export const CalendarIcon = ({ size }) => (
  <Svg size={size}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);
