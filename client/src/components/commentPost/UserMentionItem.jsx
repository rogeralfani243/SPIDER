import React from 'react';

const UserMentionItem = ({ 
  user, 
  isSelected = false, 
  onClick, 
  onMouseEnter 
}) => {
  const handleClick = () => {
    if (onClick) onClick(user);
  };

  const handleMouseEnter = () => {
    if (onMouseEnter) onMouseEnter();
  };

  // Fonction pour construire l'URL complète de la photo de profil
  const getProfilePictureUrl = () => {
    if (!user.profile_picture) return null;
    
    // Si l'URL est déjà complète (commence par http)
    if (user.profile_picture.startsWith('http')) {
      return user.profile_picture;
    }
    
    // Si c'est un chemin relatif, ajouter le domaine
    // Remplace API_URL par l'URL de base de ton backend
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    
    // Supprimer le slash initial s'il y en a un
    const cleanPath = user.profile_picture.startsWith('/') 
      ? user.profile_picture.substring(1) 
      : user.profile_picture;
    
    return `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };

  // Gestion des erreurs de chargement d'image
  const handleImageError = (e) => {
    console.error('Failed to load profile picture:', user.profile_picture);
    e.target.style.display = 'none';
    const fallback = e.target.nextElementSibling;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  // Gestion du succès de chargement
  const handleImageLoad = (e) => {
    console.log('Profile picture loaded successfully:', user.profile_picture);
    const fallback = e.target.nextElementSibling;
    if (fallback) {
      fallback.style.display = 'none';
    }
  };

  const profilePictureUrl = getProfilePictureUrl();

  return (
    <div
      className={`mention-user-items ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      role="button"
      tabIndex={0}
    >
      <div className="mention-user-avatar">
        {profilePictureUrl ? (
          <>
            <img 
              src={profilePictureUrl}
              alt={user.username}
              className="mention-avatar-img"
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
            <div 
              className="mention-avatar-fallback"
              style={{ display: 'none' }}
            >
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </>
        ) : (
          <div className="mention-avatar-fallback">
            {user.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
      
      <div className="mention-user-details">
        <div className="mention-user-header">
          <span className="mention-username">
            @{user.username}
          </span>
        </div>
        
        {user.full_name && (
          <div className="mention-user-fullname">
            {user.full_name}
          </div>
        )}
        
        {user.email && (
          <div className="mention-user-email">
            {user.email}
          </div>
        )}
      </div>
      
      {isSelected && (
        <div className="mention-selection-indicator">
          <span className="indicator-icon">→</span>
        </div>
      )}
    </div>
  );
};

export default UserMentionItem;