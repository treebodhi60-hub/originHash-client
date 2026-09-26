import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { LoadingState } from '../components/Loader.jsx';
import JourneySection, { hasPlaceNames, productLine } from '../components/JourneySection.jsx';
import {
  ArrowLeftIcon,
  CheckIcon,
  CrossIcon,
  FlagIcon,
  ShareIcon,
  UndoIcon,
  WarningIcon,
} from '../components/ScanIcons.jsx';
import { formatCoords, formatDateTimeShort } from '../utils/format';
import { scanRoutes } from '../utils/scanRoutes';
import '../styles/app-shell.css';
import '../styles/scan.css';
import '../styles/history.css';

const VERIFIED = {
  title: 'Verification details',
  tone: 'success',
  icon: <CheckIcon size={28} />,
  pill: 'Verified · Authentic',
};
const NOT_VERIFIED = {
  title: 'Verification details',
  tone: 'muted',
  icon: <UndoIcon size={28} />,
  heading: 'Not verified',
  text: "You left before confirming the image, so this product wasn't verified.",
};

const VARIANTS = {
  MATCHED: VERIFIED,
  AUTHENTIC: VERIFIED,
  SCANNED: { title: 'Scan details' },
  UNMATCHED: {
    title: 'Verification details',
    tone: 'danger',
    icon: <WarningIcon size={28} />,
    heading: 'Product mismatched',
    text: "You reported that the image didn't match this product.",
  },
  ALREADY_VIEWED: {
    title: 'Verification details',
    tone: 'warning',
    icon: <WarningIcon size={28} />,
    heading: 'Already verified',
    text: 'This product was verified earlier. It may have been scanned before.',
  },
  NOT_FOUND: {
    title: 'Verification details',
    tone: 'danger',
    icon: <CrossIcon size={28} />,
    heading: 'Not authentic',
    text: "This code isn't in OriginHash records, so the product may not be genuine.",
  },
  INVALID: {
    title: 'Verification details',
    tone: 'danger',
    icon: <CrossIcon size={28} />,
    heading: 'Not an OriginHash QR',
    text: "This QR code doesn't belong to an OriginHash product sticker.",
  },
  ROLLED_BACK: NOT_VERIFIED,
  PENDING: NOT_VERIFIED,
};

