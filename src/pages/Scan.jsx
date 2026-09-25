import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import BrandLogo from '../components/BrandLogo.jsx';
import {
  AlertIcon,
  ArrowLeftIcon,
  CheckIcon,
  CrossIcon,
  FlashIcon,
  ImageIcon,
  KeyboardIcon,
  QrIcon,
  ShieldIcon,
} from '../components/ScanIcons.jsx';
import { createQrDecoder, drawToCanvas, extractCode } from '../utils/qr';
import { recordScan } from '../utils/scanHistory';
import '../styles/app-shell.css';
import '../styles/scan.css';

const SCAN_INTERVAL_MS = 180;
const LIVE_DECODE_PX = 720;
const PHOTO_DECODE_PX = 1280;
// After "Scan another" the phone is usually still pointed at the same sticker — ignore
// that QR briefly so it isn't logged twice by accident.
const RESCAN_COOLDOWN_MS = 2500;

const MODES = {
  record: {
    label: 'Scan to record',
    icon: <QrIcon size={18} />,
    title: 'Scan to record',
    steps: [
      'Hold the product QR steady inside the frame.',
      'We look the code up in OriginHash records.',
      'The product is added to your scan history.',
    ],
  },
  verify: {
    label: 'Verify to authenticate',
    icon: <ShieldIcon size={18} />,
    title: 'Verify to authenticate',
    steps: [
      'Hold the product QR steady inside the frame.',
      'We check the code against OriginHash records.',
      'You see whether the product is genuine.',
    ],
  },
};

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

const RESULTS = {
  authentic: {
    tone: 'success',
    icon: <CheckIcon size={22} />,
    title: 'Authentic product',
    body: 'This QR code matches an OriginHash record.',
  },
  recorded: {
    tone: 'success',
    icon: <CheckIcon size={22} />,
    title: 'Scan recorded',
    body: 'This product has been added to your scan history.',
  },
  notfound: {
    tone: 'danger',
    icon: <CrossIcon size={22} />,
    title: 'Code not recognised',
    body: "This code isn't in OriginHash records, so the product may not be genuine.",
  },
  invalid: {
    tone: 'danger',
    icon: <CrossIcon size={22} />,
    title: 'Not an OriginHash QR',
    body: "This QR code doesn't belong to an OriginHash product sticker.",
  },
  error: {
    tone: 'warning',
    icon: <AlertIcon size={22} />,
    title: "Couldn't check this code",
    body: 'Check your internet connection and try again.',
  },
};

const cameraErrorState = (err) => {
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') return 'denied';
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') return 'nocamera';
  if (err?.name === 'NotReadableError') return 'busy';
  return 'error';
};

