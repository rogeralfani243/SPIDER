// FollowButton.jsx
import React from 'react';

const FollowButton = ({ isFollowing, loading, onFollowToggle }) => {
  return (
    <button
      className={`follow-btn ${isFollowing ? 'following' : ''} ${loading ? 'loading' : ''}`}
      onClick={onFollowToggle}
      disabled={loading}
      style={{width:'75%', maxWidth:'auto'}}
    >
      {loading ? '...' : isFollowing ? 'Subscribed' : 'Follow'}
    </button>
  );
};

export default FollowButton;