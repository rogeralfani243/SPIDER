// components/ResultCard.jsx
import React from 'react';

const ResultCard = ({ children, type, onClick, className = '' }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  return (
    <div 
      className={`result-card ${type} ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {children}
    </div>
  );
};

export default ResultCard;