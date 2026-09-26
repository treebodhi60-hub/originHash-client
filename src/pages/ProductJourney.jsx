import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import JourneySection, { hasPlaceNames } from '../components/JourneySection.jsx';
import { ArrowLeftIcon } from '../components/ScanIcons.jsx';
import '../styles/app-shell.css';
import '../styles/scan.css';
import '../styles/history.css';

// A sticker's complete journey, opened from the QR stickers list by its QR ID. The server only
// allows this for admins and the user who generated the sticker's batch.
const ProductJourney = () => {
  const { uuid } = useParams();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api
      .get(`/scans/journey/${uuid}`)
      .then(({ data: body }) => {
        if (cancelled) return;
        setData(body);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        const code = err.response?.status;
        setStatus(code === 404 ? 'missing' : code === 403 ? 'forbidden' : 'failed');
      });
    return () => {
      cancelled = true;
    };
  }, [uuid]);

  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate(user?.isAdmin ? '/admin/qr-stickers' : '/qr-stickers', { replace: true });
  };

  return (
    <div className="oh-result-page oh-details-page">
      <div className="oh-result-shell">
        <header className="oh-result-head">
          <button type="button" className="oh-scan-icon-btn" onClick={goBack} aria-label="Back">
            <ArrowLeftIcon size={20} />
          </button>
          <h1 className="oh-result-title">Product journey</h1>
          <span className="oh-scan-icon-spacer" />
        </header>

        <div className="oh-result-body oh-details-body">
          {status === 'loading' && <div className="oh-history-empty">Loading…</div>}
          {status === 'missing' && <div className="oh-history-empty">This sticker wasn't found.</div>}
          {status === 'forbidden' && (
            <div className="oh-history-empty">
              Only the person who generated this sticker's batch and OriginHash admins can see its full journey.
            </div>
          )}
          {status === 'failed' && <div className="oh-history-empty">Couldn't load this journey. Please try again later.</div>}

          {status === 'ready' && (
            <>
              <JourneySection {...data} />
              <dl className="oh-details-ids">
                <div>
                  <dt>QR ID</dt>
                  <dd>{data.qrCodeUuid}</dd>
                </div>
              </dl>
              {hasPlaceNames(data) && <p className="oh-details-attribution">Place names © OpenStreetMap contributors</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductJourney;
