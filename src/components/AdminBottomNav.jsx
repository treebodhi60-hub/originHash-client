import { NavLink } from 'react-router-dom';
import '../styles/app-shell.css';

const icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20c1-3.5 3.8-5.5 6-5.5s5 2 6 5.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.5 14.7c2 .3 3.7 1.8 4.5 5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  images: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 16.5l4.5-4.5 3 3 2-2L20 17" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2.1 1.2l-2.3-.9-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.3-.9a7 7 0 0 0 2.1 1.2L10 21h4l.5-2.5a7 7 0 0 0 2.1-1.2l2.3.9 2-3.4-2-1.6c.07-.4.1-.8.1-1.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  ),
};

const items = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/images', label: 'Images', icon: 'images' },
  { to: '/admin/qr-stickers', label: 'QR', icon: 'qr' },
  { to: '/admin/profile', label: 'Profile', icon: 'profile' },
];

const AdminBottomNav = () => (
  <nav className="oh-bottom-nav">
    {items.map((item) => (
      <NavLink
        key={item.label}
        to={item.to}
        className={({ isActive }) => `oh-nav-item ${isActive ? 'active' : ''}`}
      >
        {icons[item.icon]}
        <span>{item.label}</span>
      </NavLink>
    ))}
  </nav>
);

export default AdminBottomNav;
