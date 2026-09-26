import '../styles/loader.css';

// Small spinner that takes the surrounding text colour, so it fits any button or message.
// Add className "solo" when it stands without text, "lg" for a bigger one.
export const Spinner = ({ className = '' }) => <span className={`oh-loader ${className}`} aria-hidden="true" />;

// A whole-area loading message (spinner + text). Pass the area's own class to keep its layout.
export const LoadingState = ({ label = 'Loading…', className = 'oh-empty-state' }) => (
  <div className={`${className} oh-loading-row`} role="status" aria-live="polite">
    <Spinner />
    <span>{label}</span>
  </div>
);

// Above a list that is refreshing while its previous contents stay on screen.
export const RefreshingNote = ({ label = 'Updating…' }) => (
  <div className="oh-refreshing" role="status" aria-live="polite">
    <Spinner />
    {label}
  </div>
);
