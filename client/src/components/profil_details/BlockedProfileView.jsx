// src/components/profil_details/BlockedProfileView.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/profil_detail.css';

// Import des icônes de différentes bibliothèques populaires
// Choisissez une bibliothèque et installez-la :

// Option 1: Font Awesome (la plus populaire)
// npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLock, 
  faUserSlash, 
  faEyeSlash, 
  faBan,
  faArrowLeft,
  faUsers,
  faHome,
  faUser,
  faIdCard,
  faMessage,
  faEye,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

// Option 2: React Icons (légère et complète)
// npm install react-icons
// import { 
//   FaLock, 
//   FaUserSlash, 
//   FaEyeSlash, 
//   FaBan,
//   FaArrowLeft,
//   FaUsers,
//   FaHome,
//   FaUser,
//   FaIdCard,
//   FaCommentAlt,
//   FaEye,
//   FaInfoCircle
// } from 'react-icons/fa';

// Option 3: Material-UI Icons (si vous utilisez déjà Material-UI)
// npm install @mui/icons-material
// import {
//   Lock,
//   Block,
//   VisibilityOff,
//   DoNotDisturb,
//   ArrowBack,
//   People,
//   Home,
//   Person,
//   Badge,
//   Chat,
//   Visibility,
//   Info
// } from '@mui/icons-material';

const BlockedProfileView = ({ profile, blockData, currentUser, onUnblock, onNavigateHome }) => {
  const navigate = useNavigate();
  
  // Si le profil a des données limitées (retourné par l'API lors d'un blocage)
  const isLimitedView = profile?.limited_info;
  
  const getBlockMessage = () => {
    if (!blockData) return 'Access to this profile is restricted.';
    
    if (blockData.user_blocked_profile) {
      if (blockData.block_type === 'user') {
        return 'You have blocked this user. Profile viewing is allowed.';
      } else if (blockData.block_type === 'profile') {
        return 'You have blocked this profile. You cannot view this profile.';
      } else {
        return 'You have blocked this user. You cannot view this profile.';
      }
    } else if (blockData.profile_blocked_user) {
      if (blockData.block_type === 'user') {
        return 'This user has blocked you. Profile viewing is allowed.';
      } else if (blockData.block_type === 'profile') {
        return 'This user has blocked you from viewing their profile.';
      } else {
        return 'This user has blocked you. You cannot view this profile.';
      }
    }
    
    return 'Access to this profile is restricted.';
  };

  const getSuggestedActions = () => {
    const actions = [];
    
    if (blockData?.user_blocked_profile) {
      actions.push({
        label: 'Unblock User',
        action: onUnblock,
        primary: true,
        icon: <FontAwesomeIcon icon={faUserSlash} />
      });
    }
    
    actions.push({
      label: 'Return to Home',
      action: () => navigate('/'),
      secondary: true,
      icon: <FontAwesomeIcon icon={faHome} />
    });
    
    actions.push({
      label: 'Browse Other Profiles',
      action: () => navigate('/posts'),
      secondary: true,
      icon: <FontAwesomeIcon icon={faUsers} />
    });
    
    return actions;
  };

  return (
    <div className="blocked-profile-container">
      <div className="blocked-profile-header">
        <div className="lock-icon">
          <FontAwesomeIcon icon={faLock} size="3x" />
        </div>
        <h1>Profile Restricted</h1>
        <p className="blocked-message">{getBlockMessage()}</p>
      </div>
      
      {isLimitedView && (
        <div className="limited-profile-info">
          <h2>
            <FontAwesomeIcon icon={faIdCard} style={{ marginRight: '10px' }} />
            Limited Profile Information
          </h2>
          <div className="limited-info-card">
            <div className="limited-avatar">
              {profile.image ? (
                <img src={profile.image} alt={profile.username} />
              ) : (
                <div className="avatar-placeholder">
                  <FontAwesomeIcon icon={faUser} size="2x" />
                </div>
              )}
            </div>
            <div className="limited-details">
              <h3>{profile.username}</h3>
              {profile.first_name && profile.last_name && (
                <p>{profile.first_name} {profile.last_name}</p>
              )}
             
            </div>
          </div>
        </div>
      )}
      
      <div className="blocked-actions">
        <h3>What would you like to do?</h3>
        <div className="action-buttons">
          {getSuggestedActions().map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`action-button ${action.primary ? 'primary' : 'secondary'}`}
            >
              {action.icon && <span className="button-icon">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="blocked-info">
        <h4>
          <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '10px' }} />
          About Profile Restrictions
        </h4>
        <ul>
          <li>
            <FontAwesomeIcon icon={faLock} className="info-icon" />
            <strong>User Block:</strong> Prevents direct messaging but allows profile viewing
          </li>
          <li>
            <FontAwesomeIcon icon={faEyeSlash} className="info-icon" />
            <strong>Profile Block:</strong> Prevents viewing of the profile
          </li>
          <li>
            <FontAwesomeIcon icon={faBan} className="info-icon" />
            <strong>Complete Block:</strong> Prevents all interactions and profile viewing
          </li>
        </ul>
        <p className="info-note">
          Note: Block settings can be managed in your account privacy settings.
        </p>
      </div>
    </div>
  );
};

export default BlockedProfileView;