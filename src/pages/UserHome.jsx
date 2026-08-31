import { useSelector } from 'react-redux';
import BottomNav from '../components/BottomNav.jsx';
import '../styles/app-shell.css';

const UserHome = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="oh-mobile-shell">
      <div className="oh-mobile-content">
        <h1 className="oh-page-title">Hi{user?.name ? `, ${user.name}` : ''} 👋</h1>
        <div className="oh-stub-card">
          Home, Scan and History are part of a later module.
          <br />
          This build covers login and user management only — head to the{' '}
          <strong>Profile</strong> tab to view or edit your details.
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default UserHome;
