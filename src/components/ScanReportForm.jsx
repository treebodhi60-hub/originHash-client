import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import CameraCapture from './CameraCapture.jsx';
import { CameraIcon, CrossIcon, FlagIcon, ImageIcon } from './ScanIcons.jsx';
import { shrinkPhoto } from '../utils/photo';
import { Spinner } from './Loader.jsx';

const NOTE_MAX = 1000;

// Phones and tablets open their own camera app from a file input with `capture`; laptops ignore
// `capture`, so they get the in-app webcam view instead.
const hasNativeCamera = () => window.matchMedia?.('(pointer: coarse)').matches ?? false;

// "Take photo" / "Upload from gallery" + "Describe the issue" + "Submit report". Both fields are
// optional; the report is sent to POST /scans/:id/report and the saved { scan, product, report }
// handed to onReported.
const ScanReportForm = ({ scanId, placeholder, onReported }) => {
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const busy = preparing || sending;

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const acceptPhoto = async (file) => {
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      setError('Please choose a photo (JPG, PNG or similar).');
      return;
    }
    setError('');
    setPreparing(true);
    const ready = await shrinkPhoto(file);
    setPreparing(false);
    setPhoto(ready);
    setPreview(URL.createObjectURL(ready));
  };

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    acceptPhoto(file);
  };

  const takePhoto = () => {
    if (hasNativeCamera()) cameraInputRef.current?.click();
    else setWebcamOpen(true);
  };

  const openGallery = () => galleryInputRef.current?.click();

  const dropPhoto = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!busy) acceptPhoto(e.dataTransfer.files?.[0]);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPreview('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError('');

    const form = new FormData();
    if (note.trim()) form.append('note', note.trim());
    if (photo) form.append('photo', photo, photo.name || 'report.jpg');

    try {
      const { data } = await api.post(`/scans/${scanId}/report`, form);
      onReported(data);
    } catch (err) {
      setSending(false);
      setError(err.response?.data?.message || "Couldn't send your report. Check your connection and try again.");
    }
  };

  return (
    <form className="oh-report-form" onSubmit={submit}>
      <div className="oh-report-field">
        <span className="oh-report-label">
          Photo <em>(optional)</em>
        </span>
        {preview ? (
          <div className="oh-report-photo">
            <img src={preview} alt="Your photo of the product" />
            <button type="button" onClick={removePhoto} aria-label="Remove photo" disabled={sending}>
              <CrossIcon size={14} />
            </button>
          </div>
        ) : preparing ? (
          <div className="oh-report-preparing" role="status">
            <Spinner className="solo" />
            Preparing photo…
          </div>
        ) : (
          <div
            className={`oh-report-picks ${dragging ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={dropPhoto}
          >
            <button type="button" className="oh-report-pick" onClick={takePhoto} disabled={busy}>
              <span className="oh-report-pick-icon">
                <CameraIcon size={20} />
              </span>
              <span className="oh-report-pick-text">
                <strong>Take photo</strong>
                <small>Open the camera</small>
              </span>
            </button>
            <button type="button" className="oh-report-pick" onClick={openGallery} disabled={busy}>
              <span className="oh-report-pick-icon">
                <ImageIcon size={20} />
              </span>
              <span className="oh-report-pick-text">
                <strong>Upload photo</strong>
                <small>Gallery or files</small>
              </span>
            </button>
          </div>
        )}
        {/* `capture` opens the rear camera directly on phones; the gallery input has none, so it opens the photo library. */}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={pickPhoto} />
        <input ref={galleryInputRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
      </div>

      {webcamOpen && (
        <CameraCapture
          onCapture={(file) => {
            setWebcamOpen(false);
            acceptPhoto(file);
          }}
          onClose={() => setWebcamOpen(false)}
          onUseGallery={() => {
            setWebcamOpen(false);
            openGallery();
          }}
        />
      )}

      <label className="oh-report-field">
        <span className="oh-report-label">
          Describe the issue <em>(optional)</em>
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={placeholder}
          maxLength={NOTE_MAX}
          rows={3}
          disabled={sending}
        />
      </label>

      {error && (
        <p className="oh-verify-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="oh-report-submit" disabled={busy}>
        {sending ? <Spinner className="solo" /> : <FlagIcon size={16} />}
        {sending ? 'Sending report…' : 'Submit report'}
      </button>
    </form>
  );
};

export default ScanReportForm;
