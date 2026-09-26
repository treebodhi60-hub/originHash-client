import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import BrandLogo from './BrandLogo.jsx';
import '../styles/mobile-menu.css';

// Phones only (laptops show every page in the sidebar): the ☰ button that opens MenuDrawer.
export const MenuButton = ({ onClick, className = '' }) => (
  <button
    type="button"
    className={`oh-menu-btn ${className}`}
    onClick={onClick}
    aria-label="Open menu"
    aria-haspopup="dialog"
    aria-controls="oh-menu-drawer"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </button>
);

// Slide-in menu with the pages that don't fit in the phone bottom bar, plus Log out.
// `items` are { to, label, icon }. The layout closes it on navigation.
export const MenuDrawer = ({ open, onClose, items, onLogout }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    panelRef.current?.querySelector('a, button')?.focus();

    // Escape closes; Tab stays inside the drawer.
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll('a, button')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="oh-menu-layer">
      <div className="oh-menu-backdrop" onClick={onClose} />
      <div id="oh-menu-drawer" ref={panelRef} className="oh-menu-drawer" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="oh-menu-head">
          <span className="oh-menu-logo">
            <BrandLogo size={16} />
          </span>
          <span className="oh-menu-brand">OriginHash</span>
          <button type="button" className="oh-menu-close" onClick={onClose} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="oh-menu-list" aria-label="More pages">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `oh-menu-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="oh-menu-item oh-menu-logout" onClick={onLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
};
