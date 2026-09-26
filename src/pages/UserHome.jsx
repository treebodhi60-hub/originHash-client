import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import BrandLogo from '../components/BrandLogo.jsx';
import { BoxIcon, CheckIcon, ChevronRightIcon, CrossIcon, QrIcon, ShieldIcon, UndoIcon } from '../components/ScanIcons.jsx';
import { formatScanTime } from '../utils/format';
import '../styles/app-shell.css';
import '../styles/home.css';

const RECORDED = { label: 'Recorded', tone: 'neutral', icon: <BoxIcon size={16} /> };
const AUTHENTIC = { label: 'Authentic', tone: 'success', icon: <CheckIcon size={16} /> };
const FAILED = { label: 'Failed', tone: 'danger', icon: <CrossIcon size={16} /> };
const NOT_VERIFIED = { label: 'Not verified', tone: 'muted', icon: <UndoIcon size={16} /> };

const STATUS = {
  SCANNED: RECORDED,
  MATCHED: AUTHENTIC,
  AUTHENTIC,
  UNMATCHED: FAILED,
  NOT_FOUND: FAILED,
  INVALID: FAILED,
  ALREADY_VIEWED: FAILED,
  ROLLED_BACK: NOT_VERIFIED,
  PENDING: NOT_VERIFIED,
};

const StatTile = ({ label, value, tone = 'plain' }) => (
  <div className={`oh-home-stat ${tone}`}>
    <div className="oh-home-stat-label">{label}</div>
    <div className="oh-home-stat-value">{value == null ? '—' : value.toLocaleString('en-IN')}</div>
  </div>
);

const UserHome = () => {
  const { user } = useSelector((state) => state.auth);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/scans/summary')
      .then(({ data }) => {
        if (cancelled) return;
        setSummary(data);
        setStatus('succeeded');
      })
      .catch(() => {
        if (!cancelled) setStatus('failed');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = summary?.totals;
  const recent = summary?.recent || [];

  return (
    <div className="oh-home">
      <section className="oh-home-hero">
        <div className="oh-home-hero-top">
          <div>
            <div className="oh-home-hero-greeting">Welcome back</div>
            <h1 className="oh-home-hero-name">{user?.name || 'there'}</h1>
          </div>
          <span className="oh-home-hero-logo" title="OriginHash">
            <BrandLogo size={22} />
          </span>
        </div>
        <p className="oh-home-hero-sub">Scan a product's QR to check it's genuine before you trust it.</p>
        <Link to="/scan" className="oh-home-verify-btn">
          <ShieldIcon size={18} />
          Verify authenticity
        </Link>
      </section>

      <section className="oh-home-stats" aria-label="Your scan summary">
        <StatTile label="Total verifications" value={totals?.verifications} />
        <StatTile label="Scanned" value={totals?.scanned} />
        <StatTile label="Succeeded" value={totals?.succeeded} tone="success" />
        <StatTile label="Failed" value={totals?.failed} tone="danger" />
      </section>

      <Link to="/scan" className="oh-home-scan-card">
        <span className="oh-home-scan-icon">
          <QrIcon size={22} />
        </span>
        <span className="oh-home-scan-text">
          <span className="oh-home-scan-title">Scan QR code</span>
          <span className="oh-home-scan-sub">Point your camera at the product QR</span>
        </span>
        <span className="oh-home-scan-chevron">
          <ChevronRightIcon size={18} />
        </span>
        <span className="oh-home-scan-cta">
          Open scanner
          <ChevronRightIcon size={16} />
        </span>
      </Link>

      <section className="oh-home-recent">
        <div className="oh-home-recent-head">
          <h2 className="oh-home-recent-title">Recent verifications</h2>
        </div>

        {status === 'loading' && <div className="oh-home-recent-empty">Loading your scans…</div>}
        {status === 'failed' && (
          <div className="oh-home-recent-empty">Couldn't load your scans right now. Please try again later.</div>
        )}
        {status === 'succeeded' && recent.length === 0 && (
          <div className="oh-home-recent-empty">No scans yet. Scan a product and it will show up here.</div>
        )}

        {recent.length > 0 && (
          <ul className="oh-home-recent-list">
            {recent.map((scan) => {
              const s = STATUS[scan.result] || NOT_VERIFIED;
              return (
                <li key={scan.id} className="oh-home-recent-row">
                  <span className={`oh-home-recent-icon ${s.tone}`}>{s.icon}</span>
                  <div className="oh-home-recent-text">
                    <div className="oh-home-recent-name">
                      {scan.productName
                        ? `${scan.productName}${scan.variantSize ? ` ${scan.variantSize}` : ''}`
                        : 'Unknown QR code'}
                    </div>
                    <div className="oh-home-recent-meta">
                      {formatScanTime(scan.createdAt)}
                      {scan.code && ` · ${scan.code}`}
                    </div>
                  </div>
                  <span className={`oh-home-recent-status ${s.tone}`}>{s.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default UserHome;
