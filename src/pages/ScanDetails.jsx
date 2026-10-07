import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import ReportPhoto from '../components/ReportPhoto.jsx';
import StickerMedia from '../components/StickerMedia.jsx';
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
  const showStickerByIds = Boolean(data?.sticker) && data.scan.result !== 'SCANNED';

  // The sticker as an image (QR + code, and its photo where this viewer may see it), made by the
  // server. Fetched as soon as the scan loads: browsers only allow sharing right after a click, so
  // it has to be ready before the Share button is pressed.
  const [shareFile, setShareFile] = useState(null);
  useEffect(() => {
    setShareFile(null);
    if (!data) return undefined;
    let cancelled = false;
    api
      .get(`/scans/${id}/share-card`, { responseType: 'blob' })
      .then(({ data: blob }) => {
        const name = data.product?.code || data.scan.code || data.scan.uuid;
        if (!cancelled) setShareFile(new File([blob], `${name}-originhash.png`, { type: 'image/png' }));
      })
      .catch(() => {}); // sharing then falls back to text only
    return () => {
      cancelled = true;
    };
  }, [id, data]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [menuOpen]);

  const flashNote = (note) => {
    setShareNote(note);
    setTimeout(() => setShareNote(''), 3000);
  };

  const shareText = () => {
    const { scan, product } = data;
    const what = variant.pill || variant.heading || 'Recorded scan';
    const code = product?.code || scan.code;
    return `${what}: ${product ? productLine(product) : 'Unknown product'}${code ? ` (${code})` : ''}, ${formatDateTimeShort(scan.createdAt)}. OriginHash scan ID ${scan.uuid}.`;
  };

  const copyDetails = async () => {
    setMenuOpen(false);
    try {
      await navigator.clipboard.writeText(shareText());
      flashNote('Details copied');
    } catch {
      flashNote("Couldn't copy — your browser blocked the clipboard");
    }
  };

  const downloadImage = () => {
    setMenuOpen(false);
    if (!shareFile) return;
    const url = URL.createObjectURL(shareFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = shareFile.name;
    a.click();
    URL.revokeObjectURL(url);
    flashNote('Sticker image downloaded');
  };

  // Phones hand image + text to apps together (WhatsApp shows the text as the caption). Many desktop
  // share targets keep only the text and drop the image, so on a computer only the image is shared
  // and the details are copied, ready to paste next to it.
  const shareSticker = async () => {
    setMenuOpen(false);
    const text = shareText();
    const touch = window.matchMedia?.('(pointer: coarse)').matches;
    try {
      if (shareFile && navigator.canShare?.({ files: [shareFile] })) {
        if (touch) {
          await navigator.share({ title: 'OriginHash', text, files: [shareFile] });
        } else {
          await navigator.clipboard?.writeText(text).catch(() => {});
          flashNote('Details copied — paste them with the image');
          await navigator.share({ title: 'OriginHash', files: [shareFile] });
        }
      } else if (shareFile) {
        downloadImage();
        await navigator.clipboard?.writeText(text).catch(() => {});
        flashNote('Sticker image downloaded · details copied');
      } else if (navigator.share) {
        await navigator.share({ title: 'OriginHash', text });
      } else {
        await copyDetails();
      }
    } catch {
      // Share sheet dismissed — nothing to do.
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
            <span className="oh-share-wrap" ref={menuRef}>
              <button
                type="button"
                className="oh-scan-icon-btn"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Share these details"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <ShareIcon size={20} />
              </button>
              {menuOpen && (
                <div className="oh-share-menu" role="menu">
                  <button type="button" role="menuitem" onClick={shareSticker} disabled={!shareFile}>
                    <strong>{shareFile ? 'Share sticker' : 'Preparing sticker image…'}</strong>
                    <span>{data?.product ? 'Sticker image with the QR and its code' : 'Image of the result and the scanned code'}</span>
                  </button>
                  <button type="button" role="menuitem" onClick={downloadImage} disabled={!shareFile}>
                    <strong>Download sticker image</strong>
                    <span>Save it to attach anywhere</span>
                  </button>
                  <button type="button" role="menuitem" onClick={copyDetails}>
                    <strong>Copy details</strong>
                    <span>Result, product, code, date and scan ID</span>
                  </button>
                </div>
              )}
            </span>
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
              {/* Record scans show the sticker in the product card; verifications show it beside the IDs. */}
              <div className={`oh-details-ids-card ${showStickerByIds ? 'with-media' : ''}`}>
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
                {showStickerByIds && <StickerMedia sticker={data.sticker} />}
              </div>
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
            {product.code && <Row label="Sticker code">{product.code}</Row>}
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
          {report.photoUrl && <ReportPhoto url={report.photoUrl} alt="The photo you sent with your report" />}
          {report.note && <p className="oh-result-report-note">{report.note}</p>}
          {!report.photoUrl && !report.note && <p className="oh-result-report-empty">Sent without a photo or description.</p>}
        </section>
      )}
    </>
  );
};

export default ScanDetails;
