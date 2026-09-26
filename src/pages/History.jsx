import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { CheckIcon, CrossIcon, PinIcon, UndoIcon } from '../components/ScanIcons.jsx';
import { formatCoords, formatShortDate } from '../utils/format';
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = FILTERS.some(([key]) => key === searchParams.get('filter')) ? searchParams.get('filter') : 'all';

  const [scans, setScans] = useState([]);
  const [hasMore, setHasMore] = useState(false);
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

  return (
    <div className="oh-history-page">
      <div className="oh-result-shell">
        <header className="oh-result-head oh-history-head">
          <span className="oh-scan-icon-spacer" />
          <h1 className="oh-result-title">Verification history</h1>
          <span className="oh-scan-icon-spacer" />
        </header>

        <div className="oh-result-body oh-history-body">
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

          {status === 'loading' && <div className="oh-history-empty">Loading your scans…</div>}
          {status === 'failed' && <div className="oh-history-empty">Couldn't load your scans. Please try again later.</div>}
          {status === 'ready' && scans.length === 0 && (
            <div className="oh-history-empty">
              {filter === 'all' ? 'No scans yet. Scan a product and it will show up here.' : 'No scans match this filter yet.'}
            </div>
          )}

          <ul className="oh-history-list">
            {scans.map((scan) => {
              const s = HISTORY_STATUS[scan.result] || NOT_VERIFIED;
              return (
                <li key={scan.id} className="oh-history-card">
                  <span className={`oh-history-icon ${s.tone}`}>{s.icon}</span>
                  <div className="oh-history-text">
                    <div className="oh-history-name">
                      {scan.productName
                        ? `${scan.productName}${scan.variantSize ? ` ${scan.variantSize}` : ''}`
                        : scan.code || 'Unknown QR code'}
                    </div>
                    {scan.producer && <div className="oh-history-producer">{scan.producer}</div>}
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
                    <button type="button" className="oh-history-view" onClick={() => navigate(`/history/${scan.id}`)}>
                      View
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

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
