import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import { LoadingState } from '../../components/Loader.jsx';
import '../../styles/admin.css';

const formatNumber = (n) => {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const StatTile = ({ label, value, accent }) => (
  <div className="oh-stat-tile">
    <div className="oh-stat-value" style={accent ? { color: accent } : undefined}>
      {formatNumber(value)}
    </div>
    <div className="oh-stat-label">{label}</div>
  </div>
);

const StatSection = ({ title, children }) => (
  <div className="oh-stat-section">
    <div className="oh-section-label">{title}</div>
    <div className="oh-stat-grid">{children}</div>
  </div>
);

const Dashboard = () => {
  const currentUser = useSelector((s) => s.auth.user);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api
      .get('/dashboard/stats')
      .then((res) => {
        if (!cancelled) {
          setStats(res.data);
          setStatus('succeeded');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('failed');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="oh-admin-header">
        <div>
          <h1 className="oh-admin-title">Dashboard</h1>
          <p className="oh-admin-subtitle">
            {currentUser?.isSuperAdmin ? 'Super-admin overview' : 'Admin overview'}
          </p>
        </div>
      </div>

      {status === 'loading' && <LoadingState label="Loading stats…" />}
      {status === 'failed' && <div className="oh-empty-state">Could not load dashboard stats.</div>}

      {stats && (
        <>
          <StatSection title="Users">
            <StatTile label="Total users" value={stats.users.total} />
            <StatTile label="Active" value={stats.users.active} accent="var(--oh-forest)" />
            <StatTile label="Blocked" value={stats.users.blocked} accent="var(--oh-red)" />
            {Object.entries(stats.users.byType).map(([type, count]) => (
              <StatTile key={type} label={capitalize(type)} value={count} />
            ))}
          </StatSection>

          {stats.admins && (
            <StatSection title="Admins">
              <StatTile label="Total admins" value={stats.admins.total} />
              <StatTile label="Super-admins" value={stats.admins.superAdmins} accent="var(--oh-purple)" />
              <StatTile label="Regular admins" value={stats.admins.regular} />
            </StatSection>
          )}

          <StatSection title="Image stock">
            <StatTile label="Folders" value={stats.imageStock.folders} />
            <StatTile label="Total images" value={stats.imageStock.images} />
            <StatTile label="Available" value={stats.imageStock.availableImages} accent="var(--oh-forest)" />
            <StatTile label="Blocked" value={stats.imageStock.blockedImages} accent="var(--oh-red)" />
          </StatSection>

          <StatSection title="QR stickers">
            <StatTile label="Batches generated" value={stats.qrStickers.batches} />
            <StatTile label="QR codes generated" value={stats.qrStickers.codes} />
          </StatSection>
        </>
      )}
    </div>
  );
};

export default Dashboard;
