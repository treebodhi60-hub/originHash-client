import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import BrandLogo from '../components/BrandLogo.jsx';
import {
  ArrowLeftIcon,
  BoxIcon,
  CheckIcon,
  CrossIcon,
  EyeIcon,
  FlashIcon,
  ImageIcon,
  KeyboardIcon,
  QrIcon,
  ShieldIcon,
  WarningIcon,
} from '../components/ScanIcons.jsx';
import useRollbackOnLeave, { rollBackScan } from '../hooks/useRollbackOnLeave';
import { createQrDecoder, drawToCanvas, extractCode } from '../utils/qr';
import { scanRoutes } from '../utils/scanRoutes';
import '../styles/app-shell.css';
import '../styles/scan.css';

const SCAN_INTERVAL_MS = 180;
const LIVE_DECODE_PX = 720;
const PHOTO_DECODE_PX = 1280;
// After "Scan again" the phone is usually still pointed at the same sticker — ignore
// that QR briefly so it doesn't get captured straight back.
const RESCAN_COOLDOWN_MS = 2500;
const LOCATION_TIMEOUT_MS = 8000;

const ACTIONS = {
  record: { label: 'Scan to record', busyLabel: 'Recording…', icon: <QrIcon size={18} /> },
  verify: { label: 'Verify to authenticate', busyLabel: 'Verifying…', icon: <ShieldIcon size={18} /> },
};

const HOW_IT_WORKS = [
  'Hold the product QR steady inside the frame until it is captured.',
  'Tap Scan to record to log that the product has reached you.',
  "Or tap Verify to authenticate to see the product's secret image once and confirm it matches.",
];

const CAMERA_MESSAGES = {
  idle: null,
  starting: { title: 'Starting camera…' },
  denied: {
    title: 'Camera access is blocked',
    body: 'Allow camera access for this site in your browser settings, then try again.',
    retry: true,
  },
  nocamera: {
    title: 'No camera found',
    body: 'Upload a photo of the QR code or enter the code printed on the sticker.',
  },
  busy: {
    title: 'Camera is in use',
    body: 'Close other apps or tabs using the camera, then try again.',
    retry: true,
  },
  unsupported: {
    title: 'Live scanning is unavailable',
    body: 'The camera needs a secure (https) connection. Upload a photo or enter the code instead.',
  },
  error: {
    title: "Couldn't start the camera",
    body: 'Try again, or upload a photo of the QR code.',
    retry: true,
  },
};

const cameraErrorState = (err) => {
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') return 'denied';
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') return 'nocamera';
  if (err?.name === 'NotReadableError') return 'busy';
  return 'error';
};

// Best-effort device location, saved with every scan ("recorded at your location", and the
// location on verification details). A denied, unanswered or slow prompt just saves without it.
const getLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        clearTimeout(timer);
        resolve({ latitude: coords.latitude, longitude: coords.longitude });
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: LOCATION_TIMEOUT_MS, maximumAge: 5 * 60 * 1000 }
    );
  });

