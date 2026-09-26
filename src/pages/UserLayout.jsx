import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import BottomNav, { userMenuItems } from "../components/BottomNav.jsx";
import { MenuButton, MenuDrawer } from "../components/MobileMenu.jsx";
import { logout } from "../store/authSlice";
import "../styles/admin.css";
import "../styles/app-shell.css";

const SidebarIcon = ({ children }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    {children}
  </svg>
);

const UserLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Home, the scan screens and History carry their own header (per the mobile design), so skip the phone top bar there.
  const showMobileTopbar =
    pathname !== "/home" && !["/scan", "/history", "/journey"].some((p) => pathname.startsWith(p));

  // Phone ☰ menu. Pages that draw their own header get openMenu through the outlet context.
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useEffect(() => setMenuOpen(false), [pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
  <div className="oh-admin-shell oh-user-shell">
    <aside className="oh-sidebar oh-user-sidebar">
      <div className="oh-sidebar-logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2c-2.2 0-4 1.8-4 4v1H7a1 1 0 0 0 0 2h1v2H7a1 1 0 0 0 0 2h1v1c0 2.2 1.8 4 4 4s4-1.8 4-4v-1h1a1 1 0 1 0 0-2h-1V9h1a1 1 0 1 0 0-2h-1V6c0-2.2-1.8-4-4-4Z"
            fill="var(--oh-gold)"
          />
        </svg>
      </div>

      <NavLink
        to="/home"
        end
        className={({ isActive }) =>
          `oh-sidebar-item ${isActive ? "active" : ""}`
        }
        title="Home"
      >
        <SidebarIcon>
          <path
            d="M3 11 12 4l9 7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </SidebarIcon>
      </NavLink>

      <NavLink
        to="/scan"
        className={({ isActive }) => `oh-sidebar-item ${isActive ? "active" : ""}`}
        title="Scan"
      >
        <SidebarIcon>
          <path
            d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 12h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </SidebarIcon>
      </NavLink>

      <NavLink
        to="/history"
        className={({ isActive }) => `oh-sidebar-item ${isActive ? "active" : ""}`}
        title="History"
      >
        <SidebarIcon>
          <path
            d="M12 8v5l3 2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </SidebarIcon>
      </NavLink>

      <NavLink
        to="/images"
        className={({ isActive }) => `oh-sidebar-item ${isActive ? "active" : ""}`}
        title="Image stock"
      >
        <SidebarIcon>
          <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="9" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 16.5l4.5-4.5 3 3 2-2L20 17" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </SidebarIcon>
      </NavLink>

      <NavLink
        to="/qr-stickers"
        className={({ isActive }) => `oh-sidebar-item ${isActive ? "active" : ""}`}
        title="Generate QR stickers"
      >
        <SidebarIcon>
          <rect x="3.5" y="3.5" width="6" height="6" fill="currentColor" />
          <rect x="14.5" y="3.5" width="6" height="6" fill="currentColor" />
          <rect x="3.5" y="14.5" width="6" height="6" fill="currentColor" />
          <rect x="15" y="15" width="2" height="2" fill="currentColor" />
          <rect x="19" y="15" width="2" height="2" fill="currentColor" />
          <rect x="15" y="19" width="2" height="2" fill="currentColor" />
          <rect x="19" y="19" width="2" height="2" fill="currentColor" />
        </SidebarIcon>
      </NavLink>

      <div className="oh-sidebar-bottom">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `oh-sidebar-item ${isActive ? "active" : ""}`
          }
          title="Profile"
        >
          <SidebarIcon>
            <circle
              cx="12"
              cy="8"
              r="4"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </SidebarIcon>
        </NavLink>
      </div>
    </aside>

    <div className="oh-user-content-col">
      {showMobileTopbar && (
      <header className="oh-mobile-topbar">
        <div className="oh-mobile-topbar-brand">
          <MenuButton onClick={openMenu} />
          <span className="oh-mobile-topbar-logo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2c-2.2 0-4 1.8-4 4v1H7a1 1 0 0 0 0 2h1v2H7a1 1 0 0 0 0 2h1v1c0 2.2 1.8 4 4 4s4-1.8 4-4v-1h1a1 1 0 1 0 0-2h-1V9h1a1 1 0 1 0 0-2h-1V6c0-2.2-1.8-4-4-4Z"
                fill="var(--oh-gold)"
              />
            </svg>
          </span>
          OriginHash
        </div>
        <button
          type="button"
          className="oh-mobile-topbar-logout"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 17l5-5-5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 12H9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>
      )}

      <main className="oh-admin-main oh-user-main">
        <Outlet context={{ openMenu }} />
      </main>
    </div>

    <BottomNav />
    <MenuDrawer open={menuOpen} onClose={closeMenu} items={userMenuItems} onLogout={handleLogout} />
  </div>
  );
};

export default UserLayout;
