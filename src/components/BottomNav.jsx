import { NavLink } from 'react-router-dom';
import '../styles/app-shell.css';

const icons = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 11 12 4l9 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  scan: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  history: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  images: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 16.5l4.5-4.5 3 3 2-2L20 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  qr: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="6" height="6" fill="currentColor" />
      <rect x="14.5" y="3.5" width="6" height="6" fill="currentColor" />
      <rect x="3.5" y="14.5" width="6" height="6" fill="currentColor" />
      <rect x="15" y="15" width="2" height="2" fill="currentColor" />
      <rect x="19" y="15" width="2" height="2" fill="currentColor" />
      <rect x="15" y="19" width="2" height="2" fill="currentColor" />
      <rect x="19" y="19" width="2" height="2" fill="currentColor" />
    </svg>
  ),
};

const items = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/scan', label: 'Scan', icon: 'scan' },
  { to: '/home?tab=history', label: 'History', icon: 'history', disabled: true },
  { to: '/images', label: 'Images', icon: 'images' },
  { to: '/qr-stickers', label: 'QR', icon: 'qr' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
];

const BottomNav = () => (
  <nav className="oh-bottom-nav">
    {items.map((item) => (
      <NavLink
        key={item.label}
        to={item.disabled ? '#' : item.to}
        onClick={(e) => item.disabled && e.preventDefault()}
        className={({ isActive }) => `oh-nav-item ${isActive && !item.disabled ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
      >
        {icons[item.icon]}
        <span>{item.label}</span>
      </NavLink>
    ))}
  </nav>
);

export default BottomNav;
