// Stickers link to `<app>/verify/<CODE>`. A bare code (typed in, or a QR that only
// holds the code) resolves the same way.
const CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{2,59}$/;

export const extractCode = (raw) => {
  const text = (raw || '').trim();
  if (!text) return null;

  if (/^https?:\/\//i.test(text)) {
    try {
      const match = new URL(text).pathname.match(/\/verify\/([^/]+)\/?$/);
      return match ? decodeURIComponent(match[1]).toUpperCase() : null;
    } catch {
      return null;
    }
  }

  const code = text.toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
};

// Downscale before decoding — a sticker-sized QR doesn't need full resolution,
// and it keeps the jsQR fallback fast on low-end phones.
export const drawToCanvas = (source, width, height, canvas, maxPx) => {
  const scale = Math.min(1, maxPx / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  canvas.getContext('2d', { willReadFrequently: true }).drawImage(source, 0, 0, w, h);
};

// Resolves to `(canvas, { thorough }) => Promise<string | null>`. Uses the browser's
// native BarcodeDetector where it exists (Chrome on Android/macOS), otherwise jsQR —
// loaded on demand so it only ships to people who open the scanner.
export const createQrDecoder = async () => {
  if ('BarcodeDetector' in window) {
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats();
      if (formats.includes('qr_code')) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        return async (canvas) => {
          const [hit] = await detector.detect(canvas);
          return hit?.rawValue || null;
        };
      }
    } catch {
      // Fall through to jsQR.
    }
  }

  const { default: jsQR } = await import('jsqr');
  return async (canvas, { thorough = false } = {}) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hit = jsQR(data, width, height, { inversionAttempts: thorough ? 'attemptBoth' : 'dontInvert' });
    return hit?.data || null;
  };
};
