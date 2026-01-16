// components/feedback/FeedbackCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import useConfirmation from '../../hooks/useConfirmation';
import ConfirmationModal from '../shared/ConfirmationModal';
import StaticStars from '../shared/StaticStars';
import EditFeedbackModal from './EditFeedbackModal';
import ReviewerInfo from './ReviewerInfo';
import HelpfulButton from './HelpfulButton';
import ActionMenu from './ActionMenu';
import { FeedbackIcons } from './icons/FeedbackIcons';
import { isAuthenticated } from '../../utils/helpers';
import '../../styles/profiles/feeback_card.css';

const FeedbackCard = ({ feedback, currentUserId, onUpdate, onDelete, onHelpfulToggle }) => {
  // Context
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  
  // Confirmation modal hook
  const { confirmationState, askConfirmation, closeConfirmation } = useConfirmation();
  
  // State management
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHelpfulLoading, setIsHelpfulLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [localFeedback, setLocalFeedback] = useState(feedback);
  
  // Refs for menu handling
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Update local feedback when prop changes
  useEffect(() => {
    setLocalFeedback(feedback);
  }, [feedback]);

  // Handle helpful toggle
  const handleHelpfulToggle = async (updatedFeedback) => {
    setIsHelpfulLoading(true);
    try {
      setLocalFeedback(updatedFeedback);
      if (onHelpfulToggle) {
        onHelpfulToggle(updatedFeedback);
      }
    } finally {
      setIsHelpfulLoading(false);
      setShowMenu(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  // Handle delete with custom confirmation
  const handleDelete = async () => {
    try {
      // Use custom confirmation modal
      const confirmed = await askConfirmation({
        title: "Delete Review",
        message: "Are you sure you want to delete this review? This action cannot be undone.",
        type: "danger",
        confirmText: "Delete",
        cancelText: "Cancel"
      });

      if (!confirmed) return;

      // Proceed with deletion
      setIsDeleting(true);
      await onDelete(localFeedback.id);
      showSuccess('Review deleted successfully');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      showError('Error deleting review. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle report with custom confirmation
  const handleReport = async () => {
    try {
      const confirmed = await askConfirmation({
        title: "Report Review",
        message: "Are you sure you want to report this review? Our team will review it within 24 hours.",
        type: "warning",
        confirmText: "Report",
        cancelText: "Cancel"
      });

      if (!confirmed) return;

      // Report logic
      showInfo('Review has been reported. Thank you for your feedback!');
      
      // Here you could call an API to report the feedback
      // await reportFeedback(localFeedback.id);
      
    } catch (error) {
      console.error('Error reporting feedback:', error);
      showError('Error reporting review. Please try again.');
    }
  };

  // Handle update success
  const handleUpdateSuccess = (updatedFeedback) => {
    setShowEditModal(false);
    setLocalFeedback(updatedFeedback);
    
    if (onUpdate) {
      onUpdate(updatedFeedback);
    }
    
    showSuccess('Review updated successfully');
  };

  // Derived values
  const isOwner = localFeedback.is_owner === true;
  const isHelpful = localFeedback.is_helpful === true;
  const helpfulCount = localFeedback.helpful_count || 0;

  return (
    <>
      <div className="feedback-card">
        {/* Header section */}
        <div className="feedback-header">
          <ReviewerInfo 
            userName={localFeedback.user_name}
            createdAt={localFeedback.created_at}
            updatedAt={localFeedback.updated_at}
            userImage={localFeedback.user_image}
profile_id={localFeedback.profile_id || localFeedback.user_id} 
          />
          <div className="feedback-rating">
            <StaticStars rating={localFeedback.rating} size="small" />
          </div>
        </div>
        
        {/* Comment section */}
        <div className="feedback-comment">
          <p>{localFeedback.comment}</p>
        </div>
        
        {/* Actions section */}
        <div className="feedback-actions">
          {/* Left actions (Helpful button) */}
          <div className="left-actions">
            <HelpfulButton 
              feedbackId={localFeedback.id}
              isHelpful={isHelpful}
              helpfulCount={helpfulCount}
              isOwner={isOwner}
              onToggle={handleHelpfulToggle}
              disabled={isHelpfulLoading}
            />
          </div>
          
          {/* Right actions (Menu) */}
          <div className="menu-container" style={{ position: 'relative' }}>
            <button 
              ref={buttonRef}
              className="menu-toggle-btn"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="More actions"
            >
              <FeedbackIcons.MenuDots />
            </button>
            
            <ActionMenu 
              isOpen={showMenu}
              onClose={() => setShowMenu(false)}
              onHelpfulToggle={() => handleHelpfulToggle(localFeedback)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReport={handleReport}
              isHelpful={isHelpful}
              isHelpfulLoading={isHelpfulLoading}
              isOwner={isOwner}
              isDeleting={isDeleting}
              buttonRef={buttonRef}
              currentUser={currentUserId}
              feedback={localFeedback}
            />
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {showEditModal && (
        <EditFeedbackModal
          feedback={localFeedback}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleUpdateSuccess}
          showError={showError}
          showSuccess={showSuccess}
        />
      )}

      {/* Custom confirmation modal */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        type={confirmationState.type}
      />
    </>
  );
};

export default FeedbackCard;