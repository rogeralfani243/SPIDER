import InteractiveStars from "../profil_details/InteractiveStars";
import { useState, useEffect } from "react";
import '../../styles/profiles/feedback_form.css'
import URL from "../../hooks/useUrl";

const AddFeedbackForm = ({ profileId, onFeedbackAdded, showError, showSuccess }) => {
  const [showForm, setShowForm] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    rating: 0,
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [commentLength, setCommentLength] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('🔐 Authentication check on mount:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      profileId: profileId
    });
  }, [profileId]);

  const validateForm = () => {
    const errors = {};
    
    if (newFeedback.rating === 0) {
      errors.rating = 'Please select a rating';
    }
    
    if (!newFeedback.comment.trim()) {
      errors.comment = 'Please write a comment';
    } else if (newFeedback.comment.length < 10) {
      errors.comment = 'Please write at least 10 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ CORRECTION: Fonction avec URL corrigée et meilleure gestion des erreurs
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    console.log('🟡 Starting feedback submission...');
    
    if (!validateForm()) {
      const errorMessage = Object.values(validationErrors).join('\n');
      showError(errorMessage);
      return;
    }

    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      console.log('🔐 Token from localStorage:', token);
      
      if (!token) {
        showError('You must be logged in to submit feedback. Please log in and try again.');
        setSubmitting(false);
        return;
      }

      // Données pour l'API
      const feedbackData = {
        profile: parseInt(profileId),
        rating: parseInt(newFeedback.rating),
        comment: newFeedback.comment.trim(),
      };

      console.log('📤 Sending feedback data:', feedbackData);
      
      // ✅ CORRECTION: URL corrigée
      const apiUrl = `${URL}/feedback/create/`;
      console.log('🌐 URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(feedbackData)
      });

      console.log('📨 Response status:', response.status);
      
      const responseData = await response.json();
      console.log('📨 Response data:', responseData);

      if (response.ok) {
        console.log('✅ Feedback saved successfully:', responseData);
        
        // ✅ CORRECTION: Utiliser les données complètes du backend
        const completeFeedback = {
          id: responseData.id,
          rating: responseData.rating,
          comment: responseData.comment,
          user_name: responseData.user_name,
          user_image: '',
          created_at: responseData.created_at,
          updated_at: responseData.updated_at,
          is_owner: responseData.is_owner // ← Important pour les boutons edit/delete
        };
        
        // ✅ CORRECTION: Appeler la fonction parent avec les bonnes données
        onFeedbackAdded(completeFeedback);
        
        // Reset du formulaire
        setNewFeedback({
          rating: 0,
          comment: '',
        });
        setCommentLength(0);
        setValidationErrors({});
        setShowForm(false);
        
        showSuccess('Thank you for your feedback!');
      } else {
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        
        let errorMessage = 'Failed to submit feedback';
        
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
          localStorage.removeItem('token');
        } else if (response.status === 400) {
          if (responseData.error) {
            errorMessage = responseData.error;
          } else if (responseData.detail) {
            errorMessage = responseData.detail;
          } else if (typeof responseData === 'object') {
            const errorDetails = Object.entries(responseData)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('\n');
            errorMessage = `Validation error:\n${errorDetails}`;
          }
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to perform this action';
        } else if (response.status === 404) {
          errorMessage = 'Professional not found';
        } else if (response.status === 405) {
          errorMessage = 'Method not allowed. Please check the API endpoint.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        showError(errorMessage);
      }

    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      showError(`Network error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentChange = (e) => {
    const comment = e.target.value;
    setNewFeedback(prev => ({ ...prev, comment }));
    setCommentLength(comment.length);
    
    if (comment.length >= 10 && validationErrors.comment) {
      setValidationErrors(prev => ({ ...prev, comment: '' }));
    }
  };

  const handleRatingChange = (rating) => {
    setNewFeedback(prev => ({ ...prev, rating }));
    
    if (rating > 0 && validationErrors.rating) {
      setValidationErrors(prev => ({ ...prev, rating: '' }));
    }
  };

  return (
    <div className="add-feedback-section">
      {!showForm ? (
        <button 
          className="add-feedback-btn"
          onClick={() => setShowForm(true)}
          type="button"
        >
          ✍️ Write a Review
        </button>
      ) : (
        <div className="feedback-form-container">
          <div className="form-header">
            <h4>Share Your Experience</h4>
            <button 
              type="button" 
              className="close-form-btn"
              onClick={() => {
                setShowForm(false);
                setNewFeedback({
                  rating: 0,
                  comment: '',
                });
                setCommentLength(0);
                setValidationErrors({});
              }}
              disabled={submitting}
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmitFeedback} className="feedback-form">
            <div className="form-group">
              <label>Your Rating *</label>
              <div className="rating-instruction">Click on the stars to rate</div>
              <InteractiveStars
                rating={newFeedback.rating} 
                size="large"
                onRatingChange={handleRatingChange}
              />
              {validationErrors.rating && (
                <div className="error-message" style={{ color: 'red', fontSize: '0.8rem', marginTop: '5px' }}>
                  {validationErrors.rating}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="comment">
                Your Review *
                <span className="char-count">
                  {commentLength}/500 {commentLength >= 500 ? ' (Maximum reached)' : ''}
                </span>
              </label>
              <textarea
                id="comment"
                value={newFeedback.comment}
                onChange={handleCommentChange}
                placeholder="Share your experience with this professional... What did you like? What could be improved?"
                rows="6"
                maxLength="500"
                required
                disabled={submitting}
                className={validationErrors.comment ? 'invalid' : ''}
              />
              <div className="comment-help">
                <div className="validation-message">
                  {validationErrors.comment ? (
                    <span style={{ color: 'red' }}>{validationErrors.comment}</span>
                  ) : commentLength === 0 ? (
                    'Please write your review'
                  ) : commentLength < 10 ? (
                    <span style={{ color: 'orange' }}>Please write at least 10 characters</span>
                  ) : (
                    <span style={{ color: 'green' }}>✓ Good length</span>
                  )}
                </div>
                <div className="suggestion">
                  💡 Be specific about your experience to help others
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setNewFeedback({
                    rating: 0,
                    comment: '',
                  });
                  setCommentLength(0);
                  setValidationErrors({});
                }}
                className="cancel-btn"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="spinner"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddFeedbackForm;