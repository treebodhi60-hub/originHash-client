import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { CheckIcon, CrossIcon, PinIcon, UndoIcon } from '../components/ScanIcons.jsx';
import { formatCoords, formatDateTimeShort, formatShortDate } from '../utils/format';
import { scanRoutes } from '../utils/scanRoutes';
import '../styles/app-shell.css';
import '../styles/scan.css';
import '../styles/history.css';

const FILTERS = [
  ['all', 'All'],
  ['verified', 'Verified'],
  ['failed', 'Failed'],
  ['scanned', 'Scanned'],
];

const VERIFIED = { label: 'Verified', tone: 'success', icon: <CheckIcon size={18} /> };
const FAILED = { label: 'Failed', tone: 'danger', icon: <CrossIcon size={18} /> };
const SCANNED = { label: 'Scanned', tone: 'info', icon: <PinIcon size={18} /> };
const NOT_VERIFIED = { label: 'Not verified', tone: 'muted', icon: <UndoIcon size={18} /> };

export const HISTORY_STATUS = {
  MATCHED: VERIFIED,
  AUTHENTIC: VERIFIED,
  SCANNED,
  UNMATCHED: FAILED,
  NOT_FOUND: FAILED,
  INVALID: FAILED,
  ALREADY_VIEWED: FAILED,
  ROLLED_BACK: NOT_VERIFIED,
  PENDING: NOT_VERIFIED,
};