const Row = ({ label, children }) => (
  <div className="oh-details-row">
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

// One scan from the history (any user's, for admins). Record scans show the product's journey —
// every "Scan to record" of the sticker for admins and the batch's creator, otherwise just the
// viewer's own. Verifications show the outcome. Scan ID and QR ID are kept for reference.
const ScanDetails = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const paths = scanRoutes(user);
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [shareNote, setShareNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api
      .get(`/scans/${id}`)
      .then(({ data: body }) => {
        if (cancelled) return;
        setData(body);
        setStatus('ready');
      })
      .catch((err) => {
        if (!cancelled) setStatus(err.response?.status === 404 ? 'missing' : 'failed');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate(paths.history, { replace: true });
  };

  const variant = data && (VARIANTS[data.scan.result] || NOT_VERIFIED);

  const share = async () => {
    const { scan, product } = data;
    const what = variant.pill || variant.heading || 'Recorded scan';
    const text = `${what}: ${product ? productLine(product) : 'Unknown product'}${scan.code ? ` (${scan.code})` : ''}, ${formatDateTimeShort(scan.createdAt)}. OriginHash scan ID ${scan.uuid}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'OriginHash', text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareNote('Details copied');
        setTimeout(() => setShareNote(''), 2000);
      }
    } catch {
      // Share sheet dismissed, or clipboard blocked — nothing to do.
    }
  };

  return (
    <div className="oh-result-page oh-details-page">
      <div className="oh-result-shell">
        <header className="oh-result-head">
          <button type="button" className="oh-scan-icon-btn" onClick={goBack} aria-label="Back to history">
            <ArrowLeftIcon size={20} />
          </button>
          <h1 className="oh-result-title">{variant?.title || 'Scan details'}</h1>
          {status === 'ready' ? (
            <button type="button" className="oh-scan-icon-btn" onClick={share} aria-label="Share these details">
              <ShareIcon size={20} />
            </button>
          ) : (
            <span className="oh-scan-icon-spacer" />
          )}
        </header>

        <div className="oh-result-body oh-details-body">
          {shareNote && (
            <p className="oh-details-toast" role="status">
              {shareNote}
            </p>
          )}
          {status === 'loading' && <LoadingState className="oh-history-empty" label="Loading scan…" />}
          {status === 'missing' && <div className="oh-history-empty">This scan wasn't found.</div>}
          {status === 'failed' && <div className="oh-history-empty">Couldn't load this scan. Please try again later.</div>}

          {status === 'ready' &&
            (data.scan.result === 'SCANNED' ? (
              <JourneySection {...data} />
            ) : (
              <VerifyDetails data={data} variant={variant} />
            ))}

          {status === 'ready' && (
            <>
              <dl className="oh-details-ids">
                <div>
                  <dt>Scan ID</dt>
                  <dd>{data.scan.uuid ?? '—'}</dd>
                </div>
                <div>
                  <dt>QR ID</dt>
                  <dd>{data.scan.qrCodeUuid ?? '—'}</dd>
                </div>
              </dl>
              <p className="oh-details-footnote">
                This record confirms the {data.scan.action === 'record' ? 'scan' : 'verification'} carried out by
                OriginHash and cannot be edited.
              </p>
              {hasPlaceNames(data) && <p className="oh-details-attribution">Place names © OpenStreetMap contributors</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const VerifyDetails = ({ data, variant }) => {
  const { scan, product, report, firstViewedAt } = data;
  return (
    <>
      <div className="oh-details-hero">
        <span className={`oh-result-icon ${variant.tone}`}>{variant.icon}</span>
        {variant.pill && <span className={`oh-details-pill ${variant.tone}`}>{variant.pill}</span>}
        {variant.heading && <h2 className="oh-result-heading">{variant.heading}</h2>}
        {variant.text && <p className="oh-result-text">{variant.text}</p>}
      </div>

      <dl className="oh-details-list">
        {product ? (
          <>
            <Row label="Product">{productLine(product)}</Row>
            <Row label="Producer">{product.producer}</Row>
          </>
        ) : (
          scan.code && <Row label="Code scanned">{scan.code}</Row>
        )}
        {data.scannedBy && !data.scannedBy.isYou && (
          <Row label="Scanned by">{data.scannedBy.name || 'Unnamed user'}</Row>
        )}
        {firstViewedAt && <Row label="First verified">{formatDateTimeShort(firstViewedAt)}</Row>}
        <Row label={scan.result === 'MATCHED' || scan.result === 'AUTHENTIC' ? 'Verified on' : 'Checked on'}>
          {formatDateTimeShort(scan.createdAt)}
        </Row>
        <Row label="Location">
          {scan.location ? (
            <>
              {scan.location.name && <span className="oh-details-place">{scan.location.name}</span>}
              <span className={scan.location.name ? 'oh-details-coords' : undefined}>{formatCoords(scan.location)}</span>
            </>
          ) : (
            'Not shared'
          )}
        </Row>
      </dl>

      {report && (
        <section className="oh-result-report" aria-label="Your report">
          <div className="oh-result-report-head">
            <FlagIcon size={16} />
            {data.scannedBy?.isYou === false ? 'Report' : 'Your report'}
            <span>{formatDateTimeShort(report.createdAt)}</span>
          </div>
          {report.photoUrl && <img src={report.photoUrl} alt="The photo you sent with your report" />}
          {report.note && <p className="oh-result-report-note">{report.note}</p>}
          {!report.photoUrl && !report.note && <p className="oh-result-report-empty">Sent without a photo or description.</p>}
        </section>
      )}
    </>
  );
};

export default ScanDetails;
