import '../styles/auth.css';

const BrandPanel = () => (
  <div className="oh-brand-panel">
    <div className="oh-brand-badge">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2c-2.2 0-4 1.8-4 4v1H7a1 1 0 0 0 0 2h1v2H7a1 1 0 0 0 0 2h1v1c0 2.2 1.8 4 4 4s4-1.8 4-4v-1h1a1 1 0 1 0 0-2h-1V9h1a1 1 0 1 0 0-2h-1V6c0-2.2-1.8-4-4-4Zm-2 4c0-1.1.9-2 2-2s2 .9 2 2v1h-4V6Zm4 5v2h-4v-2h4Zm0 4v1c0 1.1-.9 2-2 2s-2-.9-2-2v-1h4Z"
          fill="var(--oh-gold)"
        />
      </svg>
    </div>
    <h1 className="oh-brand-title">
      ORIGIN<span>HASH</span>
    </h1>
    <p className="oh-brand-tagline">From molecule to market</p>
    <p className="oh-brand-motto">VERIFY &middot; TRUST &middot; TRANSACT</p>
    <div className="oh-brand-dots">
      <span />
      <span />
      <span />
    </div>
    <p className="oh-brand-footnote">Securing India&rsquo;s supply chains &middot; v1.0</p>
  </div>
);

export default BrandPanel;
