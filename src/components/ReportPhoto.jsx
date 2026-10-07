import { useEffect, useState } from 'react';
import { ImageIcon } from './ScanIcons.jsx';

// The photo attached to a scan report. Its URL is a time-limited signed link, so if it fails
// (expired, offline) show a clear placeholder rather than a broken image; tap opens it full size.
const ReportPhoto = ({ url, alt }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  if (failed) {
    return (
      <div className="oh-result-report-photo-missing" role="status">
        <ImageIcon size={18} />
        The photo couldn’t be loaded. Refresh the page to try again.
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="oh-result-report-photo" title="Open full size">
      <img src={url} alt={alt} loading="lazy" onError={() => setFailed(true)} />
    </a>
  );
};

export default ReportPhoto;
