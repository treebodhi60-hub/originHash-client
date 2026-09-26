// Where the scan screens live. Admins scan inside the admin panel; everyone else gets the
// dashboard at /scan (the Scan tab) and the camera at /scan/camera.
export const scanRoutes = (user) =>
  user?.isAdmin
    ? { camera: '/admin/scan', compare: '/admin/scan/compare', result: '/admin/scan/result', home: '/admin/users' }
    : { camera: '/scan/camera', compare: '/scan/compare', result: '/scan/result', home: '/home' };
