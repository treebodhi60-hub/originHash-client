import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

// User pages that also exist inside the admin panel, so an admin opening the user link lands on the admin copy.
const ADMIN_EQUIVALENTS = { '/scan': '/admin/scan', '/scan/camera': '/admin/scan', '/scan/result': '/admin/scan/result' };

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
    const adminPath = ADMIN_EQUIVALENTS[location.pathname];
    return <Navigate to={adminPath ? adminPath + location.search : '/admin/users'} replace />;
  }

  return children;
};

export default ProtectedRoute;
