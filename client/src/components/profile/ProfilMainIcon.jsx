import React, { useState, useRef, useEffect } from 'react';
import '../../styles/ProfilIcon.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import API_URL from '../../hooks/useApiUrl';
import ProfileModif from './ProfilModif';
const ProfileIcon = () => {
  const { logout, user, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const profileRef = useRef(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const navigate = useNavigate()
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleCloseProfileEdit = () => {
    setShowProfileEdit(false);
  };
  // Charger les données du profil
  useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/api/my-profile-id/`, {
            headers: {
              'Authorization': `Token ${token}`,
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const profileId = data.profile_id;
            
            // Récupérer les données complètes du profil
            const profileResponse = await fetch(`${API_URL}/api/profile/${profileId}/`, {
              headers: {
                'Authorization': `Token ${token}`,
              }
            });
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              setProfileData(profileData);
            }
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
        }
      }
    };

    fetchProfileData();
  }, [user]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
const handleMenyClickProfil = () => {
  navigate('/dashboard/')
}
  const handleMenuClick = (action) => {
setShowProfileEdit(true)
    console.log(`Action : ${action}`);
  };

  // Construire l'URL complète de l'image
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}/${imagePath}`;
  };

  const profileImageUrl = profileData?.image ? getImageUrl(profileData.image) : null;

  return (
    <div className="profile-container" ref={profileRef}>
      {/* Icône de profil avec image réelle */}
      <button
        className="profile-icon-button"
        onClick={toggleMenu}
        aria-label="Menu profil"
        aria-expanded={isMenuOpen}
      >
        {profileImageUrl ? (
          <img 
            src={profileImageUrl} 
            alt="Profile" 
            className="profile-image"
            onError={(e) => {
              // Si l'image ne charge pas, utiliser les initiales
              e.target.style.display = 'none';
            }}
          />
        ) : null}
        
        {/* Fallback avec initiales */}
        <div className="profile-icon-default" style={{ display: profileImageUrl ? 'none' : 'flex' }}>
          <span>{user?.username?.charAt(0)?.toUpperCase() || 'U'}</span>
        </div>
      </button>

      {/* Menu déroulant */}
      {isMenuOpen && (
        <div className="profile-menu">
          <div className="profile-menu-header">
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt="Profile" 
                className="header-profile-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              onClick={() => handleMenuClick('profile')}/>
            ) : null}
            
            {/* Fallback pour le header */}
            <div className="header-icon-default" style={{ display: profileImageUrl ? 'none' : 'flex' }}>
              <span>{user?.username?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            
            <div className="user-info">
              <span className="user-name">
                {loading
                  ? 'Chargement...'
                  : user
                  ? user.username
                  : 'Invité'}
              </span>
              <span className="user-email">
                {user?.email || 'Aucun email'}
              </span>
              {profileData?.bio && (
                <span className="user-bio">
                  {profileData.bio.length > 50 
                    ? `${profileData.bio.substring(0, 50)}...` 
                    : profileData.bio}
                </span>
              )}
            </div>
          </div>

          <div className="menu-items">
<button className="menu-item" onClick={() => handleMenyClickProfil()}>
  <span>My Dashboard</span>
</button>


<div className="menu-divider"></div>

<button
  className="menu-item logout"
  onClick={() => {
    logout();
    window.location.reload();
  }}
>
  <span>Logout</span>
</button>
          </div>
        </div>
      )}
            {/* Modal d'édition de profil */}
      {showProfileEdit && (
        <ProfileModif 
          open={showProfileEdit}
          onClose={handleCloseProfileEdit}
        />
      )}
      
    </div>
  );
};

export default ProfileIcon;