import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import '../styles/verify.css';

const Verify = () => {
  const { code } = useParams();
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api
      .get(`/qr-stickers/verify/${encodeURIComponent(code)}`)
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
          setStatus('success');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="ov-page">
      {status === 'loading' && <div className="ov-message">Loading…</div>}

      {status === 'error' && (
        <div className="ov-card">
          <div className="ov-error-icon">✕</div>
          <h1 className="ov-title">Code not found</h1>
          <p className="ov-subtitle">This QR code isn't recognised. It may have been removed.</p>
        </div>
      )}

      {status === 'success' && data && (
        <div className="ov-card">
          <img className="ov-image" src={data.imageUrl} alt={data.productName} />
          <div className="ov-body">
            <div className="ov-producer">{data.producer}</div>
            <h1 className="ov-title">{data.productName}</h1>
            {data.variantSize && <p className="ov-subtitle">{data.variantSize}</p>}
            <div className="ov-meta">
              <span>Batch {data.batchNo}</span>
              <span className="ov-code">{data.code}</span>
            </div>
          </div>
          <div className="ov-footer">Verified by ORIGINHASH</div>
        </div>
      )}
    </div>
  );
};

export default Verify;
