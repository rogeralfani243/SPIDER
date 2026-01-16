import React from 'react';
import '../../styles/profiles/profile_header.css'
const ProfileHeader = ({ navigate }) => {
  return (
    <div className="profile-header">
      <button 
        className="back-button"
        onClick={() => navigate(-1)}
        title='go to the previous page'
      >
        ← Back
      </button>
    </div>
  );
};

export default ProfileHeader;