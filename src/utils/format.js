export const formatScanTime = (iso) => {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round((startOf(new Date()) - startOf(date)) / 86_400_000);

  if (daysAgo === 0) return `Today, ${time}`;
  if (daysAgo === 1) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${time}`;
};

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (iso) =>
  new Date(iso)
    .toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    .replace(',', '');

export const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatCoords = ({ latitude, longitude }) => `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

// DD/MM/YY, HH:MM — used on the scan details screens.
export const formatDateTimeShort = (iso) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
};

export const formatDateShort = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });

// "Shamshabad, Telangana (17.31210, 78.40915)", or just the coordinates when no name is known yet.
export const formatPlace = (location) =>
  location.name ? `${location.name} (${formatCoords(location)})` : formatCoords(location);
