// components/feedback/ReviewerAvatar.jsx
import React from 'react';
import { getAvatarColor } from '../../utils/helpers';

/**
 * Avatar component for displaying reviewer's image or initials
 */
const ReviewerAvatar = ({ userImage, userName, className = '' }) => {
  const handleImageError = (e) => {
    console.error(`Image failed to load: ${userImage}`);
    e.target.style.display = 'none';
    const initialsDiv = e.target.parentElement.querySelector('.reviewer-initials');
    if (initialsDiv) {
      initialsDiv.style.display = 'flex';
    }
  };

  return (
    <div className={`reviewer-avatar ${className}`}>
      {userImage ? (
        <img 
          src={userImage} 
          alt={userName}
          className="reviewer-image"
          onError={handleImageError}
        />
      ) : null}
      
      <div 
        className="reviewer-initials"
        style={{ 
          backgroundColor: getAvatarColor(userName),
          display: userImage ? 'none' : 'flex'
        }}
      >
        {userName?.charAt(0)?.toUpperCase() || 'A'}
      </div>
    </div>
  );
};

export default ReviewerAvatar;