// "Verification history": every scan the user has made, newest first, filterable.
// The filter lives in the URL so coming back from a scan's details keeps it.
const History = () => {
  const { user } = useSelector((state) => state.auth);
  const paths = scanRoutes(user);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = FILTERS.some(([key]) => key === searchParams.get('filter')) ? searchParams.get('filter') : 'all';

  const [scans, setScans] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [scope, setScope] = useState('own'); // 'all' for admins
  const [status, setStatus] = useState('loading'); // loading | ready | failed
  const [loadingMore, setLoadingMore] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const request = ++requestRef.current;
    setStatus('loading');
    setScans([]);
    api
      .get('/scans', { params: { filter } })
      .then(({ data }) => {
        if (request !== requestRef.current) return;
        setScans(data.scans);
        setHasMore(data.hasMore);
        setScope(data.scope);
        setStatus('ready');
      })
      .catch(() => {
        if (request === requestRef.current) setStatus('failed');
      });
  }, [filter]);

  const loadMore = async () => {
    const request = requestRef.current;
    setLoadingMore(true);
    try {
      const { data } = await api.get('/scans', { params: { filter, before: scans[scans.length - 1].id } });
      if (request !== requestRef.current) return;
      setScans((current) => [...current, ...data.scans]);
      setHasMore(data.hasMore);
    } catch {
      // Leave the button in place so the user can try again.
    } finally {
      if (request === requestRef.current) setLoadingMore(false);
    }
  };

  const setFilter = (key) => setSearchParams(key === 'all' ? {} : { filter: key }, { replace: true });

  const openScan = (id) => navigate(`${paths.history}/${id}`);
  const productLabel = (scan) =>
    scan.productName ? `${scan.productName}${scan.variantSize ? ` ${scan.variantSize}` : ''}` : scan.code || 'Unknown QR code';
  const scannerLabel = (scan) => (scan.scannedBy?.isYou ? 'You' : scan.scannedBy?.name || 'Unnamed user');

  const filterChips = (
    <div className="oh-history-filters" role="group" aria-label="Filter scans">
      {FILTERS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={`oh-history-chip ${filter === key ? 'active' : ''}`}
          aria-pressed={filter === key}
          onClick={() => setFilter(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="oh-history-page">
      {/* Laptop: a standard page header with the filters alongside. */}
      <div className="oh-history-desk-head oh-only-desktop">
        <div>
          <h1 className="oh-admin-title">Verification history</h1>
          <p className="oh-admin-subtitle">{scope === 'all' ? 'Scans by all users' : 'Your scans'}</p>
        </div>
        {filterChips}
      </div>

      <div className="oh-result-shell oh-history-shell">
        <header className="oh-result-head oh-history-head">
          <span className="oh-scan-icon-spacer" />
          <h1 className="oh-result-title">Verification history</h1>
          <span className="oh-scan-icon-spacer" />
        </header>

        <div className="oh-result-body oh-history-body">
          <div className="oh-only-mobile">
            {scope === 'all' && <p className="oh-history-scope">Showing scans by all users</p>}
            {filterChips}
          </div>

          <div className="oh-history-panel">
            {status === 'loading' && <div className="oh-history-empty">Loading your scans…</div>}
            {status === 'failed' && <div className="oh-history-empty">Couldn't load your scans. Please try again later.</div>}
            {status === 'ready' && scans.length === 0 && (
              <div className="oh-history-empty">
                {filter === 'all' ? 'No scans yet. Scan a product and it will show up here.' : 'No scans match this filter yet.'}
              </div>
            )}

            {scans.length > 0 && (
              <>
                {/* Phone: cards. */}
                <ul className="oh-history-list oh-only-mobile">
                  {scans.map((scan) => {
                    const s = HISTORY_STATUS[scan.result] || NOT_VERIFIED;
                    return (
                      <li key={scan.id} className="oh-history-card">
                        <span className={`oh-history-icon ${s.tone}`}>{s.icon}</span>
                        <div className="oh-history-text">
                          <div className="oh-history-name">{productLabel(scan)}</div>
                          {scan.producer && <div className="oh-history-producer">{scan.producer}</div>}
                          {scope === 'all' && scan.scannedBy && (
                            <div className="oh-history-by">
                              by {scan.scannedBy.isYou ? 'you' : scan.scannedBy.name || 'an unnamed user'}
                            </div>
                          )}
                          <div className="oh-history-meta">
                            {scan.location && (
                              <span className="oh-history-loc">
                                <PinIcon size={12} />
                                {formatCoords(scan.location)} ·
                              </span>
                            )}
                            <span>{formatShortDate(scan.createdAt)}</span>
                          </div>
                        </div>
                        <div className="oh-history-side">
                          <span className={`oh-history-status ${s.tone}`}>{s.label}</span>
                          <button type="button" className="oh-history-view" onClick={() => openScan(scan.id)}>
                            View
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Laptop: a table, one scan per row; the whole row opens the scan. */}
                <div className="oh-only-desktop">
                  <table className="oh-history-table">
                    <thead>
                      <tr>
                        <th scope="col">Status</th>
                        <th scope="col">Product</th>
                        <th scope="col">Producer</th>
                        {scope === 'all' && <th scope="col">Scanned by</th>}
                        <th scope="col">Location</th>
                        <th scope="col">Date &amp; time</th>
                        <th scope="col" aria-label="Open" />
                      </tr>
                    </thead>
                    <tbody>
                      {scans.map((scan) => {
                        const s = HISTORY_STATUS[scan.result] || NOT_VERIFIED;
                        return (
                          <tr key={scan.id} onClick={() => openScan(scan.id)}>
                            <td>
                              <span className={`oh-history-status-cell ${s.tone}`}>
                                <span className={`oh-history-icon ${s.tone}`}>{s.icon}</span>
                                {s.label}
                              </span>
                            </td>
                            <td>
                              <div className="oh-history-cell-main">{productLabel(scan)}</div>
                              {scan.productName && scan.code && <div className="oh-history-cell-code">{scan.code}</div>}
                            </td>
                            <td>{scan.producer || <span className="oh-history-cell-none">—</span>}</td>
                            {scope === 'all' && <td>{scannerLabel(scan)}</td>}
                            <td>
                              {scan.location ? (
                                <>
                                  {scan.location.name && <div className="oh-history-cell-main">{scan.location.name}</div>}
                                  <div className={scan.location.name ? 'oh-history-cell-sub' : undefined}>
                                    {formatCoords(scan.location)}
                                  </div>
                                </>
                              ) : (
                                <span className="oh-history-cell-none">Not shared</span>
                              )}
                            </td>
                            <td className="oh-history-cell-date">{formatDateTimeShort(scan.createdAt)}</td>
                            <td className="oh-history-cell-action">
                              <button
                                type="button"
                                className="oh-history-view"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openScan(scan.id);
                                }}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {hasMore && (
            <button type="button" className="oh-history-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
