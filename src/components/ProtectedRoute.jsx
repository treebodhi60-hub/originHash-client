import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { token, user } = useSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  if (!adminOnly && user.isAdmin) {
    return <Navigate to="/admin/users" replace />;
  }

  return children;
};

export default ProtectedRoute;
