import React from 'react';

const NoComments = ({ loading, hasComments }) => {
  if (loading || hasComments) return null;
  
  return (
    <div className="no-comments">
      <div className="no-comments-icon">💭</div>
      <p className="no-comments-title">No comments yet.</p>
      <p className="no-comments-subtitle">Be the first to share your thoughts!</p>
    </div>
  );
};

export default NoComments;