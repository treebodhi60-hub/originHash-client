import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { CameraIcon, CrossIcon, FlagIcon } from './ScanIcons.jsx';
import { shrinkPhoto } from '../utils/photo';
import { Spinner } from './Loader.jsx';

const NOTE_MAX = 1000;

// "Take a pic" + "Describe the issue" + "Submit report". Both fields are optional; the report
// is sent to POST /scans/:id/report and the saved { scan, product, report } handed to onReported.
const ScanReportForm = ({ scanId, placeholder, onReported }) => {
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setPreparing(true);
    const ready = await shrinkPhoto(file);
    setPreparing(false);
    setPhoto(ready);
    setPreview(URL.createObjectURL(ready));
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
        ) : (
          <button
            type="button"
            className="oh-report-pick"
            onClick={() => fileInputRef.current?.click()}
            disabled={preparing || sending}
          >
            {preparing ? <Spinner className="solo" /> : <CameraIcon size={18} />}
            {preparing ? 'Preparing photo…' : 'Take a pic or upload'}
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
      </div>

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

      <button type="submit" className="oh-report-submit" disabled={sending || preparing}>
        {sending ? <Spinner className="solo" /> : <FlagIcon size={16} />}
        {sending ? 'Sending report…' : 'Submit report'}
      </button>
    </form>
  );
};

export default ScanReportForm;
