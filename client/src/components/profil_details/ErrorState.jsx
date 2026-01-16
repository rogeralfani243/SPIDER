import React from 'react';
import '../../styles/profiles/loading_error.css'
const ErrorState = ({ error, onRetry, navigate }) => {
  return (
    <div className="profile-detail-page">
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>Unable to Load Profile</h2>
        <p className="error-message">{error}</p>
        <div className="error-actions">
          <button onClick={() => navigate(-1)} className="back-button">
            Go Back
          </button>
          <button onClick={onRetry} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;