const Scan = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const paths = scanRoutes(user);

  const [camera, setCamera] = useState('starting');
  const [mirrored, setMirrored] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [frozen, setFrozen] = useState(null); // null | 'camera' | 'photo' — what the snapshot shows
  const [captured, setCaptured] = useState(null); // { code } once a QR is read; code is null if it isn't ours
  const [busy, setBusy] = useState(null); // the action being sent: 'record' | 'verify'
  const [notice, setNotice] = useState('');
  const [verifying, setVerifying] = useState(null); // { scan, product } while "Ready to see the image?" is open
  const [revealing, setRevealing] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [codeFormOpen, setCodeFormOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const videoRef = useRef(null);
  const snapshotRef = useRef(null);
  const fileInputRef = useRef(null);
  const recordBtnRef = useRef(null);
  const workCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const decoderRef = useRef(null);
  // Bumped on every camera start/stop, so async work from a superseded session
  // (or an unmounted page) can tell it's stale and bail out.
  const sessionRef = useRef(0);
  const mountedRef = useRef(true);
  const resumeOnShowRef = useRef(false);
  const repeatGuardRef = useRef({ raw: null, until: 0 });
  // Location is looked up as soon as a QR is captured, so it's usually ready by the time
  // the user taps an action instead of delaying the next screen.
  const locationRef = useRef(null);
  const showImageBtnRef = useRef(null);
  // The PENDING verification this page still owns; leaving the page rolls it back.
  const openScanIdRef = useRef(null);
  useRollbackOnLeave(openScanIdRef);

  const getDecoder = () => {
    decoderRef.current ??= createQrDecoder().catch((err) => {
      decoderRef.current = null; // let the next attempt retry the jsQR download
      throw err;
    });
    return decoderRef.current;
  };

  const stopCamera = () => {
    sessionRef.current += 1;
    clearTimeout(loopRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamera('idle');
    setTorchSupported(false);
    setTorchOn(false);
  };

  const scanFrame = async (session) => {
    if (session !== sessionRef.current) return;
    const video = videoRef.current;

    if (video && video.readyState >= 2 && video.videoWidth) {
      workCanvasRef.current ??= document.createElement('canvas');
      const canvas = workCanvasRef.current;
      drawToCanvas(video, video.videoWidth, video.videoHeight, canvas, LIVE_DECODE_PX);

      const decode = await getDecoder();
      const text = await decode(canvas).catch(() => null);
      if (session !== sessionRef.current) return;
      const guard = repeatGuardRef.current;
      if (text && !(text === guard.raw && Date.now() < guard.until)) {
        handleCaptured(text, canvas);
        return;
      }
    }

    loopRef.current = setTimeout(() => scanFrame(session), SCAN_INTERVAL_MS);
  };

  const startCamera = async () => {
    stopCamera();
    const session = sessionRef.current;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('unsupported');
      return;
    }

    setCamera('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (session !== sessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});

      const [track] = stream.getVideoTracks();
      const { facingMode } = track.getSettings?.() || {};
      // Laptop webcams face the user, so mirror them like a video call; phone rear cameras stay as-is.
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
      setMirrored(facingMode === 'user' || (!facingMode && !coarsePointer));
      setTorchSupported(Boolean(track.getCapabilities?.()?.torch));

      await getDecoder();
      if (session !== sessionRef.current) return;
      setCamera('live');
      scanFrame(session);
    } catch (err) {
      if (session === sessionRef.current) setCamera(cameraErrorState(err));
    }
  };

  // Freeze the frame the QR was read from and turn the camera off. Nothing is sent
  // yet — the user picks "Scan to record" or "Verify to authenticate" next.
  const handleCaptured = (raw, sourceCanvas, source = 'camera') => {
    const snapshot = snapshotRef.current;
    if (sourceCanvas && snapshot) {
      snapshot.width = sourceCanvas.width;
      snapshot.height = sourceCanvas.height;
      snapshot.getContext('2d').drawImage(sourceCanvas, 0, 0);
      setFrozen(source);
    }
    stopCamera();
    navigator.vibrate?.(60);
    repeatGuardRef.current.raw = raw;
    setCaptured({ code: extractCode(raw) });
    locationRef.current = getLocation();
    setNotice('');
  };

  const scanAgain = () => {
    repeatGuardRef.current.until = Date.now() + RESCAN_COOLDOWN_MS;
    setCaptured(null);
    setFrozen(null);
    setNotice('');
    setPhotoError('');
    startCamera();
  };

  const runAction = async (action) => {
    if (busy) return;
    if (!captured) {
      setNotice('Hold a product QR inside the frame first, then choose what to do.');
      return;
    }
    if (action === 'record' && !captured.code) {
      setNotice("This QR isn't an OriginHash sticker, so it can't be recorded. If a code is printed on the sticker, use Enter code instead.");
      return;
    }

    setBusy(action);
    setNotice('');
    try {
      const position = await (locationRef.current ?? getLocation());
      const { data } = await api.post('/scans', { code: captured.code, action, ...position });
      const pending = data.scan.result === 'PENDING';
      if (!mountedRef.current) {
        if (pending) rollBackScan(data.scan.id);
        return;
      }
      if (pending) {
        // A real sticker: ask before revealing its once-only image.
        openScanIdRef.current = data.scan.id;
        setBusy(null);
        setSheetError('');
        setVerifying({ scan: data.scan, product: data.product });
        return;
      }
      navigate(paths.result, { state: data });
    } catch (err) {
      if (!mountedRef.current) return;
      setBusy(null);
      setNotice(err.response?.data?.message || "Couldn't reach OriginHash. Check your connection and try again.");
    }
  };

  const showImage = async () => {
    if (revealing) return;
    setRevealing(true);
    setSheetError('');
    try {
      const { data } = await api.post(`/scans/${verifying.scan.id}/reveal`);
      if (!mountedRef.current) return;
      openScanIdRef.current = null; // the Compare screen owns the open verification now
      navigate(paths.compare, { state: data });
    } catch (err) {
      if (!mountedRef.current) return;
      const data = err.response?.data;
      if (data?.scan?.result === 'ALREADY_VIEWED') {
        openScanIdRef.current = null;
        navigate(paths.result, { state: data });
        return;
      }
      setRevealing(false);
      setSheetError(data?.message || "Couldn't open the image. Check your connection and try again.");
    }
  };

  const notNow = () => {
    const scanId = openScanIdRef.current;
    openScanIdRef.current = null;
    if (scanId) rollBackScan(scanId);
    navigate(paths.home);
  };

  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate(paths.home);
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
    } catch {
      setTorchSupported(false);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError('');

    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      setPhotoError("That file couldn't be opened as an image.");
      return;
    }

    // Its own canvas, so the live camera loop can't draw over the photo mid-decode.
    const canvas = document.createElement('canvas');
    drawToCanvas(bitmap, bitmap.width, bitmap.height, canvas, PHOTO_DECODE_PX);
    bitmap.close?.();

    const decode = await getDecoder();
    const text = await decode(canvas, { thorough: true }).catch(() => null);
    if (!text) {
      setPhotoError('No QR code found in that photo. Try a closer, sharper shot.');
      return;
    }
    handleCaptured(text, canvas, 'photo');
  };

  const submitCode = (e) => {
    e.preventDefault();
    const code = extractCode(manualCode);
    if (!code) {
      setCodeError('Enter the code printed on the sticker, e.g. V-HUB-00110.');
      return;
    }
    setCodeError('');
    stopCamera();
    setFrozen(null);
    setCaptured({ code });
    locationRef.current = getLocation();
    setNotice('');
  };

  useEffect(() => {
    mountedRef.current = true;
    startCamera();

    // Release the camera while the tab is hidden and pick it back up on return.
    const onVisibility = () => {
      if (document.hidden && streamRef.current) {
        resumeOnShowRef.current = true;
        stopCamera();
      } else if (!document.hidden && resumeOnShowRef.current) {
        resumeOnShowRef.current = false;
        startCamera();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', onVisibility);
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (captured?.code) recordBtnRef.current?.focus();
  }, [captured]);

  useEffect(() => {
    if (verifying) showImageBtnRef.current?.focus();
  }, [verifying]);

  const cameraMessage = CAMERA_MESSAGES[camera];
  let hint = 'Place the QR code within the frame to scan';
  if (captured?.code) hint = 'QR captured — choose what to do with this product';
  else if (captured) hint = "This QR isn't an OriginHash sticker";

  return (
    <div className="oh-scan-page">
      <header className="oh-scan-brand">
        <span className="oh-scan-brand-logo">
          <BrandLogo size={20} />
        </span>
        <span className="oh-scan-brand-name">
          ORIGIN<span>HASH</span>
        </span>
      </header>

      <div className="oh-scan-layout">
        <section className="oh-scan-panel" aria-label="QR scanner">
          <div className="oh-scan-toolbar">
            <button type="button" className="oh-scan-icon-btn" onClick={goBack} aria-label="Back">
              <ArrowLeftIcon size={20} />
            </button>
            <h1 className="oh-scan-title">{verifying ? 'Verify product' : 'Scan QR code'}</h1>
            {torchSupported ? (
              <button
                type="button"
                className={`oh-scan-icon-btn ${torchOn ? 'on' : ''}`}
                onClick={toggleTorch}
                aria-label={torchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
                aria-pressed={torchOn}
              >
                <FlashIcon size={20} />
              </button>
            ) : (
              <span className="oh-scan-icon-spacer" />
            )}
          </div>

          <p className={`oh-scan-hint ${captured ? 'captured' : ''}`}>{hint}</p>

          <div className={`oh-scan-viewport ${camera === 'live' || frozen ? 'has-feed' : ''}`}>
            <video
              ref={videoRef}
              className={`oh-scan-video ${mirrored ? 'mirrored' : ''}`}
              playsInline
              muted
              autoPlay
              hidden={Boolean(frozen)}
            />
            <canvas
              ref={snapshotRef}
              className={`oh-scan-snapshot ${frozen === 'photo' ? 'photo' : mirrored ? 'mirrored' : ''}`}
              hidden={!frozen}
            />

            {(camera === 'live' || frozen === 'camera') && (
              <div className="oh-scan-frame" aria-hidden="true">
                <span className="tl" />
                <span className="tr" />
                <span className="bl" />
                <span className="br" />
                {camera === 'live' && <span className="oh-scan-line" />}
              </div>
            )}

            {busy && (
              <div className="oh-scan-overlay dim">
                <span className="oh-scan-spinner" />
                <div className="oh-scan-overlay-title">{ACTIONS[busy].busyLabel}</div>
              </div>
            )}

            {!busy && captured && (
              <div className={`oh-scan-captured ${captured.code ? 'ok' : 'bad'}`} role="status">
                <span className="oh-scan-captured-icon">
                  {captured.code ? <CheckIcon size={16} /> : <CrossIcon size={16} />}
                </span>
                <span className="oh-scan-captured-text">
                  <span className="oh-scan-captured-label">
                    {captured.code ? 'QR captured' : 'Not an OriginHash QR'}
                  </span>
                  {captured.code && <span className="oh-scan-captured-code">{captured.code}</span>}
                </span>
                <button type="button" className="oh-scan-captured-again" onClick={scanAgain}>
                  Scan again
                </button>
              </div>
            )}

            {!busy && !captured && camera !== 'live' && (
              <div className="oh-scan-overlay">
                <span className={`oh-scan-placeholder ${camera === 'starting' ? 'pulse' : ''}`}>
                  <QrIcon size={40} />
                </span>
                {cameraMessage && (
                  <>
                    <div className="oh-scan-overlay-title">{cameraMessage.title}</div>
                    {cameraMessage.body && <p className="oh-scan-overlay-body">{cameraMessage.body}</p>}
                    {cameraMessage.retry && (
                      <button type="button" className="oh-scan-retry" onClick={startCamera}>
                        Try again
                      </button>
                    )}
                  </>
                )}
                {camera === 'idle' && (
                  <button type="button" className="oh-scan-retry" onClick={scanAgain}>
                    Start camera
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={`oh-scan-actions ${captured ? 'ready' : ''}`}>
            {Object.entries(ACTIONS).map(([key, a]) => (
              <button
                key={key}
                ref={key === 'record' ? recordBtnRef : undefined}
                type="button"
                className={`oh-scan-action ${key}`}
                onClick={() => runAction(key)}
                disabled={Boolean(busy)}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
          </div>

          {notice && (
            <p className="oh-scan-notice" role="alert">
              {notice}
            </p>
          )}
        </section>

        <aside className="oh-scan-side">
          <div className="oh-scan-card oh-scan-howto">
            <div className="oh-scan-card-label">How it works</div>
            <h2 className="oh-scan-card-title">Scan, then choose</h2>
            <ol className="oh-scan-steps">
              {HOW_IT_WORKS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="oh-scan-card oh-scan-alt">
            <div className="oh-scan-card-label">Can't scan?</div>
            <div className="oh-scan-alt-actions">
              <button type="button" className="oh-scan-alt-btn" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={18} />
                Upload photo
              </button>
              <button
                type="button"
                className={`oh-scan-alt-btn ${codeFormOpen ? 'active' : ''}`}
                onClick={() => setCodeFormOpen((open) => !open)}
                aria-expanded={codeFormOpen}
              >
                <KeyboardIcon size={18} />
                Enter code
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
            {photoError && <p className="oh-scan-alt-error">{photoError}</p>}

            {codeFormOpen && (
              <form className="oh-scan-code-form" onSubmit={submitCode}>
                <label htmlFor="oh-scan-code">Code printed on the sticker</label>
                <div className="oh-scan-code-row">
                  <input
                    id="oh-scan-code"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. V-HUB-00110"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    autoFocus
                  />
                  <button type="submit" className="oh-scan-btn primary" disabled={!manualCode.trim() || Boolean(busy)}>
                    Use code
                  </button>
                </div>
                {codeError && <p className="oh-scan-alt-error">{codeError}</p>}
              </form>
            )}
          </div>
        </aside>
      </div>

      {verifying && (
        // The nav bar stays usable above this layer; leaving that way rolls the verification back.
        <div className="oh-verify-layer">
          <div className="oh-verify-backdrop" aria-hidden="true" />
          <section className="oh-verify-sheet" role="dialog" aria-labelledby="oh-verify-title">
            <span className="oh-verify-handle" aria-hidden="true" />
            <span className="oh-verify-eye">
              <EyeIcon size={24} />
            </span>
            <h2 id="oh-verify-title" className="oh-verify-title">
              Ready to see the image?
            </h2>
            <p className="oh-verify-text">
              We'll reveal the secret product image so you can compare it with the item in your hand.
            </p>
            <div className="oh-verify-warning">
              <WarningIcon size={16} />
              <span>This can be viewed only once. Keep the product with you before continuing.</span>
            </div>
            <div className="oh-verify-product">
              <BoxIcon size={16} />
              <span>
                {verifying.product.productName} · {verifying.product.code}
              </span>
            </div>
            {sheetError && (
              <p className="oh-verify-error" role="alert">
                {sheetError}
              </p>
            )}
            <button
              ref={showImageBtnRef}
              type="button"
              className="oh-verify-show"
              onClick={showImage}
              disabled={revealing}
            >
              <EyeIcon size={18} />
              {revealing ? 'Opening image…' : 'Yes, show the image'}
            </button>
            <button type="button" className="oh-verify-back" onClick={notNow} disabled={revealing}>
              Not now, go back
            </button>
          </section>
        </div>
      )}
    </div>
  );
};

export default Scan;
