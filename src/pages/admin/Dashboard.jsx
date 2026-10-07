import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import {
  ActivityIcon,
  AlertIcon,
  ArrowRightIcon,
  BanIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CrownIcon,
  FactoryIcon,
  FolderIcon,
  ImageIcon,
  LayersIcon,
  LeafIcon,
  QrIcon,
  RefreshIcon,
  ScanIcon,
  ShieldCheckIcon,
  StoreIcon,
  TrendUpIcon,
  TruckIcon,
  UserIcon,
  UsersIcon,
  XCircleIcon,
} from '../../components/DashboardIcons.jsx';
import '../../styles/admin.css';
import '../../styles/dashboard.css';

// ---------- formatting ----------

const DAY_MS = 24 * 60 * 60 * 1000;
const groupedFormat = new Intl.NumberFormat();
const compactFormat = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

const formatNumber = (n) => {
  if (n == null) return '—';
  return n >= 10_000 ? compactFormat.format(n) : groupedFormat.format(n);
};

const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);
const plural = (n, one, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// "2026-10-07" → a Date at local midnight (not UTC, which would shift the day west of Greenwich).
const parseDay = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const shortDate = (date) => date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

const relativeDay = (iso) => {
  const date = new Date(iso);
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const days = Math.round((startOfToday - new Date(iso).setHours(0, 0, 0, 0)) / DAY_MS);
  if (days <= 0) return `Today, ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return shortDate(date);
};

// 1, 2, 5 × 10ⁿ — so the chart's top gridline is always a round number.
const niceCeil = (n) => {
  if (n <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(n));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= n);
  return step * magnitude;
};

// ---------- reference data ----------

const ROLE_STYLES = {
  farmer: { icon: LeafIcon, tone: 'farmer' },
  producer: { icon: FactoryIcon, tone: 'producer' },
  distributor: { icon: TruckIcon, tone: 'distributor' },
  retailer: { icon: StoreIcon, tone: 'retailer' },
  consumer: { icon: UserIcon, tone: 'consumer' },
};
const ROLE_ORDER = ['farmer', 'producer', 'distributor', 'retailer', 'consumer'];

const OUTCOMES = [
  { key: 'matched', label: 'Matched', hint: 'Image confirmed genuine', icon: CheckCircleIcon, tone: 'good' },
  { key: 'unmatched', label: 'Mismatch', hint: 'Image did not match', icon: XCircleIcon, tone: 'critical' },
  { key: 'flagged', label: 'Flagged code', hint: 'Unknown or already-revealed sticker', icon: AlertIcon, tone: 'warning' },
  { key: 'abandoned', label: 'Not finished', hint: 'Left before answering', icon: ClockIcon, tone: 'neutral' },
];

const QUICK_ACTIONS = [
  { to: '/admin/qr-stickers', label: 'Generate stickers', icon: QrIcon },
  { to: '/admin/scan', label: 'Scan a product', icon: ScanIcon },
  { to: '/admin/images', label: 'Image stock', icon: ImageIcon },
  { to: '/admin/users', label: 'Manage users', icon: UsersIcon },
];

// ---------- building blocks ----------

const Card = ({ icon: Icon, title, subtitle, action, className = '', children }) => (
  <section className={`oh-dash-card ${className}`}>
    <header className="oh-dash-card-head">
      <span className="oh-dash-card-icon">
        <Icon size={18} />
      </span>
      <div className="oh-dash-card-titles">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </header>
    {children}
  </section>
);

const CardLink = ({ to, children }) => (
  <Link to={to} className="oh-dash-card-link">
    {children}
    <ArrowRightIcon size={14} />
  </Link>
);

const WeekDelta = ({ value, noun }) =>
  value == null ? null : value > 0 ? (
    <span className="oh-dash-delta up" title={`${value} new ${noun} in the last 7 days`}>
      <TrendUpIcon size={13} />+{formatNumber(value)} this week
    </span>
  ) : (
    <span className="oh-dash-delta">No new {noun} this week</span>
  );

const Kpi = ({ icon: Icon, tone, label, value, foot, delta, children }) => (
  <article className={`oh-kpi tone-${tone}`}>
    <div className="oh-kpi-top">
      <span className="oh-kpi-icon">
        <Icon size={20} />
      </span>
      <span className="oh-kpi-label">{label}</span>
    </div>
    <div className="oh-kpi-value">{formatNumber(value)}</div>
    {children}
    <div className="oh-kpi-foot">{foot}</div>
    {delta}
  </article>
);

// ---------- sections ----------

const Hero = ({ user, onRefresh, refreshing, loaded }) => {
  const firstName = (user?.name || user?.username || '').trim().split(/\s+/)[0];
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <section className="oh-dash-hero">
      <div className="oh-dash-hero-copy">
        <span className="oh-dash-eyebrow">
          {user?.isSuperAdmin ? <CrownIcon size={14} /> : <ShieldCheckIcon size={14} />}
          {user?.isSuperAdmin ? 'Super-admin' : 'Admin'} dashboard
        </span>
        <h1 className="oh-dash-hero-title">
          {greeting()}
          {firstName && `, ${firstName}`}
        </h1>
        <p className="oh-dash-hero-sub">
          <CalendarIcon size={15} />
          {today}
          <span aria-hidden="true">·</span>
          <button type="button" className="oh-dash-refresh" onClick={onRefresh} disabled={refreshing}>
            <span className={refreshing ? 'spin' : ''}>
              <RefreshIcon size={14} />
            </span>
            {refreshing ? 'Refreshing…' : loaded ? 'Refresh' : 'Loading…'}
          </button>
        </p>
      </div>

      <nav className="oh-dash-actions" aria-label="Quick actions">
        {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="oh-dash-action">
            <span className="oh-dash-action-icon">
              <Icon size={20} />
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </section>
  );
};

const KpiRow = ({ stats }) => {
  const { users, qrStickers, scans, imageStock } = stats;
  const scansThisWeek = scans?.daily.slice(-7).reduce((sum, d) => sum + d.count, 0);
  const availableShare = percent(imageStock.availableImages, imageStock.images);

  return (
    <div className={`oh-kpi-row ${scans ? '' : 'cols-3'}`}>
      <Kpi
        icon={UsersIcon}
        tone="forest"
        label="Users"
        value={users.total}
        foot={`${formatNumber(users.active)} active · ${formatNumber(users.blocked)} blocked`}
        delta={<WeekDelta value={users.newLast7Days} noun="users" />}
      />
      <Kpi
        icon={QrIcon}
        tone="gold"
        label="QR codes generated"
        value={qrStickers.codes}
        foot={`Across ${plural(qrStickers.batches, 'batch', 'batches')}`}
        delta={<WeekDelta value={qrStickers.codesLast7Days} noun="codes" />}
      />
      {scans && (
        <Kpi
          icon={ScanIcon}
          tone="green"
          label="Scans"
          value={scans.total}
          foot={`${formatNumber(scans.records)} recorded · ${formatNumber(scans.verifications)} verified`}
          delta={<WeekDelta value={scansThisWeek} noun="scans" />}
        />
      )}
      <Kpi
        icon={ImageIcon}
        tone="purple"
        label="Images available"
        value={imageStock.availableImages}
        foot={`${availableShare}% of ${plural(imageStock.images, 'image')} · ${plural(imageStock.folders, 'folder')}`}
      >
        <div
          className="oh-kpi-meter"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={availableShare}
          aria-label="Share of images available"
        >
          <span style={{ width: `${availableShare}%` }} />
        </div>
      </Kpi>
    </div>
  );
};

const ActivityChart = ({ daily }) => {
  const [hovered, setHovered] = useState(null);
  const total = daily.reduce((sum, d) => sum + d.count, 0);
  const thisWeek = daily.slice(-7).reduce((sum, d) => sum + d.count, 0);
  const lastWeek = total - thisWeek;
  const max = niceCeil(Math.max(...daily.map((d) => d.count)));
  const active = hovered ?? daily.length - 1;
  const activeDay = daily[active];
  const ticks = [max, max / 2, 0];

  return (
    <Card
      icon={ActivityIcon}
      title="Scan activity"
      subtitle="Every scan in the app, last 14 days"
      className="area-activity"
    >
      <div className="oh-chart-summary">
        <div>
          <div className="oh-chart-figure">{formatNumber(total)}</div>
          <div className="oh-chart-caption">scans in 14 days</div>
        </div>
        <div className="oh-chart-compare">
          <span>
            <strong>{formatNumber(thisWeek)}</strong> this week
          </span>
          <span>
            <strong>{formatNumber(lastWeek)}</strong> the week before
          </span>
        </div>
      </div>

      <div className="oh-chart" role="img" aria-label={`Daily scans for the last 14 days, ${total} in total.`}>
        <div className="oh-chart-grid" aria-hidden="true">
          {ticks.map((t) => (
            <div key={t} className="oh-chart-gridline">
              <span>{formatNumber(t)}</span>
            </div>
          ))}
        </div>

        <div className="oh-chart-bars" onMouseLeave={() => setHovered(null)}>
          {daily.map((d, i) => {
            const isToday = i === daily.length - 1;
            return (
              <div
                key={d.date}
                className={`oh-chart-slot ${i === active ? 'active' : ''}`}
                onMouseEnter={() => setHovered(i)}
              >
                <div
                  className={`oh-chart-bar ${isToday ? 'today' : ''} ${d.count ? '' : 'empty'}`}
                  style={{ height: d.count ? `${(d.count / max) * 100}%` : undefined }}
                />
              </div>
            );
          })}
        </div>

        {activeDay && (
          <div
            className={`oh-chart-tooltip ${active < 2 ? 'edge-start' : active > daily.length - 3 ? 'edge-end' : ''}`}
            style={{ left: `${((active + 0.5) / daily.length) * 100}%` }}
            aria-hidden="true"
          >
            <strong>{plural(activeDay.count, 'scan')}</strong>
            <span>
              {active === daily.length - 1
                ? 'Today'
                : parseDay(activeDay.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
            </span>
          </div>
        )}

        {total === 0 && <div className="oh-chart-empty">No scans in the last 14 days</div>}
      </div>

      <div className="oh-chart-axis" aria-hidden="true">
        {[0, Math.floor(daily.length / 2), daily.length - 1].map((i) => (
          <span key={i} style={{ left: `${((i + 0.5) / daily.length) * 100}%` }}>
            {i === daily.length - 1 ? 'Today' : shortDate(parseDay(daily[i].date))}
          </span>
        ))}
      </div>

      <table className="oh-visually-hidden">
        <caption>Daily scans</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Scans</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

const VerificationCard = ({ scans }) => {
  const { outcomes, verifications } = scans;
  const decided = outcomes.matched + outcomes.unmatched;
  const segments = OUTCOMES.filter((o) => outcomes[o.key] > 0);

  return (
    <Card
      icon={ShieldCheckIcon}
      title="Verifications"
      subtitle={plural(verifications, 'authenticity check')}
      className="area-verify"
    >
      <div className="oh-verify-headline">
        <div className="oh-chart-figure">{decided ? `${percent(outcomes.matched, decided)}%` : '—'}</div>
        <div className="oh-chart-caption">
          match rate {decided ? `across ${plural(decided, 'answered check')}` : '· no answered checks yet'}
        </div>
      </div>

      <div className="oh-stack" aria-hidden="true">
        {segments.length ? (
          segments.map((o) => (
            <span
              key={o.key}
              className={`oh-stack-seg tone-${o.tone}`}
              style={{ flexGrow: outcomes[o.key] }}
              title={`${o.label}: ${outcomes[o.key]}`}
            />
          ))
        ) : (
          <span className="oh-stack-seg empty" />
        )}
      </div>

      <ul className="oh-outcome-list">
        {OUTCOMES.map(({ key, label, hint, icon: Icon, tone }) => (
          <li key={key}>
            <span className={`oh-outcome-icon tone-${tone}`}>
              <Icon size={16} />
            </span>
            <span className="oh-outcome-text">
              <span className="oh-outcome-label">{label}</span>
              <span className="oh-outcome-hint">{hint}</span>
            </span>
            <span className="oh-outcome-count">
              {formatNumber(outcomes[key])}
              <small>{percent(outcomes[key], verifications)}%</small>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

const UsersCard = ({ users, className }) => {
  const roles = Object.entries(users.byType).sort(([a, ca], [b, cb]) => {
    const ia = ROLE_ORDER.indexOf(a);
    const ib = ROLE_ORDER.indexOf(b);
    if (ia !== ib) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return cb - ca;
  });

  return (
    <Card
      icon={UsersIcon}
      title="Users by role"
      subtitle={plural(users.total, 'registered user')}
      action={<CardLink to="/admin/users">Manage</CardLink>}
      className={className}
    >
      {roles.length ? (
        <ul className="oh-role-list">
          {roles.map(([role, count]) => {
            const { icon: Icon, tone } = ROLE_STYLES[role] || { icon: UserIcon, tone: 'consumer' };
            const share = percent(count, users.total);
            return (
              <li key={role}>
                <span className={`oh-role-icon role-${tone}`}>
                  <Icon size={16} />
                </span>
                <div className="oh-role-body">
                  <div className="oh-role-row">
                    <span className="oh-role-name">{role === 'unspecified' ? 'Role not set' : capitalize(role)}</span>
                    <span className="oh-role-count">
                      {formatNumber(count)} <small>{share}%</small>
                    </span>
                  </div>
                  <div className="oh-role-track">
                    <span className={`role-${tone}`} style={{ width: `${Math.max(share, 2)}%` }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="oh-dash-card-empty">No users have signed up yet.</div>
      )}

      <div className="oh-chip-row">
        <span className="oh-chip tone-good">
          <CheckCircleIcon size={14} />
          {formatNumber(users.active)} active
        </span>
        <span className={`oh-chip ${users.blocked ? 'tone-critical' : ''}`}>
          <BanIcon size={14} />
          {formatNumber(users.blocked)} blocked
        </span>
      </div>
    </Card>
  );
};

const ImageStockCard = ({ imageStock, className }) => {
  const { images, availableImages, blockedImages, folders } = imageStock;
  return (
    <Card
      icon={ImageIcon}
      title="Image stock"
      subtitle="Photos printed on stickers"
      action={<CardLink to="/admin/images">Open</CardLink>}
      className={className}
    >
      <div className="oh-stock-meter" aria-hidden="true">
        {images ? (
          <>
            {availableImages > 0 && <span className="tone-good" style={{ flexGrow: availableImages }} />}
            {blockedImages > 0 && <span className="tone-critical" style={{ flexGrow: blockedImages }} />}
          </>
        ) : (
          <span className="empty" />
        )}
      </div>
      <p className="oh-stock-caption">
        <strong>{percent(availableImages, images)}%</strong> of images can go on new stickers
      </p>

      <dl className="oh-mini-stats">
        <div>
          <dt>
            <span className="oh-mini-icon tone-good">
              <CheckCircleIcon size={15} />
            </span>
            Available
          </dt>
          <dd>{formatNumber(availableImages)}</dd>
        </div>
        <div>
          <dt>
            <span className="oh-mini-icon tone-critical">
              <BanIcon size={15} />
            </span>
            Blocked
          </dt>
          <dd>{formatNumber(blockedImages)}</dd>
        </div>
        <div>
          <dt>
            <span className="oh-mini-icon tone-neutral">
              <FolderIcon size={15} />
            </span>
            Folders
          </dt>
          <dd>{formatNumber(folders)}</dd>
        </div>
      </dl>
    </Card>
  );
};

const AdminsCard = ({ admins, className }) => (
  <Card
    icon={CrownIcon}
    title="Admin team"
    subtitle={plural(admins.total, 'admin account')}
    action={<CardLink to="/admin/users">Manage</CardLink>}
    className={className}
  >
    <ul className="oh-admin-team">
      <li>
        <span className="oh-mini-icon tone-purple">
          <CrownIcon size={16} />
        </span>
        <span className="oh-admin-team-label">
          Super-admins
          <small>Full access, manage admins</small>
        </span>
        <strong>{formatNumber(admins.superAdmins)}</strong>
      </li>
      <li>
        <span className="oh-mini-icon tone-forest">
          <ShieldCheckIcon size={16} />
        </span>
        <span className="oh-admin-team-label">
          Admins
          <small>Users, images and stickers</small>
        </span>
        <strong>{formatNumber(admins.regular)}</strong>
      </li>
    </ul>
  </Card>
);

const RecentBatchesCard = ({ qrStickers }) => (
  <Card
    icon={LayersIcon}
    title="Recent QR batches"
    subtitle={`${plural(qrStickers.batches, 'batch', 'batches')} generated so far`}
    action={<CardLink to="/admin/qr-stickers">View all</CardLink>}
    className="area-batches"
  >
    {qrStickers.recentBatches.length ? (
      <ul className="oh-batch-list">
        {qrStickers.recentBatches.map((b) => (
          <li key={b.id}>
            <span className="oh-batch-icon">
              <QrIcon size={18} />
            </span>
            <div className="oh-batch-main">
              <div className="oh-batch-title">
                {b.productName}
                {b.variantSize && <span className="oh-batch-variant">{b.variantSize}</span>}
              </div>
              <div className="oh-batch-meta">
                {b.producer} · Batch {b.batchNo}
              </div>
            </div>
            <span className="oh-batch-qty">{plural(b.numberOfQrs, 'code')}</span>
            <span className="oh-batch-date">{relativeDay(b.createdAt)}</span>
          </li>
        ))}
      </ul>
    ) : (
      <div className="oh-dash-card-empty">
        No batches yet. <Link to="/admin/qr-stickers">Generate your first stickers</Link>
      </div>
    )}
  </Card>
);

const DashboardSkeleton = () => (
  <div aria-hidden="true">
    <div className="oh-kpi-row">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="oh-kpi oh-skeleton" />
      ))}
    </div>
    <div className="oh-dash-grid">
      <div className="oh-dash-card oh-skeleton area-activity" />
      <div className="oh-dash-card oh-skeleton area-verify" />
    </div>
  </div>
);

// ---------- page ----------

// The page must not crash when the API is older or newer than this build (the frontend and the
// backend deploy separately): sections whose data is missing are left out instead of read blindly.
const normalizeStats = (data) => {
  const scans = data?.scans;
  return {
    users: { total: 0, active: 0, blocked: 0, byType: {}, ...data?.users },
    imageStock: { folders: 0, images: 0, availableImages: 0, blockedImages: 0, ...data?.imageStock },
    qrStickers: { batches: 0, codes: 0, ...data?.qrStickers },
    scans:
      Array.isArray(scans?.daily) && scans.daily.length
        ? {
            total: 0,
            records: 0,
            verifications: 0,
            ...scans,
            outcomes: { matched: 0, unmatched: 0, flagged: 0, abandoned: 0, ...scans.outcomes },
          }
        : null,
    admins: data?.admins || null,
  };
};

const Dashboard = () => {
  const currentUser = useSelector((s) => s.auth.user);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading');

  const load = useCallback(async (signal) => {
    setStatus('loading');
    try {
      const { data } = await api.get('/dashboard/stats', {
        params: { utcOffset: -new Date().getTimezoneOffset() },
        signal,
      });
      setStats(normalizeStats(data));
      setStatus('succeeded');
    } catch (err) {
      if (!signal?.aborted) setStatus('failed');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refreshing = status === 'loading' && !!stats;
  // Bottom row: Users · Image stock · Admin team (super-admins) — or Users · Image stock at half width each.
  const bottomSpan = stats?.admins ? 'span-third' : 'span-half';

  return (
    <div className="oh-dash">
      <Hero user={currentUser} onRefresh={() => load()} refreshing={refreshing} loaded={!!stats} />

      {status === 'loading' && !stats && (
        <>
          <span className="oh-visually-hidden" role="status">
            Loading dashboard…
          </span>
          <DashboardSkeleton />
        </>
      )}

      {status === 'failed' && (
        <div className="oh-dash-error" role="alert">
          <span className="oh-outcome-icon tone-critical">
            <AlertIcon size={18} />
          </span>
          <div>
            <strong>Could not load dashboard stats.</strong>
            <span>Check your connection and try again.</span>
          </div>
          <button type="button" className="oh-dash-retry" onClick={() => load()}>
            <RefreshIcon size={15} /> Try again
          </button>
        </div>
      )}

      {stats && (
        <div className={refreshing ? 'oh-dash-refreshing' : undefined}>
          <KpiRow stats={stats} />
          <div className={`oh-dash-grid ${stats.admins ? 'with-admins' : ''}`}>
            {stats.scans && <ActivityChart daily={stats.scans.daily} />}
            {stats.scans && <VerificationCard scans={stats.scans} />}
            <UsersCard users={stats.users} className={bottomSpan} />
            <ImageStockCard imageStock={stats.imageStock} className={bottomSpan} />
            {stats.admins && <AdminsCard admins={stats.admins} className={bottomSpan} />}
            {Array.isArray(stats.qrStickers.recentBatches) && <RecentBatchesCard qrStickers={stats.qrStickers} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
