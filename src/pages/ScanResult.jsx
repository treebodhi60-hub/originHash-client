import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ScanReportForm from '../components/ScanReportForm.jsx';
import { ArrowLeftIcon, CheckIcon, CrossIcon, FlagIcon, HomeIcon, WarningIcon } from '../components/ScanIcons.jsx';
import { formatDate, formatDateTime, formatScanTime } from '../utils/format';
import { scanRoutes } from '../utils/scanRoutes';
import '../styles/app-shell.css';
import '../styles/scan.css';

const RESULTS = {
  SCANNED: {
    title: 'Scan recorded',
    tone: 'success',
    icon: <CheckIcon size={28} />,
    heading: 'Thank you!',
    body: ({ scan }) =>
      scan.hasLocation ? 'This product has been recorded at your location.' : 'This product has been recorded.',
  },
  MATCHED: {
    title: 'Verification result',
    tone: 'success',
    icon: <CheckIcon size={28} />,
    heading: 'Product verified',
    body: () => 'You confirmed the image matches. This product is genuine.',
  },
  UNMATCHED: {
    title: 'Verification result',
    tone: 'danger',
    icon: <WarningIcon size={28} />,
    heading: 'Product mismatched',
    body: ({ report }) =>
      `${report ? 'Thanks for reporting it. ' : ''}This product may not be genuine, so check with the seller before using it.`,
  },
  NOT_FOUND: {
    title: 'Verification result',
    tone: 'danger',
    icon: <CrossIcon size={28} />,
    heading: 'Not authentic',
    body: () => "This code isn't in OriginHash records, so the product may not be genuine.",
  },
  INVALID: {
    title: 'Verification result',
    tone: 'danger',
    icon: <CrossIcon size={28} />,
    heading: 'Not an OriginHash QR',
    body: () => "This QR code doesn't belong to an OriginHash product sticker.",
  },
  ALREADY_VIEWED: {
    title: 'Verification result',
    tone: 'warning',
    icon: <WarningIcon size={28} />,
    heading: 'Already verified',
    body: ({ report }) =>
      report
        ? 'Thanks for reporting it. This product was verified earlier and may have been scanned before.'
        : 'This product was verified earlier. It may have been scanned before.',
  },
};

// Shown after "Scan to record" or a finished verification; the previous screen hands over
// the saved scan, product (never the sticker image) and any report through router state.
const ScanResult = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const [reporting, setReporting] = useState(false);
  const paths = scanRoutes(user);

  const state = location.state || {};
  const { scan, product, report, firstViewedAt } = state;
  const copy = scan && RESULTS[scan.result];
  if (!copy) return <Navigate to={paths.camera} replace />;

  const canReport = scan.result === 'ALREADY_VIEWED' && !report;

  // Back to the scanner entry this page was opened from, when there is one.
  const backToScanner = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate(paths.camera, { replace: true });
  };

  // Keep the saved report in this history entry so a refresh still shows it.
  const showReport = (data) => {
    setReporting(false);
    navigate(location.pathname, { replace: true, state: { ...state, ...data } });
  };

  return (
    <div className="oh-result-page">
      <div className="oh-result-shell">
        <header className="oh-result-head">
          <button type="button" className="oh-scan-icon-btn" onClick={backToScanner} aria-label="Back to scanner">
            <ArrowLeftIcon size={20} />
          </button>
          <h1 className="oh-result-title">{copy.title}</h1>
          <span className="oh-scan-icon-spacer" />
        </header>

        <div className="oh-result-body">
          <span className={`oh-result-icon ${copy.tone}`}>{copy.icon}</span>
          <h2 className="oh-result-heading">{copy.heading}</h2>
          <p className="oh-result-text">{copy.body(state)}</p>

          <div className="oh-result-product">
            <div className="oh-result-product-name">
              {product
                ? `${product.productName}${product.variantSize ? ` · ${product.variantSize}` : ''}`
                : 'Unknown product'}
            </div>
            {scan.code && <div className="oh-result-product-code">{scan.code}</div>}
          </div>

          <hr className="oh-result-divider" />

          {product ? (
            <dl className="oh-result-facts">
              <div>
                <dt>Producer</dt>
                <dd>{product.producer}</dd>
              </div>
              <div>
                <dt>Batch</dt>
                <dd>{product.batchNo}</dd>
              </div>
              {firstViewedAt ? (
                <div>
                  <dt>First verified</dt>
                  <dd>{formatDateTime(firstViewedAt)}</dd>
                </div>
              ) : (
                product.packedAt && (
                  <div>
                    <dt>Packed</dt>
                    <dd>{formatDate(product.packedAt)}</dd>
                  </div>
                )
              )}
              <div>
                <dt>{scan.action === 'record' ? 'Recorded' : 'Checked'}</dt>
                <dd>{formatScanTime(scan.createdAt)}</dd>
              </div>
            </dl>
          ) : (
            <p className="oh-result-empty">
              Check the code printed under the QR, or ask the seller where this product came from.
            </p>
          )}

          {report && (
            <section className="oh-result-report" aria-label="Your report">
              <div className="oh-result-report-head">
                <FlagIcon size={16} />
                Your report
                <span>{formatScanTime(report.createdAt)}</span>
              </div>
              {report.photoUrl && <img src={report.photoUrl} alt="The photo you sent with your report" />}
              {report.note && <p className="oh-result-report-note">{report.note}</p>}
              {!report.photoUrl && !report.note && (
                <p className="oh-result-report-empty">Sent without a photo or description.</p>
              )}
            </section>
          )}

          {canReport && !reporting && (
            <button type="button" className="oh-result-report-btn" onClick={() => setReporting(true)}>
              <FlagIcon size={16} />
              Report issue
            </button>
          )}
          {canReport && reporting && (
            <div className="oh-result-report-form">
              <ScanReportForm
                scanId={scan.id}
                placeholder="I bought this sealed but it shows already verified"
                onReported={showReport}
              />
            </div>
          )}

          <div className="oh-result-actions">
            <button type="button" className="oh-result-home" onClick={() => navigate(paths.home)}>
              <HomeIcon size={18} />
              Done, go home
            </button>
            <button type="button" className="oh-result-again" onClick={backToScanner}>
              Scan another product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResult;
