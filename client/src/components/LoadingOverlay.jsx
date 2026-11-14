export default function LoadingOverlay({ label = 'Loading…' }) {
  return (
    <div className="loader-overlay" role="status" aria-live="polite">
      <div className="loader-panel">
        <div className="plane-loader" aria-hidden>
          <div className="plane-loader-sky">
            <span className="plane-cloud c1" />
            <span className="plane-cloud c2" />
            <span className="plane-cloud c3" />
            <svg className="plane-loader-icon" viewBox="0 0 64 64" width="42" height="42">
              <path
                d="M8 34h28l8-12h6l-4 12h6l4 4H46l-2 10H38l2-10H8l4-4Z"
                fill="#142B4A"
              />
              <path d="M36 22l10 4-6 2 1 6-4-4-6 1 5-9Z" fill="#C5A15B" />
            </svg>
            <span className="plane-trail" />
          </div>
        </div>
        <p className="loader-label">{label}</p>
        <div className="loader-dots" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
