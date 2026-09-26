import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeftIcon, CheckIcon, CrossIcon, HomeIcon } from '../components/ScanIcons.jsx';
import { formatDate, formatScanTime } from '../utils/format';
import '../styles/app-shell.css';
import '../styles/scan.css';

const RESULTS = {
  SCANNED: {
    title: 'Scan recorded',
    tone: 'success',
    heading: 'Thank you!',
    body: ({ scan }) =>
      scan.hasLocation ? 'This product has been recorded at your location.' : 'This product has been recorded.',
  },
  MATCHED: {
    title: 'Verification result',
    tone: 'success',
    heading: 'Product verified',
    body: () => 'You confirmed the image matches. This product is genuine.',
  },
  UNMATCHED: {
    title: 'Verification result',
    tone: 'danger',
    heading: "Image didn't match",
    body: () => 'This product may not be genuine. Check with the seller before using it.',
  },
  NOT_FOUND: {
    title: 'Verification result',
    tone: 'danger',
    heading: 'Not authentic',
    body: () => "This code isn't in OriginHash records, so the product may not be genuine.",
  },
  INVALID: {
    title: 'Verification result',
    tone: 'danger',
    heading: 'Not an OriginHash QR',
    body: () => "This QR code doesn't belong to an OriginHash product sticker.",
  },
  ALREADY_VIEWED: {
    title: 'Verification result',
    tone: 'danger',
    heading: 'Image already viewed',
    body: ({ firstViewedAt }) =>
      `This sticker's image was already revealed${firstViewedAt ? ` on ${formatDate(firstViewedAt)}` : ''}. ` +
      "If that wasn't you, this sticker may be a copy.",
  },
};

// Shown after "Scan to record" or a finished verification; the previous screen hands over
// the saved scan and product (never the sticker image) through router state.
const ScanResult = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const scanPath = user?.isAdmin ? '/admin/scan' : '/scan';
  const homePath = user?.isAdmin ? '/admin/users' : '/home';

  const state = location.state || {};
  const { scan, product } = state;
  const copy = scan && RESULTS[scan.result];
  if (!copy) return <Navigate to={scanPath} replace />;

  // Back to the scanner entry this page was opened from, when there is one.
  const backToScanner = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate(scanPath, { replace: true });
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
          <span className={`oh-result-icon ${copy.tone}`}>
            {copy.tone === 'success' ? <CheckIcon size={28} /> : <CrossIcon size={28} />}
          </span>
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
              {product.packedAt && (
                <div>
                  <dt>Packed</dt>
                  <dd>{formatDate(product.packedAt)}</dd>
                </div>
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

          <div className="oh-result-actions">
            <button type="button" className="oh-result-home" onClick={() => navigate(homePath)}>
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
