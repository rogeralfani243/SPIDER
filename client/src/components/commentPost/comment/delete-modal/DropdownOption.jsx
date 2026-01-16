import React, { useState } from 'react';
import { 
  FaChevronRight, 
  FaExclamationCircle, 
  FaInfoCircle,
  FaStar,
  FaLock,
  FaCrown,
  FaBell,
  FaClock
} from 'react-icons/fa';
import PasswordChangeModal from '../../../auth-passcode/PassswordChangeModal';
const DropdownOption = ({ 
  option, 
  isActive, 
  onClick,
  onSubItemClick,
  user, // Ajout de l'utilisateur pour afficher des infos
  showBadge = true // Option pour afficher/masquer les badges
}) => {
  const IconComponent = option.icon;
  const isSubmenuActive = isActive;
  const [hover, setHover] = useState(false);
const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
const [passwordLoading, setPasswordLoading] = useState(false);
const [passwordError, setPasswordError] = useState(null);
  const handleClick = () => {
    if (option.hasSubmenu && option.submenuItems) {
      // Si c'est un sous-menu, on le toggle
      onClick(option);
    } else if (!option.hasSubmenu) {
      // Si c'est une action directe, on l'exécute
      onClick(option);
    }
  };

  const handleSubItemClick = (subItem) => {
    onSubItemClick(option, subItem);
  };

  // Fonction pour déterminer le type de badge
  const getBadgeType = () => {
    if (option.danger) return 'danger';
    if (option.premium) return 'premium';
    if (option.new) return 'new';
    if (option.beta) return 'beta';
    if (option.update) return 'update';
    return 'default';
  };

  // Fonction pour obtenir l'icône du badge
  const getBadgeIcon = () => {
    switch(getBadgeType()) {
      case 'danger': return <FaExclamationCircle />;
      case 'premium': return <FaCrown />;
      case 'new': return <FaStar />;
      case 'beta': return <FaInfoCircle />;
      case 'update': return <FaBell />;
      default: return null;
    }
  };

  // Fonction pour obtenir la couleur du badge
  const getBadgeColor = () => {
    switch(getBadgeType()) {
      case 'danger': return '#dc3545';
      case 'premium': return '#ffc107';
      case 'new': return '#28a745';
      case 'beta': return '#17a2b8';
      case 'update': return '#007bff';
      default: return '#6c757d';
    }
  };
const handlePasswordChangeClick = () => {
  setIsPasswordModalOpen(true);
  setPasswordError(null);
};

const handleClosePasswordModal = () => {
  setIsPasswordModalOpen(false);
  setPasswordLoading(false);
  setPasswordError(null);
};

  // Rendu conditionnel du badge
  const renderBadge = () => {
    if (!showBadge || !option.badge) return null;

    const badgeType = getBadgeType();
    const badgeIcon = getBadgeIcon();
    const badgeColor = getBadgeColor();

    return (
      <span 
        className={`badge badge-${badgeType}`}
        style={{ 
          backgroundColor: `${badgeColor}15`,
          border: `1px solid ${badgeColor}30`,
          color: badgeColor
        }}
      >
        {badgeIcon && <span className="badge-icon">{badgeIcon}</span>}
        <span className="badge-text">{option.badge}</span>
      </span>
    );
  };

  // Rendu conditionnel du statut
  const renderStatus = () => {
    if (!option.status) return null;

    return (
      <div className="option-status">
        <span className={`status-dot status-${option.status}`} />
        <span className="status-label">{option.status}</span>
      </div>
    );
  };

  // Rendu conditionnel du compteur
  const renderCounter = () => {
    if (!option.count && option.count !== 0) return null;

    return (
      <div className="option-counter">
        <span className="counter-value">{option.count}</span>
      </div>
    );
  };

  // Rendu conditionnel de l'indicateur de chargement
  const renderLoading = () => {
    if (!option.loading) return null;

    return (
      <div className="option-loading">
        <div className="loading-spinner" />
      </div>
    );
  };

  // Rendu conditionnel du hint/tooltip
  const renderHint = () => {
    if (!option.hint) return null;

    return (
      <div className="option-hint" title={option.hint}>
        <FaInfoCircle />
      </div>
    );
  };

  // Rendu conditionnel de l'indicateur de verrouillage
  const renderLock = () => {
    if (!option.locked) return null;

    return (
      <div className="option-lock">
        <FaLock />
        {option.lockReason && (
          <div className="lock-tooltip">{option.lockReason}</div>
        )}
      </div>
    );
  };

  // Rendu conditionnel du timestamp
  const renderTimestamp = () => {
    if (!option.timestamp) return null;

    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 1) {
        return 'Just now';
      } else if (diffHours < 24) {
        return `${Math.floor(diffHours)}h ago`;
      } else {
        return date.toLocaleDateString();
      }
    };

    return (
      <div className="option-timestamp">
        <FaClock className="timestamp-icon" />
        <span className="timestamp-value">{formatTime(option.timestamp)}</span>
      </div>
    );
  };

  // Rendu conditionnel des métadonnées utilisateur
  const renderUserInfo = () => {
    if (!user || !option.showUserInfo) return null;

    return (
      <div className="option-user-info">
        {user.profile_image && (
          <img 
            src={user.profile_image} 
            alt={user.username} 
            className="user-avatar-mini"
          />
        )}
        <div className="user-details-mini">
          <span className="user-name-mini">{user.first_name || user.username}</span>
          <span className="user-role-mini">{user.role || 'User'}</span>
        </div>
      </div>
    );
  };

  // Gestion des événements
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleMouseEnter = () => {
    setHover(true);
    if (option.onHover) {
      option.onHover(option);
    }
  };

  const handleMouseLeave = () => {
    setHover(false);
  };

  return (
    <div 
      className="dropdown-option-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Option principale */}
      <div
        className={`
          dropdown-item 
          with-icon 
          ${option.danger ? 'danger' : ''}
          ${option.premium ? 'premium' : ''}
          ${option.disabled ? 'disabled' : ''}
          ${isSubmenuActive ? 'active' : ''}
          ${hover ? 'hover' : ''}
        `}
        onClick={!option.disabled ? handleClick : undefined}
        role="button"
        tabIndex={option.disabled ? -1 : 0}
        onKeyPress={!option.disabled ? handleKeyPress : undefined}
        aria-disabled={option.disabled}
        aria-expanded={isSubmenuActive}
        aria-haspopup={option.hasSubmenu ? "true" : "false"}
      >
        <div className="option-left">
          {/* Icône principale */}
          {IconComponent && (
            <IconComponent 
              className={`dropdown-icon ${option.iconAnimation ? 'animated' : ''}`}
              style={option.iconColor ? { color: option.iconColor } : {}}
            />
          )}

          {/* Contenu principal */}
          <div className="option-content">
            <span className="label">{option.label}</span>
            
            {/* Description optionnelle */}
            {option.description && (
              <span className="option-description">{option.description}</span>
            )}
          </div>

          {/* Badge */}
          {renderBadge()}
        </div>

        {/* Côté droit de l'option */}
        <div className="option-right">
          {/* Timestamp */}
          {renderTimestamp()}

          {/* Compteur */}
          {renderCounter()}

          {/* Statut */}
          {renderStatus()}

          {/* Indicateur de chargement */}
          {renderLoading()}

          {/* Hint */}
          {renderHint()}

          {/* Verrouillage */}
          {renderLock()}

          {/* Info utilisateur */}
          {renderUserInfo()}

          {/* Flèche pour sous-menu */}
          {option.hasSubmenu && option.submenuItems && (
            <FaChevronRight 
              className={`submenu-arrow ${isSubmenuActive ? 'rotated' : ''}`}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
      
      {/* Sous-menu */}
      {option.hasSubmenu && isSubmenuActive && option.submenuItems && (
        <div className="submenu" role="menu">
          {option.submenuItems.map((subItem) => {
            const SubIconComponent = subItem.icon;
            
            return (
              <div
                key={subItem.id}
                className={`
                  submenu-item
                  ${subItem.danger ? 'danger' : ''}
                  ${subItem.disabled ? 'disabled' : ''}
                `}
                onClick={() => !subItem.disabled && handleSubItemClick(subItem)}
                role="menuitem"
                tabIndex={subItem.disabled ? -1 : 0}
                onKeyPress={(e) => !subItem.disabled && e.key === 'Enter' && handleSubItemClick(subItem)}
                aria-disabled={subItem.disabled}
              >
                {/* Icône du sous-item */}
                {SubIconComponent && (
                  <SubIconComponent 
                    className="submenu-icon"
                    style={subItem.iconColor ? { color: subItem.iconColor } : {}}
                  />
                )}

                {/* Contenu du sous-item */}
                <div className="submenu-content">
                  <span className="submenu-label">{subItem.label}</span>
                  
                  {/* Description du sous-item */}
                  {subItem.description && (
                    <span className="submenu-description">{subItem.description}</span>
                  )}
                </div>

                {/* Badge du sous-item */}
                {subItem.badge && (
                  <span className="submenu-badge">{subItem.badge}</span>
                )}

                {/* Hint du sous-item */}
                {subItem.hint && (
                  <div className="submenu-hint" title={subItem.hint}>
                    <FaInfoCircle />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Valeurs par défaut des props
DropdownOption.defaultProps = {
  isActive: false,
  onClick: () => {},
  onSubItemClick: () => {},
  user: null,
  showBadge: true
};

export default DropdownOption;