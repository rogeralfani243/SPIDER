import React from 'react';

const CommentsLoading = ({ loading }) => {
  if (!loading) return null;
  
  return (
    <div className="comments-loading">
      <div className="loading-spinner"></div>
      <span className="loading-text">Loading comments...</span>
    </div>
  );
};

export default CommentsLoading;