// components/IconDropdown/IconDropdown.js
import React, { useState, useRef, useEffect } from 'react';
import { FaCog, FaUserEdit, FaUser, FaSignOutAlt, FaTrashAlt, FaBell, FaShieldAlt, FaPalette, FaGlobe, FaQuestionCircle, FaExclamationTriangle, FaKey, FaChartBar } from 'react-icons/fa';
import '../styles/Dropdown.css';
import ProfileModif from './profile/ProfilModif';
import { useAuth } from '../contexts/AuthContext';
import { useAccountService } from './hooks/useAccountService';
import DeleteAccountModal from './commentPost/comment/delete-modal/DeleteAccountModal';
import DropdownMenu from './commentPost/comment/delete-modal/DropdownMenu';
import PasswordChangeModal from './auth-passcode/PassswordChangeModal';
import API_URL from '../hooks/useApiUrl';
import handleSupportClick from '../hooks/useSupport';
import { useNavigate } from 'react-router-dom';
// Configuration des options
const mainOptions = [
  { 
    id: 'profile', 
    label: 'My Profile', 
    icon: FaUser,
    hasSubmenu: false,
    action: 'view-profile'
  },
  { 
    id: 'edit', 
    label: 'Edit Profile', 
    icon: FaUserEdit,
    hasSubmenu: false,
    action: 'edit-profile'
  },
  {/* 
    id: 'settings', 
    label: 'Settings', 
    icon: FaCog,
    hasSubmenu: true,
    submenuItems: [
      { id: 'account', label: 'Account Settings', icon: FaUser, action: 'account-settings' },
      { id: 'notifications', label: 'Notifications', icon: FaBell, action: 'notification-settings' },
      { id: 'privacy', label: 'Privacy & Security', icon: FaShieldAlt, action: 'privacy-settings' },
      { id: 'appearance', label: 'Appearance', icon: FaPalette, action: 'appearance-settings' },
      { id: 'language', label: 'Language & Region', icon: FaGlobe, action: 'language-settings' }
    ]
 */},
  { 
    id: 'security', 
    label: 'Security', 
    icon: FaKey,
    hasSubmenu: true,
    submenuItems: [
      { id: 'password', label: 'Change Password', icon: FaKey, action: 'change-password' },
    ]
  },
  { /*
    id: 'analytics', 
    label: 'Analytics', 
    icon: FaChartBar,
    hasSubmenu: false,
    action: 'analytics'
  */}
];

const supportOptions = [
  { 
    id: 'help', 
    label: 'Help & Support', 
    icon: FaQuestionCircle,
    hasSubmenu: true,
    submenuItems: [
      { id: 'terms and policy', label: 'Terms and policy', icon: FaQuestionCircle, action: 'policy' },
      { id: 'contact', label: 'Contact Support', icon: FaQuestionCircle, action: 'contact-support' },
      { id: 'faq', label: 'FAQ', icon: FaQuestionCircle, action: 'faq' },
      { id: 'tutorials', label: 'Video Tutorials', icon: FaQuestionCircle, action: 'tutorials' }
    ]
  },
  {/* 
    id: 'report', 
    label: 'Report', 
    icon: FaExclamationTriangle,
    hasSubmenu: true,
    submenuItems: [
      { id: 'bug', label: 'Report a Bug', icon: FaExclamationTriangle, action: 'report-bug' },
      { id: 'feature', label: 'Suggest a Feature', icon: FaExclamationTriangle, action: 'suggest-feature' },
      { id: 'abuse', label: 'Report Abuse', icon: FaExclamationTriangle, action: 'report-abuse' },
 ]
 */ }
];

const accountOptions = [
  { 
    id: 'delete', 
    label: 'Delete Account', 
    icon: FaTrashAlt,
    hasSubmenu: false,
    action: 'delete-account',
    danger: true
  },
  { 
    id: 'logout', 
    label: 'Log Out', 
    icon: FaSignOutAlt,
    hasSubmenu: false,
    action: 'logout'
  }
];

