// src/components/shared/Alert.jsx
import React from 'react';
import PropTypes from 'prop-types';

const Alert = ({ type, message, onRetry = null }) => {
  const icons = {
    warning: 'fa-exclamation-triangle',
    error: 'fa-exclamation-circle',
    success: 'fa-check-circle',
    info: 'fa-info-circle'
  };

  return (
    <div className={`alert alert-${type}`}>
      <i className={`fas ${icons[type]}`}></i>
      <span>{message}</span>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="btn-retry"
          style={{ marginLeft: '10px', padding: '5px 10px' }}
        >
          Retry
        </button>
      )}
    </div>
  );
};

Alert.propTypes = {
  type: PropTypes.oneOf(['warning', 'error', 'success', 'info']).isRequired,
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func
};

export default Alert;