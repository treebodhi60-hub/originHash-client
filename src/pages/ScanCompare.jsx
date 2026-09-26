import { useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import BrandLogo from '../components/BrandLogo.jsx';
import { ArrowLeftIcon, CheckIcon, CrossIcon, ImageIcon, ShieldIcon } from '../components/ScanIcons.jsx';
import useRollbackOnLeave, { rollBackScan } from '../hooks/useRollbackOnLeave';
import { formatDateTime } from '../utils/format';
import '../styles/app-shell.css';
import '../styles/scan.css';

// "Compare image": the sticker's once-only image, revealed from the scanner's
// "Yes, show the image". The user answers Matched / Unmatched; leaving without
// answering (back arrow, back button, nav bar) records the scan as ROLLED_BACK.
const ScanCompare = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const scanPath = user?.isAdmin ? '/admin/scan' : '/scan';
  const { scan, product } = location.state || {};

  const [answering, setAnswering] = useState(null);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const openScanIdRef = useRef(scan?.result === 'PENDING' ? scan.id : null);
  useRollbackOnLeave(openScanIdRef);

  if (!scan || !product?.imageUrl) return <Navigate to={scanPath} replace />;

  const answer = async (result) => {
    if (answering) return;
    setAnswering(result);
    setError('');
    try {
      const { data } = await api.patch(`/scans/${scan.id}`, { result });
      openScanIdRef.current = null;
      navigate(`${scanPath}/result`, { replace: true, state: data });
    } catch (err) {
      setAnswering(null);
      setError(err.response?.data?.message || "Couldn't save your answer. Check your connection and try again.");
    }
  };

  const goBack = () => {
    const scanId = openScanIdRef.current;
    openScanIdRef.current = null;
    if (scanId) rollBackScan(scanId);
    if (location.key !== 'default') navigate(-1);
    else navigate(scanPath, { replace: true });
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
              className="oh-compare-answer unmatched"
              onClick={() => answer('UNMATCHED')}
              disabled={Boolean(answering)}
            >
              <CrossIcon size={18} />
              {answering === 'UNMATCHED' ? 'Saving…' : 'Unmatched'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanCompare;
