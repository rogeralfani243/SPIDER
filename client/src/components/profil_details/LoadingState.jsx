import React from 'react';

const LoadingState = () => {
  return (
    <div className="profile-detail-page">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    </div>
  );
};

export default LoadingState;