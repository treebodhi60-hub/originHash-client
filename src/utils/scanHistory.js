// Scan history is kept on this device, per user, until the backend has a scans API.
// Totals are counted separately from `recent` so they stay right after old entries roll off.
const MAX_RECENT = 50;

const storageKey = (userId) => `oh_scans_${userId}`;

const emptyHistory = () => ({
  totals: { scanned: 0, verifications: 0, succeeded: 0, failed: 0 },
  recent: [],
});

export const readScanHistory = (userId) => {
  if (!userId) return emptyHistory();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(userId)));
    if (saved?.totals && Array.isArray(saved.recent)) return saved;
  } catch {
    // Unreadable or blocked storage — start from empty.
  }
  return emptyHistory();
};

// entry: { mode: 'record' | 'verify', ok, code, productName, variantSize }
export const recordScan = (userId, entry) => {
  if (!userId) return;
  const history = readScanHistory(userId);
  const { totals } = history;

  totals.scanned += 1;
  if (entry.mode === 'verify') {
    totals.verifications += 1;
    if (entry.ok) totals.succeeded += 1;
    else totals.failed += 1;
  }

  history.recent = [
    { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, scannedAt: new Date().toISOString() },
    ...history.recent,
  ].slice(0, MAX_RECENT);

  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(history));
  } catch {
    // Storage full or blocked — history is best-effort.
  }
};

export const formatScanTime = (iso) => {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round((startOf(new Date()) - startOf(date)) / 86_400_000);

  if (daysAgo === 0) return `Today, ${time}`;
  if (daysAgo === 1) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${time}`;
};
