// components/feedback/ActionMenu.jsx
import React, { useRef, useEffect } from 'react';
import { FeedbackIcons } from './icons/FeedbackIcons';
import ReportButton from '../reports/ReportButton';

/**
 * Dropdown menu component for feedback actions
 */
const ActionMenu = ({ 
  isOpen, 
  onClose, 
  onHelpfulToggle,
  onEdit,
  onDelete,
  onReport,
  isHelpful,
  isHelpfulLoading,
  isOwner,
  isDeleting,
  buttonRef,
  feedback, // Reçu du parent
  currentUser, // Reçu du parent
}) => {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, buttonRef]);

  // Empêcher la fermeture du menu quand on clique à l'intérieur
  const handleMenuClick = (e) => {
    e.stopPropagation();
  };

  // Gestionnaire pour Delete avec fermeture du menu
  const handleDeleteClick = () => {
    onClose(); // Fermer le menu d'abord
    setTimeout(() => {
      onDelete(); // Appeler la fonction delete après un léger délai
    }, 50);
  };

  // Gestionnaire pour Edit avec fermeture du menu
  const handleEditClick = () => {
    onClose();
    setTimeout(() => {
      onEdit();
    }, 50);
  };

  // Gestionnaire pour Helpful avec fermeture du menu
  const handleHelpfulClick = () => {
    onClose();
    setTimeout(() => {
      onHelpfulToggle();
    }, 50);
  };

  // Gestionnaire pour ReportButton
  const handleReportSuccess = () => {
    onClose(); // Fermer le menu
    // Optionnel: appeler l'ancienne fonction si nécessaire
    if (onReport) {
      onReport();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        ref={menuRef}
        className="action-menu"
        onClick={handleMenuClick}
      >
       
        
        {/* Owner-only options */}
        {isOwner && (
          <>
            <button 
              className="menu-item"
              onClick={handleEditClick}
              disabled={isDeleting}
            >
              <span className="icon"><FeedbackIcons.Edit /></span>
              <span className="text">Edit Review</span>
            </button>
            <button 
              className="menu-item delete-item"
              onClick={handleDeleteClick}
              disabled={isDeleting}
            >
              <span className="icon"><FeedbackIcons.Delete /></span>
              <span className="text">
                {isDeleting ? 'Deleting...' : 'Delete Review'}
              </span>
            </button>
          </>
        )}
        
        {/* ReportButton intégré */}
        <div className="menu-item report-item-wrapper" style={{ padding: 0 }}>
           {!isOwner && (
          <ReportButton
            contentType="feedback"
            contentId={feedback?.id}
            contentAuthorId={feedback?.user?.id}
            contentObject={feedback}
            buttonVariant="text"
            showIcon={true}
            showText={true}
            className="feedback-report-button"
            onReported={handleReportSuccess}
            disabled={isDeleting}
          >
  
          </ReportButton>  )}
        </div>
      </div>
      
      {/* Overlay pour fermer le menu */}
      <div 
        className="menu-overlay"
        onClick={onClose}
      />
    </>
  );
};

export default ActionMenu;