const IconDropdown = ({currentUser,currentProfileId}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const theme = 'light';
const navigate = useNavigate()
  const dropdownRef = useRef(null);
  const { logout, user, token } = useAuth(); // Assurez-vous que votre useAuth retourne un token
  const { 
    deleteAccount, 
    requestDeletionCode, 
    verifyDeletionCode, 
    loading, 
    error 
  } = useAccountService();

  // Gestion du clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setActiveSubmenu(null);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleOptionClick = (option) => {
    if (option.hasSubmenu && option.submenuItems) {
      setActiveSubmenu(activeSubmenu === option.id ? null : option.id);
      return;
    }

    handleAction(option.action);
  };

  const handleSubItemClick = (option, subItem) => {
    handleAction(subItem.action);
  };
   
  const handleViewProfile = async () => {
    try {
      console.log('🎯 [DEBUG] handleViewProfile called');
      
      // 1. Essayer de récupérer le profil courant via l'endpoint qui EXISTE
      if (token) {
        const response = await fetch(`${API_URL}/api/api/current-user-profile/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 [DEBUG] /profile/me/ response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 [DEBUG] /profile/me/ response:', data);
          
          // Vérifiez la structure de la réponse
          if (data.id) {
            // Si la réponse contient directement l'ID
            console.log('✅ [DEBUG] Profile found (direct id):', data.id);
            window.location.href = `/profile/${data.id}/`;
            return;
          } else if (data.profile && data.profile.id) {
            // Si la réponse a une structure nested
            console.log('✅ [DEBUG] Profile found (nested):', data.profile.id);
            window.location.href = `/profile/${data.profile.id}/`;
            return;
          }
        } else {
          const errorText = await response.text();
          console.error('❌ [DEBUG] /profile/me/ error:', errorText);
        }
      }
      
      // 2. Fallback: utiliser votre autre endpoint qui existe
      if (currentUser?.id && token) {
        console.log('🔍 [DEBUG] Trying alternative endpoint for user:', currentUser.id);
        
        const response = await fetch(`${API_URL}/api/user/${currentUser.id}/get-profile-id/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 [DEBUG] /api/user/get-profile-id/ response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 [DEBUG] Alternative endpoint response:', data);
          
          if (data.profile_id) {
            console.log('✅ [DEBUG] Profile found via alternative:', data.profile_id);
            window.location.href = `/profile/${data.profile_id}/`;
            return;
          }
        }
      }
      
      // 3. Dernier recours: utiliser l'ID utilisateur
      const userIdToUse = currentUser?.id || user?.id;
      if (userIdToUse) {
        console.log('⚠️ [DEBUG] Using userId as fallback:', userIdToUse);
        window.location.href = `/profile/${userIdToUse}/`;
      } else {
        console.error('❌ [DEBUG] No user ID available');
        window.location.href = '/profile/';
      }
      
    } catch (error) {
      console.error('❌ [DEBUG] Error in handleViewProfile:', error);
      
      // Redirection de fallback
      const userIdToUse = currentUser?.id || user?.id;
      if (userIdToUse) {
        window.location.href = `/profile/${userIdToUse}/`;
      } else {
        window.location.href = '/profile/';
      }
    }
  };
  

  const handleAction = (action) => {
    setIsOpen(false);
    setActiveSubmenu(null);

    switch(action) {
      case 'edit-profile':
        setShowProfileEdit(true);
        break;
      case 'view-profile':
  handleViewProfile();
        break;
      case 'change-password':
        handlePasswordChangeClick();
        break;
      case 'logout':
        handleLogout();
        break;
      case 'delete-account':
        setShowDeleteModal(true);
        break;
       case 'faq':
        navigate('/faq/')
        break;
        case 'policy':
        navigate('/policy/')
        break;   
     case 'contact-support':
       handleSupportClick()

        break;
      default:
        console.log(`Action: ${action}`);
        break;
    }
  };

  // Handler pour ouvrir la modal de changement de mot de passe
  const handlePasswordChangeClick = () => {
    setShowPasswordModal(true);
    setPasswordError(null);
  };

  // Handler pour fermer la modal
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordLoading(false);
    setPasswordError(null);
  };

  // 1. Demander un code de changement de mot de passe
  const handlePasswordRequestCode = async () => {
    try {
      setPasswordLoading(true);
      setPasswordError(null);
      
      const response = await fetch(`${API_URL}/api/account/request-password-change-code/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}` // Utilisation du Token
        },
        body: JSON.stringify({
          // Vous pouvez envoyer des données supplémentaires si nécessaire
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send verification code');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to send verification code';
      setPasswordError({ error: errorMessage });
      throw err;
    } finally {
      setPasswordLoading(false);
    }
  };

  // 2. Vérifier le code reçu
  const handlePasswordVerifyCode = async (code) => {
    try {
      setPasswordLoading(true);
      setPasswordError(null);
      
      const response = await fetch(`${API_URL}/api/account/verify-password-change-code/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ 
          code: code
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Invalid verification code');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Invalid verification code';
      setPasswordError({ error: errorMessage });
      throw err;
    } finally {
      setPasswordLoading(false);
    }
  };

  // 3. Changer le mot de passe
  const handlePasswordChange = async (oldPassword, newPassword, confirmPassword) => {
    try {
      setPasswordLoading(true);
      setPasswordError(null);
      
      const response = await fetch(`${API_URL}/api/account/change-password/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ 
          old_password: oldPassword,  // Notez le underscore pour Django
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change password');
      }

      const result = await response.json();
      
      // Succès - fermer la modal après un délai
      setTimeout(() => {
        handleClosePasswordModal();
        // Afficher un message de succès
        alert('Password changed successfully!');
        
        // Optionnel: Déconnecter l'utilisateur pour qu'il se reconnecte avec le nouveau mot de passe
        // setTimeout(() => {
        //   logout();
        // }, 2000);
      }, 1500);
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to change password';
      setPasswordError({ error: errorMessage });
      throw err;
    } finally {
      setPasswordLoading(false);
    }
  };

  // Fonction pour annuler le changement de mot de passe (optionnelle)
  const handleCancelPasswordChange = async () => {
    try {
      const response = await fetch('/api/account/cancel-password-change/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) {
        console.error('Failed to cancel password change');
      }
    } catch (err) {
      console.error('Error canceling password change:', err);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const handleDeleteAccount = async (confirmation) => {
    try {
      const response = await deleteAccount(confirmation);
      
      if (response.success) {
        logout();
        setTimeout(() => {
          window.location.href = '/?message=account_deleted';
        }, 1000);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleRequestCode = async () => {
    try {
      return await requestDeletionCode();
    } catch (error) {
      throw error;
    }
  };

  const handleVerifyCode = async (code) => {
    try {
      return await verifyDeletionCode(code);
    } catch (error) {
      throw error;
    }
  };

  const handleCloseProfileEdit = () => {
    setShowProfileEdit(false);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  // Fonction pour fermer la modal avec annulation
  const handleCancelPasswordModal = () => {
    if (window.confirm('Are you sure you want to cancel the password change process?')) {
      // Optionnel: Appeler l'API d'annulation
      handleCancelPasswordChange();
      handleClosePasswordModal();
    }
  };

  return (
    <>
      <div className="dropdown-container" ref={dropdownRef}>
        {/* Bouton d'ouverture du menu */}
        <span
          className={`settings-button ${isOpen ? 'open' : ''}`}
          onClick={toggleDropdown}
          aria-label="User menu"
          aria-expanded={isOpen}
          type="button"
        >
          <FaCog className="settings-icon" />
        </span>
        
        {/* Menu déroulant */}
        <DropdownMenu
          isOpen={isOpen}
          user={user}
          mainOptions={mainOptions}
          supportOptions={supportOptions}
          accountOptions={accountOptions}
          activeSubmenu={activeSubmenu}
          onOptionClick={handleOptionClick}
          onSubItemClick={handleSubItemClick}
          theme={theme}
          onToggleTheme={toggleTheme}
          onPasswordModalOpen={handlePasswordChangeClick}
        />
      </div>
      
      {/* Modal d'édition de profil */}
      {showProfileEdit && (
        <ProfileModif 
          open={showProfileEdit}
          onClose={handleCloseProfileEdit}
        />
      )}
      
      {/* Modal de changement de mot de passe */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={handleCancelPasswordModal} // Utilisez handleCancelPasswordModal pour gérer l'annulation
        user={user}
        onRequestCode={handlePasswordRequestCode}
        onVerifyCode={handlePasswordVerifyCode}
        onChangePassword={handlePasswordChange}
        loading={passwordLoading}
        error={passwordError}
        onSupportClick={handleSupportClick}
      />
      
      {/* Modal de suppression de compte */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        user={user}
        onDeleteAccount={handleDeleteAccount}
        onRequestCode={handleRequestCode}
        onVerifyCode={handleVerifyCode}
        loading={loading}
        error={error}
        onSupportClick={handleSupportClick}
      />
    </>
  );
};

export default IconDropdown;