const Scan = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'verify' ? 'verify' : 'record';

  const [camera, setCamera] = useState('starting');
  const [mirrored, setMirrored] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [frozen, setFrozen] = useState(null); // null | 'camera' | 'photo' — what the snapshot shows
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [codeFormOpen, setCodeFormOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const videoRef = useRef(null);
  const snapshotRef = useRef(null);
  const fileInputRef = useRef(null);
  const scanAgainRef = useRef(null);
  const workCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const decoderRef = useRef(null);
  // Bumped on every camera start/stop and every code check, so async work from a
  // superseded session (or an unmounted page) can tell it's stale and bail out.
  const sessionRef = useRef(0);
  const checkRef = useRef(0);
  const resumeOnShowRef = useRef(false);
  const repeatGuardRef = useRef({ raw: null, until: 0 });
  const modeRef = useRef(mode);
  modeRef.current = mode;

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
        handleScanned(text, canvas);
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

  const finish = (next) => {
    setChecking(false);
    setResult(next);
    // A network failure isn't a verdict on the product, so it stays out of the history.
    if (next.status === 'error') return;
    recordScan(user?.id, {
      mode: modeRef.current,
      ok: next.status === 'authentic' || next.status === 'recorded',
      code: next.code || null,
      productName: next.data?.productName || null,
      variantSize: next.data?.variantSize || null,
    });
  };

  const checkCode = async (code) => {
    const check = ++checkRef.current;
    setResult(null);
    setChecking(true);
    try {
      const { data } = await api.get(`/qr-stickers/verify/${encodeURIComponent(code)}`);
      if (check !== checkRef.current) return;
      finish({ status: modeRef.current === 'verify' ? 'authentic' : 'recorded', code, data });
    } catch (err) {
      if (check !== checkRef.current) return;
      finish({ status: err.response?.status === 404 ? 'notfound' : 'error', code });
    }
  };

  // Freeze the frame the code was read from, turn the camera off, then look the code up.
  const handleScanned = (raw, sourceCanvas, source = 'camera') => {
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

    const code = extractCode(raw);
    if (code) checkCode(code);
    else finish({ status: 'invalid' });
  };

  const scanAgain = () => {
    checkRef.current += 1;
    repeatGuardRef.current.until = Date.now() + RESCAN_COOLDOWN_MS;
    setResult(null);
    setChecking(false);
    setFrozen(null);
    setPhotoError('');
    startCamera();
  };

  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/home');
  };

  const setMode = (next) => {
    setSearchParams(next === 'record' ? {} : { mode: next }, { replace: true });
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
    handleScanned(text, canvas, 'photo');
  };

  const submitCode = (e) => {
    e.preventDefault();
    const code = extractCode(manualCode);
    if (!code) {
      setCodeError('Enter the code printed on the sticker, e.g. DURGA-GHEE-00012.');
      return;
    }
    setCodeError('');
    setFrozen(null);
    stopCamera();
    checkCode(code);
  };

  useEffect(() => {
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
      document.removeEventListener('visibilitychange', onVisibility);
      checkRef.current += 1;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!result) return undefined;
    scanAgainRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') scanAgain();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const cameraMessage = CAMERA_MESSAGES[camera];
  const resultCopy = result && RESULTS[result.status];
  const modeCopy = MODES[mode];

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
            <h1 className="oh-scan-title">Scan QR code</h1>
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

          <p className="oh-scan-hint">Place the QR code within the frame to scan</p>

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

            {checking && (
              <div className="oh-scan-overlay">
                <span className="oh-scan-spinner" />
                <div className="oh-scan-overlay-title">Checking code…</div>
              </div>
            )}

            {!checking && resultCopy && (
              <div className="oh-scan-overlay">
                <span className={`oh-scan-verdict ${resultCopy.tone}`}>{resultCopy.icon}</span>
              </div>
            )}

            {!checking && !result && camera !== 'live' && (
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
                {camera === 'idle' && !frozen && (
                  <button type="button" className="oh-scan-retry" onClick={scanAgain}>
                    Start camera
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="oh-scan-modes" role="group" aria-label="What should this scan do?">
            {Object.entries(MODES).map(([key, m]) => (
              <button
                key={key}
                type="button"
                className={`oh-scan-mode ${mode === key ? 'active' : ''}`}
                aria-pressed={mode === key}
                onClick={() => setMode(key)}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        </section>

        <aside className="oh-scan-side">
          {!result && (
            <div className="oh-scan-card oh-scan-howto">
              <div className="oh-scan-card-label">How it works</div>
              <h2 className="oh-scan-card-title">{modeCopy.title}</h2>
              <ol className="oh-scan-steps">
                {modeCopy.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {result && resultCopy && (
            <div className="oh-scan-result-layer">
              <div className="oh-scan-result-backdrop" onClick={scanAgain} aria-hidden="true" />
              <article className={`oh-scan-result ${resultCopy.tone}`} role="status" aria-live="polite">
                <div className="oh-scan-result-head">
                  <span className="oh-scan-result-icon">{resultCopy.icon}</span>
                  <div>
                    <h2 className="oh-scan-result-title">{resultCopy.title}</h2>
                    <p className="oh-scan-result-body">{resultCopy.body}</p>
                  </div>
                </div>

                {result.data ? (
                  <div className="oh-scan-product">
                    {result.data.imageUrl && (
                      <img className="oh-scan-product-image" src={result.data.imageUrl} alt={result.data.productName} />
                    )}
                    <div className="oh-scan-product-body">
                      <div className="oh-scan-product-producer">{result.data.producer}</div>
                      <div className="oh-scan-product-name">{result.data.productName}</div>
                      {result.data.variantSize && (
                        <div className="oh-scan-product-variant">{result.data.variantSize}</div>
                      )}
                      <dl className="oh-scan-product-meta">
                        <div>
                          <dt>Batch</dt>
                          <dd>{result.data.batchNo}</dd>
                        </div>
                        <div>
                          <dt>Code</dt>
                          <dd>{result.data.code}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                ) : (
                  result.code && (
                    <div className="oh-scan-result-code">
                      Code <strong>{result.code}</strong>
                    </div>
                  )
                )}

                <div className="oh-scan-result-actions">
                  {result.status === 'error' && (
                    <button type="button" className="oh-scan-btn secondary" onClick={() => checkCode(result.code)}>
                      Try again
                    </button>
                  )}
                  <button ref={scanAgainRef} type="button" className="oh-scan-btn primary" onClick={scanAgain}>
                    Scan another
                  </button>
                  <Link to="/home" className="oh-scan-btn secondary">
                    Back to home
                  </Link>
                </div>
              </article>
            </div>
          )}

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
                    placeholder="e.g. DURGA-GHEE-00012"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    autoFocus
                  />
                  <button type="submit" className="oh-scan-btn primary" disabled={!manualCode.trim() || checking}>
                    Check
                  </button>
                </div>
                {codeError && <p className="oh-scan-alt-error">{codeError}</p>}
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Scan;
