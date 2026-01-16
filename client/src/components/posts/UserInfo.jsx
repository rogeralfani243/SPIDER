 import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import URL from '../../hooks/useUrl';

const UserInfo = ({ 
  userName, 
  createdAt, 
  profileImage,
  profileId,
  userId // Ajout du userId pour la navigation
}) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const { postId } = useParams(); // Récupère les paramètres actuels de l'URL
 const [isLoading, setIsLoading] = useState(false);
  // Construire l'URL complète de l'image de profil
  const getProfileImageUrl = () => {
    if (!profileImage || imageError) return null;
    
    console.log('🖼️ Original profileImage:', profileImage);
    
    // Si l'image commence déjà par http, c'est une URL complète
    if (profileImage.startsWith('http')) {
      return profileImage;
    }
    
    // Si c'est un chemin absolu (commence par /)
    if (profileImage.startsWith('/')) {
      const url = `${URL}${profileImage}`;
      console.log('🔗 Built profile image URL:', url);
      return url;
    }
    
    // Si c'est un chemin relatif
    const url = `${URL}/${profileImage}`;
    console.log('🔗 Built relative profile image URL:', url);
    return url;
  };

  // Navigation vers le profil utilisateur
  const handleProfileClick = (e) => {
     if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Utiliser profileId si disponible, sinon userId
    const targetId = profileId || userId;
    
    if (!targetId) {
      console.warn('⚠️ No ID available for profile navigation');
      return;
    }
    
    console.log('🖱️ Navigating to profile:', {
      userId,
      profileId,
      targetId,
      userName
    });
    
    setIsLoading(true);
    
    // Navigation avec le bon ID (profileId si disponible)
    window.location.href = `/profile/${targetId}/`;
    
    setTimeout(() => setIsLoading(false), 300);
    
  };

  // Navigation vers le profil en cliquant sur le nom d'utilisateur
  const handleUsernameClick = () => {
    if (userId) {
      console.log('🖱️ Navigating to user profile via username:', userId);
      navigate(`/user/${userId}/profile`);
    }
  };

  const profileImageUrl = getProfileImageUrl();
  const userInitial = userName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="user-info">
<div className="user-div">
        <div 
        className="user-avatars user-avatar"
        onClick={handleProfileClick}
        style={{ cursor: userId ? 'pointer' : 'default' }}
        title={userId ? `View ${userName}'s profile` : 'User profile'}
      >
        {profileImageUrl ? (
          <img 
            src={profileImageUrl} 
            alt={`${userName || 'User'}'s profile`}
            className="profile-image"
            onError={(e) => {
              console.log('❌ Image failed to load:', profileImageUrl);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('✅ Image loaded successfully:', profileImageUrl);
              setImageError(false);
            }}
          />
        ) : (
          <div className="avatar-fallback">
            {userInitial}
          </div>
        )}
      </div>
      
      <div className="user-details">
        <h3 
          className="usernames"
          onClick={handleProfileClick}
          style={{ cursor: userId ? 'pointer' : 'default' }}
          title={userId ? `View ${userName}'s profile` : 'User profile'}
        >
          @{userName || 'Unknown User'}
        </h3>
       
      </div>
      
</div>
 <p className="post-date">
          {createdAt ? new Date(createdAt).toLocaleString() : 'Unknown date'}
        </p>
    </div>
  );
};

export default UserInfo;