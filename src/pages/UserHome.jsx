import { useSelector } from 'react-redux';
import BottomNav from '../components/BottomNav.jsx';
import '../styles/app-shell.css';

const UserHome = () => {
  const { user } = useSelector((state) => state.auth);
  const initial = (user?.name || user?.mobile || '?').charAt(0).toUpperCase();

  return (
    <div className="oh-mobile-shell">
      <div className="oh-mobile-content">
        {/* Laptop view — unchanged */}
        <div className="oh-only-desktop">
          <h1 className="oh-page-title">Hi{user?.name ? `, ${user.name}` : ''} 👋</h1>
          <div className="oh-stub-card">
            Home, Scan and History are part of a later module.
            <br />
            This build covers login and user management only — head to the{' '}
            <strong>Profile</strong> tab to view or edit your details.
          </div>
        </div>

        {/* Phone view */}
        <div className="oh-only-mobile">
          <div className="oh-home-hero">
            <div>
              <div className="oh-home-hero-greeting">Welcome back</div>
              <div className="oh-home-hero-name">{user?.name || 'there'}</div>
            </div>
            <div className="oh-home-hero-avatar">
              {user?.photoUrl ? <img src={user.photoUrl} alt={user.name} /> : initial}
            </div>
          </div>

          <div className="oh-home-section-label">What's next</div>

          <div className="oh-home-feature-card">
            <div className="oh-home-feature-icon">📷</div>
            <div className="oh-home-feature-text">
              <div className="oh-home-feature-title">Scan QR code</div>
              <div className="oh-home-feature-sub">Point your camera at a product QR</div>
            </div>
            <span className="oh-badge consumer">Coming soon</span>
          </div>

          <div className="oh-home-feature-card">
            <div className="oh-home-feature-icon">🕒</div>
            <div className="oh-home-feature-text">
              <div className="oh-home-feature-title">Scan history</div>
              <div className="oh-home-feature-sub">Your past verifications will appear here</div>
            </div>
            <span className="oh-badge consumer">Coming soon</span>
          </div>

          <div className="oh-home-hint-card">
            Head to the <strong>Profile</strong> tab to view or update your details.
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default UserHome;
