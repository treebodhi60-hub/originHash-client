import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login.jsx';
import OtpVerify from './pages/OtpVerify.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Profile from './pages/Profile.jsx';
import UserHome from './pages/UserHome.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import UsersList from './pages/admin/UsersList.jsx';
import AdminProfile from './pages/admin/AdminProfile.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  const { token, user } = useSelector((state) => state.auth);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          token && user ? (
            <Navigate to={user.isAdmin ? '/admin/users' : '/profile'} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route path="/verify-otp" element={<OtpVerify />} />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <UserHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="users" element={<UsersList />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route index element={<Navigate to="users" replace />} />
      </Route>

      <Route path="*" element={<Navigate to={token ? '/profile' : '/login'} replace />} />
    </Routes>
  );
}

export default App;
