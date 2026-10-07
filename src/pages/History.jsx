import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { LoadingState, Spinner } from '../components/Loader.jsx';
import { MenuButton } from '../components/MobileMenu.jsx';
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CrossIcon,
  PinIcon,
  SearchIcon,
  UndoIcon,
} from '../components/ScanIcons.jsx';
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

const PAGE_SIZES = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

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

// Page buttons to show: first, last, and the current page's neighbours, with gaps as '…'.
// e.g. page 6 of 12 → 1 … 5 6 7 … 12
const pageItems = (page, totalPages) => {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [`gap-${p}`, p] : [p]));
};

const positiveInt = (value, fallback) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

const Pagination = ({ page, totalPages, pageSize, total, onPage, onPageSize, disabled }) => {
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, total);

  return (
    <nav className="oh-pager" aria-label="Scan history pages">
      <label className="oh-pager-size">
        <span>Rows per page</span>
        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} disabled={disabled}>
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <span className="oh-pager-range" aria-live="polite">
        {first}–{last} of {total}
      </span>

      <div className="oh-pager-pages">
        <button
          type="button"
          className="oh-pager-btn"
          onClick={() => onPage(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon size={16} />
        </button>

        {pageItems(page, totalPages).map((item) =>
          typeof item === 'string' ? (
            <span key={item} className="oh-pager-gap" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`oh-pager-btn num ${item === page ? 'active' : ''}`}
              onClick={() => onPage(item)}
              disabled={disabled}
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          )
        )}

        <span className="oh-pager-compact">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          className="oh-pager-btn"
          onClick={() => onPage(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </nav>
  );
};

// "Verification history": every scan the user has made (every user's, for admins), newest
// first — filterable, searchable and paginated. Filter, search and page all live in the URL,
// so coming back from a scan's details lands on the same page of the same results.
const History = () => {
  const { user } = useSelector((state) => state.auth);
  // From the layout: opens the phone ☰ menu (this page hides the layout's top bar).
  const { openMenu } = useOutletContext() || {};
  const paths = scanRoutes(user);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = FILTERS.some(([key]) => key === searchParams.get('filter')) ? searchParams.get('filter') : 'all';
  const q = (searchParams.get('q') || '').trim();
  const requestedPage = positiveInt(searchParams.get('page'), 1);
  const pageSize = PAGE_SIZES.includes(Number(searchParams.get('size'))) ? Number(searchParams.get('size')) : DEFAULT_PAGE_SIZE;

  const [query, setQuery] = useState(q); // the search box, ahead of the debounced URL value
  const [scans, setScans] = useState([]);
  const [paging, setPaging] = useState({ page: 1, totalPages: 1, total: 0 });
  const [scope, setScope] = useState('own'); // 'all' for admins
  const [status, setStatus] = useState('loading'); // loading | ready | failed
  const [reloadKey, setReloadKey] = useState(0);
  const requestRef = useRef(0);
  const panelRef = useRef(null);

  // Change some URL params; anything that changes the result set goes back to page 1.
  const updateParams = (changes, { keepPage = false } = {}) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) => {
          if (value === null || value === '' || value === undefined) next.delete(key);
          else next.set(key, String(value));
        });
        if (!keepPage) next.delete('page');
        if (next.get('filter') === 'all') next.delete('filter');
        if (next.get('page') === '1') next.delete('page');
        if (next.get('size') === String(DEFAULT_PAGE_SIZE)) next.delete('size');
        return next;
      },
      { replace: true }
    );
  };

  // Keep the box in step when the URL changes underneath it (back / forward).
  useEffect(() => setQuery((current) => (current.trim() === q ? current : q)), [q]);

  // Search as you type, once typing pauses.
  useEffect(() => {
    if (query.trim() === q) return undefined;
    const timer = setTimeout(() => updateParams({ q: query.trim() }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, q]);

  useEffect(() => {
    const request = ++requestRef.current;
    setStatus('loading');
    api
      .get('/scans', { params: { filter, q: q || undefined, page: requestedPage, pageSize } })
      .then(({ data }) => {
        if (request !== requestRef.current) return;
        // A server without numbered pages (older deploy) answers with a single page + hasMore.
        const page = data.page ?? requestedPage;
        const total = data.total ?? (page - 1) * pageSize + data.scans.length + (data.hasMore ? 1 : 0);
        setScans(data.scans);
        setPaging({ page, total, totalPages: data.totalPages ?? page + (data.hasMore ? 1 : 0) });
        setScope(data.scope);
        setStatus('ready');
      })
      .catch(() => {
        if (request === requestRef.current) setStatus('failed');
      });
  }, [filter, q, requestedPage, pageSize, reloadKey]);

  const goToPage = (page) => {
    updateParams({ page }, { keepPage: true });
    // Bring the top of the list into view if the user had scrolled down to the pager.
    const top = panelRef.current?.getBoundingClientRect().top;
    if (top !== undefined && top < 0) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearSearch = () => {
    setQuery('');
    updateParams({ q: '' });
  };

  const openScan = (id) => navigate(`${paths.history}/${id}`);
  const productLabel = (scan) =>
    scan.productName ? `${scan.productName}${scan.variantSize ? ` ${scan.variantSize}` : ''}` : scan.code || 'Unknown QR code';
  const scannerLabel = (scan) => (scan.scannedBy?.isYou ? 'You' : scan.scannedBy?.name || 'Unnamed user');
  const serial = (index) => (paging.page - 1) * pageSize + index + 1;

  const loading = status === 'loading';
  const firstLoad = loading && scans.length === 0;
  const refreshing = loading && scans.length > 0;
  const showResults = scans.length > 0 && status !== 'failed';
  const searchPlaceholder =
    scope === 'all' ? 'Search product, code, producer, batch, user or place' : 'Search product, code, producer, batch or place';

  const filterChips = (
    <div className="oh-history-filters" role="group" aria-label="Filter scans">
      {FILTERS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={`oh-history-chip ${filter === key ? 'active' : ''}`}
          aria-pressed={filter === key}
          onClick={() => updateParams({ filter: key })}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const searchBox = (
    <div className="oh-history-search" role="search">
      <SearchIcon size={18} />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') updateParams({ q: query.trim() });
          if (e.key === 'Escape' && query) clearSearch();
        }}
        placeholder={searchPlaceholder}
        aria-label="Search scans"
        maxLength={100}
        enterKeyHint="search"
      />
      {loading && q && <Spinner className="oh-history-search-spinner" />}
      {query && (
        <button type="button" className="oh-history-search-clear" onClick={clearSearch} aria-label="Clear search">
          <CrossIcon size={14} />
        </button>
      )}
    </div>
  );

  const emptyMessage = q ? (
    <>
      No scans match “{q}”{filter !== 'all' && ' with this filter'}.
      <button type="button" className="oh-history-empty-action" onClick={clearSearch}>
        Clear search
      </button>
    </>
  ) : filter === 'all' ? (
    'No scans yet. Scan a product and it will show up here.'
  ) : (
    'No scans match this filter yet.'
  );

  return (
    <div className="oh-history-page">
      {/* Laptop: a standard page header with the search alongside, filters below. */}
      <div className="oh-history-desk-head oh-only-desktop">
        <div>
          <h1 className="oh-admin-title">Verification history</h1>
          <p className="oh-admin-subtitle">{scope === 'all' ? 'Scans by all users' : 'Your scans'}</p>
        </div>
        {searchBox}
      </div>
      <div className="oh-history-desk-toolbar oh-only-desktop">
        {filterChips}
        {status === 'ready' && (
          <span className="oh-history-count">
            {paging.total} {paging.total === 1 ? 'scan' : 'scans'}
            {q && ' found'}
          </span>
        )}
      </div>

      <div className="oh-result-shell oh-history-shell">
        <header className="oh-result-head oh-history-head">
          {openMenu ? <MenuButton onClick={openMenu} /> : <span className="oh-scan-icon-spacer" />}
          <h1 className="oh-result-title">Verification history</h1>
          <span className="oh-scan-icon-spacer" />
        </header>

        <div className="oh-result-body oh-history-body">
          <div className="oh-only-mobile">
            {scope === 'all' && <p className="oh-history-scope">Showing scans by all users</p>}
            {searchBox}
            {filterChips}
          </div>

          <div
            ref={panelRef}
            className={`oh-history-panel ${refreshing ? 'is-refreshing' : ''}`}
            aria-busy={loading}
          >
            {firstLoad && <LoadingState className="oh-history-empty" label="Loading scans…" />}
            {status === 'failed' && (
              <div className="oh-history-empty">
                Couldn't load the scans.
                <button type="button" className="oh-history-empty-action" onClick={() => setReloadKey((k) => k + 1)}>
                  Try again
                </button>
              </div>
            )}
            {status === 'ready' && scans.length === 0 && <div className="oh-history-empty">{emptyMessage}</div>}

            {showResults && (
              <>
                {/* Phone: cards. */}
                <ul className="oh-history-list oh-only-mobile">
                  {scans.map((scan, index) => {
                    const s = HISTORY_STATUS[scan.result] || NOT_VERIFIED;
                    return (
                      <li key={scan.id} className="oh-history-card">
                        <span className={`oh-history-icon ${s.tone}`}>{s.icon}</span>
                        <div className="oh-history-text">
                          <div className="oh-history-name">
                            <span className="oh-history-sno">#{serial(index)}</span>
                            {productLabel(scan)}
                          </div>
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
                        <th scope="col" className="oh-history-cell-sno">
                          S.No
                        </th>
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
                      {scans.map((scan, index) => {
                        const s = HISTORY_STATUS[scan.result] || NOT_VERIFIED;
                        return (
                          <tr key={scan.id} onClick={() => openScan(scan.id)}>
                            <td className="oh-history-cell-sno">{serial(index)}</td>
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

                <Pagination
                  page={paging.page}
                  totalPages={paging.totalPages}
                  pageSize={pageSize}
                  total={paging.total}
                  onPage={goToPage}
                  onPageSize={(size) => updateParams({ size })}
                  disabled={loading}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
