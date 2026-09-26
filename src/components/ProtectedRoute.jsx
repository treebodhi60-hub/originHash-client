import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

// User pages that also exist inside the admin panel (at /admin + the same path), so an admin
// opening the user link lands on the admin copy.
const SHARED_WITH_ADMIN = ['/scan', '/history', '/journey'];
const isShared = (pathname) => SHARED_WITH_ADMIN.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { token, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (!adminOnly && user.isAdmin) {
    const target = isShared(location.pathname) ? `/admin${location.pathname}${location.search}` : '/admin/users';
    return <Navigate to={target} replace />;
  }

  return children;
};

export default ProtectedRoute;
