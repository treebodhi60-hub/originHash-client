import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import BrandLogo from '../components/BrandLogo.jsx';
import ScanReportForm from '../components/ScanReportForm.jsx';
import { ArrowLeftIcon, CheckIcon, CrossIcon, ImageIcon, ShieldIcon } from '../components/ScanIcons.jsx';
import useRollbackOnLeave, { rollBackScan } from '../hooks/useRollbackOnLeave';
import { formatDateTime } from '../utils/format';
import { scanRoutes } from '../utils/scanRoutes';
import '../styles/app-shell.css';
import '../styles/scan.css';

// "Compare image": the sticker's once-only image, revealed from the scanner's
// "Yes, show the image". Matched closes the scan straight away; Unmatched opens an optional
// photo + description report, and submitting it closes the scan as UNMATCHED. Leaving before
// either (back arrow, back button, nav bar) records the scan as ROLLED_BACK.
const ScanCompare = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const paths = scanRoutes(user);
  const { scan, product } = location.state || {};

  const [answering, setAnswering] = useState(null);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [reporting, setReporting] = useState(false);
  const reportRef = useRef(null);
  const openScanIdRef = useRef(scan?.result === 'PENDING' ? scan.id : null);
  useRollbackOnLeave(openScanIdRef);

  useEffect(() => {
    if (reporting) reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [reporting]);

  if (!scan || !product?.imageUrl) return <Navigate to={paths.camera} replace />;

  const answer = async (result) => {
    if (answering) return;
    setAnswering(result);
    setError('');
    try {
      const { data } = await api.patch(`/scans/${scan.id}`, { result });
      showResult(data);
    } catch (err) {
      setAnswering(null);
      setError(err.response?.data?.message || "Couldn't save your answer. Check your connection and try again.");
    }
  };

  const showResult = (data) => {
    openScanIdRef.current = null;
    navigate(paths.result, { replace: true, state: data });
  };

  const goBack = () => {
    const scanId = openScanIdRef.current;
    openScanIdRef.current = null;
    if (scanId) rollBackScan(scanId);
    if (location.key !== 'default') navigate(-1);
    else navigate(paths.camera, { replace: true });
  };

  const retryImage = () => {
    setImageFailed(false);
    setImageAttempt((n) => n + 1);
  };

  return (
    <div className="oh-compare-page">
      <header className="oh-scan-brand">
        <span className="oh-scan-brand-logo">
          <BrandLogo size={20} />
        </span>
        <span className="oh-scan-brand-name">
          ORIGIN<span>HASH</span>
        </span>
      </header>

      <div className="oh-result-shell">
        <header className="oh-result-head">
          <button type="button" className="oh-scan-icon-btn" onClick={goBack} aria-label="Back to scanner">
            <ArrowLeftIcon size={20} />
          </button>
          <h1 className="oh-result-title">Compare image</h1>
          <span className="oh-scan-icon-spacer" />
        </header>

        <div className="oh-result-body oh-compare-body">
          <div className="oh-compare-banner">
            <ShieldIcon size={18} />
            Verification successful
          </div>

          <div className="oh-compare-card">
            <div className="oh-compare-image">
              {imageFailed ? (
                <button type="button" className="oh-compare-image-retry" onClick={retryImage}>
                  <ImageIcon size={28} />
                  The image didn't load. Tap to try again.
                </button>
              ) : (
                <img
                  key={imageAttempt}
                  src={product.imageUrl}
                  alt={`Secret image for ${product.productName}`}
                  onError={() => setImageFailed(true)}
                />
              )}
            </div>
            <dl className="oh-compare-facts">
              <div>
                <dt>Product</dt>
                <dd>
                  {product.productName}
                  {product.variantSize ? ` · ${product.variantSize}` : ''}
                </dd>
              </div>
              <div>
                <dt>Code</dt>
                <dd className="mono">{product.code}</dd>
              </div>
              <div>
                <dt>Verified on</dt>
                <dd>{formatDateTime(scan.imageRevealedAt || scan.createdAt)}</dd>
              </div>
            </dl>
          </div>

          <h2 className="oh-compare-question">Does this image match your product?</h2>

          {error && (
            <p className="oh-verify-error" role="alert">
              {error}
            </p>
          )}

          <div className="oh-compare-answers">
            <button
              type="button"
              className="oh-compare-answer matched"
              onClick={() => answer('MATCHED')}
              disabled={Boolean(answering)}
            >
              <CheckIcon size={18} />
              {answering === 'MATCHED' ? 'Saving…' : 'Matched'}
            </button>
            <button
              type="button"
              className={`oh-compare-answer unmatched ${reporting ? 'active' : ''}`}
              onClick={() => setReporting(true)}
              disabled={Boolean(answering)}
              aria-expanded={reporting}
            >
              <CrossIcon size={18} />
              Unmatched
            </button>
          </div>

          {reporting && (
            <div ref={reportRef} className="oh-compare-report">
              <p className="oh-compare-report-intro">Tell us what looks wrong. Both are optional.</p>
              <ScanReportForm
                scanId={scan.id}
                placeholder="The label looks different from the verified image"
                onReported={showResult}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanCompare;
