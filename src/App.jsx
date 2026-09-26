import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchMe } from "./store/authSlice";
import Login from "./pages/Login.jsx";
import OtpVerify from "./pages/OtpVerify.jsx";
import Verify from "./pages/Verify.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Profile from "./pages/Profile.jsx";
import UserHome from "./pages/UserHome.jsx";
import Scan from "./pages/Scan.jsx";
import ScanResult from "./pages/ScanResult.jsx";
import ScanCompare from "./pages/ScanCompare.jsx";
import History from "./pages/History.jsx";
import ScanDetails from "./pages/ScanDetails.jsx";
import UserLayout from "./pages/UserLayout.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import UsersList from "./pages/admin/UsersList.jsx";
import ImageStock from "./pages/admin/ImageStock.jsx";
import QrStickers from "./pages/admin/QrStickers.jsx";
import AdminProfile from "./pages/admin/AdminProfile.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) dispatch(fetchMe());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          token && user ? (
            <Navigate to={user.isAdmin ? "/admin/users" : "/home"} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route path="/verify-otp" element={<OtpVerify />} />
      <Route path="/verify/:code" element={<Verify />} />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<UserHome />} />
        {/* The Scan tab opens the same dashboard as Home; its buttons open the camera. */}
        <Route path="/scan" element={<UserHome />} />
        <Route path="/scan/camera" element={<Scan />} />
        <Route path="/scan/compare" element={<ScanCompare />} />
        <Route path="/scan/result" element={<ScanResult />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<ScanDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/images" element={<ImageStock />} />
        <Route path="/qr-stickers" element={<QrStickers />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UsersList />} />
        <Route path="admins" element={<Navigate to="/admin/users" replace />} />
        <Route path="images" element={<ImageStock />} />
        <Route path="qr-stickers" element={<QrStickers />} />
        <Route path="scan" element={<Scan />} />
        <Route path="scan/compare" element={<ScanCompare />} />
        <Route path="scan/result" element={<ScanResult />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route index element={<Navigate to="users" replace />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={token ? "/home" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;
