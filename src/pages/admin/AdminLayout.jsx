import { NavLink, Outlet } from 'react-router-dom';
import '../../styles/admin.css';

const SidebarIcon = ({ children }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    {children}
  </svg>
);

const AdminLayout = () => (
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

      <span className="oh-sidebar-item disabled" title="Dashboard (coming soon)">
        <SidebarIcon>
          <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="1.6" />
        </SidebarIcon>
      </span>

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

      <span className="oh-sidebar-item disabled" title="Coming soon">
        <SidebarIcon>
          <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
        </SidebarIcon>
      </span>

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

    <main className="oh-admin-main">
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;
