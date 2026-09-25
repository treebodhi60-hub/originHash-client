import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BrandLogo from '../components/BrandLogo.jsx';
import { BoxIcon, CheckIcon, ChevronRightIcon, CrossIcon, QrIcon, ShieldIcon } from '../components/ScanIcons.jsx';
import { formatScanTime, readScanHistory } from '../utils/scanHistory';
import '../styles/app-shell.css';
import '../styles/home.css';

const RECENT_LIMIT = 5;

const statusOf = (entry) => {
  if (!entry.ok) return { label: 'Failed', tone: 'danger', icon: <CrossIcon size={16} /> };
  if (entry.mode === 'record') return { label: 'Recorded', tone: 'neutral', icon: <BoxIcon size={16} /> };
  return { label: 'Authentic', tone: 'success', icon: <CheckIcon size={16} /> };
};

const StatTile = ({ label, value, tone = 'plain' }) => (
  <div className={`oh-home-stat ${tone}`}>
    <div className="oh-home-stat-label">{label}</div>
    <div className="oh-home-stat-value">{value.toLocaleString('en-IN')}</div>
  </div>
);

const UserHome = () => {
  const { user } = useSelector((state) => state.auth);
  const { totals, recent } = useMemo(() => readScanHistory(user?.id), [user?.id]);

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
        <Link to="/scan?mode=verify" className="oh-home-verify-btn">
          <ShieldIcon size={18} />
          Verify authenticity
        </Link>
      </section>

      <section className="oh-home-stats" aria-label="Your scan summary">
        <StatTile label="Total verifications" value={totals.verifications} />
        <StatTile label="Scanned" value={totals.scanned} />
        <StatTile label="Succeeded" value={totals.succeeded} tone="success" />
        <StatTile label="Failed" value={totals.failed} tone="danger" />
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

        {recent.length === 0 ? (
          <div className="oh-home-recent-empty">
            No scans yet. Verify a product and it will show up here.
          </div>
        ) : (
          <ul className="oh-home-recent-list">
            {recent.slice(0, RECENT_LIMIT).map((entry) => {
              const status = statusOf(entry);
              return (
                <li key={entry.id} className="oh-home-recent-row">
                  <span className={`oh-home-recent-icon ${status.tone}`}>{status.icon}</span>
                  <div className="oh-home-recent-text">
                    <div className="oh-home-recent-name">
                      {entry.productName
                        ? `${entry.productName}${entry.variantSize ? ` ${entry.variantSize}` : ''}`
                        : 'Unknown QR code'}
                    </div>
                    <div className="oh-home-recent-meta">
                      {formatScanTime(entry.scannedAt)}
                      {entry.code && ` · ${entry.code}`}
                    </div>
                  </div>
                  <span className={`oh-home-recent-status ${status.tone}`}>{status.label}</span>
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
