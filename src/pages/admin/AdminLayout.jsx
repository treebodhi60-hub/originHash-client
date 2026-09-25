import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AdminBottomNav from '../../components/AdminBottomNav.jsx';
import { logout } from '../../store/authSlice';
import '../../styles/admin.css';
import '../../styles/app-shell.css';

const SidebarIcon = ({ children }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    {children}
  </svg>
);

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // The scanner shows the OriginHash logo itself, so the phone top bar would double it up.
  const showMobileTopbar = pathname !== '/admin/scan';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <div className="oh-admin-shell">
      <aside className="oh-sidebar">
        <div className="oh-sidebar-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2c-2.2 0-4 1.8-4 4v1H7a1 1 0 0 0 0 2h1v2H7a1 1 0 0 0 0 2h1v1c0 2.2 1.8 4 4 4s4-1.8 4-4v-1h1a1 1 0 1 0 0-2h-1V9h1a1 1 0 1 0 0-2h-1V6c0-2.2-1.8-4-4-4Z"
              fill="var(--oh-gold)"
            />
          </svg>
        </div>

        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => `oh-sidebar-item ${isActive ? 'active' : ''}`}
          title="Dashboard"
        >
          <SidebarIcon>
            <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="1.6" />
          </SidebarIcon>
        </NavLink>

        <NavLink
          to="/admin/scan"
          className={({ isActive }) => `oh-sidebar-item ${isActive ? 'active' : ''}`}
          title="Scan QR code"
        >
          <SidebarIcon>
            <path
              d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path d="M4 12h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </SidebarIcon>
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) => `oh-sidebar-item ${isActive ? 'active' : ''}`}
          title="Users"
        >
          <SidebarIcon>
            <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3 20c1-3.5 3.8-5.5 6-5.5s5 2 6 5.5" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="17" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.4" />
            <path d="M15.5 14.7c2 .3 3.7 1.8 4.5 5" stroke="currentColor" strokeWidth="1.4" />
          </SidebarIcon>
        </NavLink>

        <NavLink
          to="/admin/images"
          className={({ isActive }) => `oh-sidebar-item ${isActive ? 'active' : ''}`}
          title="Image stock"
        >
          <SidebarIcon>
            <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="9" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M5 16.5l4.5-4.5 3 3 2-2L20 17" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </SidebarIcon>
        </NavLink>

        <NavLink
          to="/admin/qr-stickers"
          className={({ isActive }) => `oh-sidebar-item ${isActive ? 'active' : ''}`}
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

        <span className="oh-sidebar-item disabled" title="Coming soon">
          <SidebarIcon>
            <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.6" />
          </SidebarIcon>
        </span>

        <div className="oh-sidebar-bottom">
          <NavLink
            to="/admin/profile"
            className={({ isActive }) => `oh-sidebar-item ${isActive ? 'active' : ''}`}
            title="Settings / Profile"
          >
            <SidebarIcon>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2.1 1.2l-2.3-.9-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.3-.9a7 7 0 0 0 2.1 1.2L10 21h4l.5-2.5a7 7 0 0 0 2.1-1.2l2.3.9 2-3.4-2-1.6c.07-.4.1-.8.1-1.2Z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </SidebarIcon>
          </NavLink>
        </div>
      </aside>

      <div className="oh-user-content-col">
        {showMobileTopbar && (
        <header className="oh-mobile-topbar">
          <div className="oh-mobile-topbar-brand">
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

        <main className="oh-admin-main">
          <Outlet />
        </main>
      </div>

      <AdminBottomNav />
    </div>
  );
};

export default AdminLayout;
