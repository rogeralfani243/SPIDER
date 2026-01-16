import React, { useState } from 'react';
import InteractiveStars from '../profil_details/InteractiveStars'; // Utilisez ce composant pour l'édition
import URL from '../../hooks/useUrl'; // N'oubliez pas d'importer URL
import '../../styles/profile_details/edit_feedback.css'
const EditFeedbackModal = ({ feedback, onClose, onSuccess, profile }) => {
  const [rating, setRating] = useState(feedback.rating);
  const [comment, setComment] = useState(feedback.comment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ✅ DEBUG
  console.log('🔍 EditFeedbackModal - Debug:', {
    feedbackId: feedback.id,
    currentRating: feedback.rating,
    newRating: rating,
    profileId: profile?.id
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to edit your review');
        setIsSubmitting(false);
        return;
      }

      // ✅ CORRECTION: URL complète et endpoint correct
      const apiUrl = `${URL}/feedback/${feedback.id}/update/`;
      console.log('🌐 [DEBUG] Edit URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`, // ✅ AJOUT: Authentification
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
          rating: parseInt(rating),
          comment: comment.trim(),
        }),
      });

      console.log('📨 [DEBUG] Edit response status:', response.status);

      if (response.ok) {
        const updatedFeedback = await response.json();
        console.log('✅ [DEBUG] Feedback updated successfully:', updatedFeedback);
        onSuccess(updatedFeedback);
      } else {
        const errorData = await response.json();
        console.error('❌ [DEBUG] Update failed:', errorData);
        setError(errorData.error || errorData.detail || 'Failed to update review');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error updating feedback:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCsrfToken = () => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return cookieValue || '';
  };

  // ✅ CORRECTION: Fonction pour gérer le changement de rating
  const handleRatingChange = (newRating) => {
    console.log('⭐ [DEBUG] Rating changed in modal:', newRating);
    setRating(newRating);
    // Effacer l'erreur quand l'utilisateur sélectionne une note
    if (error && error.includes('rating')) {
      setError('');
    }
  };

  return (
    <div className="modal-overlay-feedback" onClick={onClose}>
      <div className="modal-content-feedback" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-feedback">
          <h3>Edit Your Review</h3>
          <button 
            className="close-btn-feedback" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="rating-section">
              <label>Your Rating:</label>
              {/* ✅ CORRECTION: Utilisez InteractiveStars au lieu de ProfileStarRating */}
              <InteractiveStars
                rating={rating}
                onRatingChange={handleRatingChange}
                size="large"
              />
              <div className="current-rating-display">
                Current selection: {rating} star{rating !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="comment-section">
              <label htmlFor="comment">Your Review:</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows="5"
                maxLength="1000"
                disabled={isSubmitting}
              />
              <div className="character-count">
                {comment.length}/1000 characters
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFeedbackModal;