import React from 'react';
import '../../styles/profil_avatar.css'
const ProfileAvatar = ({ profile, isTop100, top100Rank }) => {
  console.log('📸 Profile data in ProfileAvatar:', profile); // Debug

  const getInitials = (profile) => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    } else if (profile.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    } else if (profile.last_name) {
      return profile.last_name.charAt(0).toUpperCase();
    } else {
      return profile.username.substring(0, 2).toUpperCase();
    }
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="profile-avatar-section">
      {/* Image de fond (image_bio) */}
      {profile.image_bio && (
     <img 
              src={profile.image_bio} 
              alt={`Profile of ${profile.first_name || profile.username}`}
              className="profile-image-bio"
              onError={(e) => {
                console.log('❌ Image load failed, showing initials');
                e.target.style.display = 'none';
                const fallback = e.target.nextSibling;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
      )}
      
      {/* Overlay pour lisibilité */}
      {profile.image && (
        <div className="bio-overlay" />
      )}
      
      {/* Contenu principal */}
      <div className="avatar-content-wrapper">
        
        {/* Avatar (image) */}
        <div className="avatar-wrapper">
          {profile.image ? (
            <img 
              src={profile.image} 
              alt={`Profile of ${profile.first_name || profile.username}`}
              className="profile-detail-image"
              onError={(e) => {
                console.log('❌ Image load failed, showing initials');
                e.target.style.display = 'none';
                const fallback = e.target.nextSibling;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
          ) : null}
          
          {/* Fallback aux initiales */}
          <div 
            className="profile-detail-initials"
            style={{ 
              backgroundColor: getAvatarColor(profile.first_name || profile.last_name || profile.username),
              display: profile.image ? 'none' : 'flex'
            }}
          >
            {getInitials(profile)}
          </div>
        </div>

        {/* Badge Top 100 */}
        {isTop100 && (
          <div className="top100-badge">
            <span className="badge-icon">🏆</span>
            <span className="badge-text">
              Top {top100Rank} Professional
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileAvatar;