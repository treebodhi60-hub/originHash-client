import { useEffect, useRef, useState } from 'react';
import { CameraIcon, CrossIcon, ImageIcon } from './ScanIcons.jsx';
import { Spinner } from './Loader.jsx';

const errorMessage = (err) => {
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
    return 'Camera access is blocked. Allow the camera in your browser’s site settings, or upload a photo instead.';
  }
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
    return 'No camera was found on this device. Upload a photo instead.';
  }
  if (err?.name === 'NotReadableError') {
    return 'The camera is being used by another app. Close it and try again, or upload a photo instead.';
  }
  return 'The camera could not be started. Upload a photo instead.';
};

// In-app camera for devices without a native camera picker (laptops / desktops): a live preview
// with a shutter button. Hands the captured frame to onCapture as a JPEG File.
const CameraCapture = ({ onCapture, onClose, onUseGallery }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const shutterRef = useRef(null);
  const [state, setState] = useState('starting'); // starting | live | error
  const [error, setError] = useState('');
  const [mirrored, setMirrored] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This browser can’t open the camera. Upload a photo instead.');
        setState('error');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        // Webcams face the user, so mirror the preview like a video call (the photo itself isn't mirrored).
        const { facingMode } = stream.getVideoTracks()[0]?.getSettings?.() || {};
        setMirrored(facingMode !== 'environment');
        setState('live');
      } catch (err) {
        if (!cancelled) {
          setError(errorMessage(err));
          setState('error');
        }
      }
    };

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (state === 'live') shutterRef.current?.focus();
  }, [state]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => blob && onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })),
      'image/jpeg',
      0.9
    );
  };

  return (
    <div className="oh-capture-backdrop" role="dialog" aria-modal="true" aria-label="Take a photo" onClick={onClose}>
      <div className="oh-capture" onClick={(e) => e.stopPropagation()}>
        <header className="oh-capture-head">
          <span>Take a photo of the product</span>
          <button type="button" className="oh-capture-close" onClick={onClose} aria-label="Close camera">
            <CrossIcon size={16} />
          </button>
        </header>

        <div className="oh-capture-stage">
          <video ref={videoRef} playsInline muted className={mirrored ? 'mirrored' : undefined} />
          {state === 'starting' && (
            <div className="oh-capture-overlay">
              <Spinner className="solo" />
              Starting camera…
            </div>
          )}
          {state === 'error' && (
            <div className="oh-capture-overlay error">
              <CameraIcon size={28} />
              <p>{error}</p>
            </div>
          )}
        </div>

        <footer className="oh-capture-actions">
          <button type="button" className="oh-capture-secondary" onClick={onUseGallery}>
            <ImageIcon size={16} />
            Upload instead
          </button>
          <button
            ref={shutterRef}
            type="button"
            className="oh-capture-shutter"
            onClick={capture}
            disabled={state !== 'live'}
            aria-label="Capture photo"
          >
            <span />
          </button>
          <span className="oh-capture-spacer" aria-hidden="true" />
        </footer>
      </div>
    </div>
  );
};

export default CameraCapture;
