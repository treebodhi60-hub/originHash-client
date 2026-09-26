// Where the scan screens live. Everyone gets the same screens; admins get them inside the
// admin panel (under /admin) so they keep the admin sidebar and nav.
//   hub     the dashboard the Scan tab opens (Verify authenticity / Scan QR code / recent scans)
//   camera  the scanner
//   home    where "Done, go home" and "Not now, go back" lead
export const scanRoutes = (user) => {
  const base = user?.isAdmin ? '/admin' : '';
  return {
    hub: `${base}/scan`,
    camera: `${base}/scan/camera`,
    compare: `${base}/scan/compare`,
    result: `${base}/scan/result`,
    history: `${base}/history`,
    journey: `${base}/journey`,
    home: user?.isAdmin ? '/admin/scan' : '/home',
  };
};
