import React from 'react';

const ErrorMessage = ({ error, onClose }) => {
  if (!error) return null;
  
  return (
    <div className="comments-error">
      <span className="error-text">{error}</span>
      <button 
        className="error-close-btn"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
};

export default ErrorMessage;