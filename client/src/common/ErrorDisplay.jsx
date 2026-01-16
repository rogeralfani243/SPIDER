import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';

const ErrorDisplay = ({ error, message, onBack }) => {
  return (
    <div className="error-container">
      <div className="error-content">
        <h3 className="error-title">{error}</h3>
        {message && <p className="error-message">{message}</p>}
      </div>
      <button onClick={onBack} className="back-button">
        <FaArrowLeft /> Go Back
      </button>
    </div>
  );
};

export default ErrorDisplay;