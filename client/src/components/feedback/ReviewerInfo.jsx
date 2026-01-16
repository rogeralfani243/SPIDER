// components/feedback/ReviewerInfo.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, getRelativeTime } from '../../utils/helpers';

const ReviewerInfo = ({ 
  userName, 
  createdAt, 
  updatedAt, 
  userImage, 
  profile_id 
}) => {
  const navigate = useNavigate();
  const isEdited = updatedAt !== createdAt;

  console.log('🔍 ReviewerInfo - profile_id:', profile_id);
  console.log('🔍 ReviewerInfo - userName:', userName);

  const handleAvatarClick = (e) => {
    console.log('🖱️ Avatar clicked, profile_id:', profile_id);
    e.preventDefault();
    e.stopPropagation();
    
    if (profile_id) {
      console.log('🚀 Navigating to profile:', profile_id);
       window.location.href = `/profile/${profile_id}/`;
    } else {
      console.log('⚠️ No profile_id provided');
    }
  };

  const handleUserNameClick = (e) => {
    console.log('🖱️ Username clicked, profile_id:', profile_id);
    e.preventDefault();
    e.stopPropagation();
    
    if (profile_id) {
      console.log('🚀 Navigating to profile:', profile_id);
       window.location.href = `/profile/${profile_id}`;
    } else {
      console.log('⚠️ No profile_id provided');
    }
  };

  return (
    <div className="reviewer-info">
      <div 
        className="reviewer-avatar"
        onClick={handleAvatarClick}
        style={{ 
          cursor: profile_id ? 'pointer' : 'default',
      
          zIndex: 10
        }}
        title={profile_id ? `View ${userName}'s profile` : ''}
      >
        {userImage ? (
          <img 
            src={userImage} 
            alt={userName}
            className="reviewer-image"
            style={{ 
              pointerEvents: 'auto', // Force les événements de souris
          
              zIndex: 5
            }}
          />
        ) : null}
        
        <div 
          className="reviewer-initials"
          style={{ 
            display: userImage ? 'none' : 'flex',
            cursor: profile_id ? 'pointer' : 'default',
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 5
          }}
        >
          {userName?.charAt(0)?.toUpperCase() || 'A'}
        </div>
      </div>
      
      <div className="reviewer-details">
        <span 
          className="reviewer-name"
          onClick={handleUserNameClick}
          style={{ 
            cursor: profile_id ? 'pointer' : 'default',
         pointerEvents: 'auto',
            zIndex: 10
          }}
          title={profile_id ? `View ${userName}'s profile` : ''}
        >
          {userName}
        </span>
        
        <div className="review-meta">
          <span className="review-date">
            {formatDate(createdAt)}
          </span>
          <span className="review-time">
            ({getRelativeTime(createdAt)})
          </span>
          {isEdited && (
            <span className="edited-badge">(edited)</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewerInfo;