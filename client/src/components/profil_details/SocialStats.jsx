// SocialStats.jsx
import React from 'react';

const SocialStats = ({ followersCount, followingCount, onShowFollowers, onShowFollowing }) => {
  return (
    <div className="social-stats">
      <div 
        className="stat-item clickable"
        onClick={onShowFollowers}
      >
        <span className="stat-number">
          {followersCount}
        </span>
        <span className="stat-label-profile">Followers</span>
      </div>
      
      <div 
        className="stat-item clickable"
        onClick={onShowFollowing}
      >
        <span className="stat-number">
          {followingCount}
        </span>
        <span className="stat-label-profile">Following</span>
      </div>
    </div>
  );
};

export default SocialStats;