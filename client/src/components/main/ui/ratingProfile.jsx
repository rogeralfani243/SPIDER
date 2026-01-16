/* ⭐ Profile Star Rating Component */
import { useEffect, useState } from "react";
import axios from "axios";
import { FaStar, FaRegStar } from 'react-icons/fa';
import URL from "../../../hooks/useUrl";
import '../../../styles/rate/star-ratings.css';

const ProfileStarRating = ({ 
  profileId, 
  initialUserRating = 0, 
  averageRating = 0, 
  totalRatings = 0, 
  onRatingUpdate,
  size = "medium",
  showStats = true,
  interactive = true 
}) => {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [currentAverage, setCurrentAverage] = useState(0);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Initialiser avec les props
  useEffect(() => {
    console.log(`🎯 ProfileStarRating ${profileId} - Initialisation:`, {
      initialUserRating,
      averageRating,
      totalRatings
    });
    
    setUserRating(initialUserRating || 0);
    setCurrentAverage(averageRating || 0);
    setCurrentTotal(totalRatings || 0);
  }, [profileId, initialUserRating, averageRating, totalRatings]);

  // ✅ Fonction pour noter un profile
  const rateProfile = async (stars) => {
    if (isSubmitting || !interactive) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to rate a profile');
        setIsSubmitting(false);
        return;
      }

      console.log(`⭐ Rating profile ${profileId} with ${stars} stars`);

      const response = await axios.post(
        `${URL}/feedback/create/`, 
        {
          profile: parseInt(profileId),
          rating: parseInt(stars),
          comment: "" // Commentaire optionnel pour les ratings simples
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
            'X-CSRFToken': getCSRFToken(),
          },
          withCredentials: true
        }
      );
      
      console.log('✅ Profile rating response:', response.data);
      
      // Mettre à jour avec les données de la réponse
      const newUserRating = response.data.rating || stars;
      setUserRating(newUserRating);
      
      // Pour un profile, on peut recalculer la moyenne ou attendre une mise à jour du parent
      if (onRatingUpdate) {
        onRatingUpdate({
          userRating: newUserRating,
          profileId: profileId,
          action: 'rated'
        });
      }

      // Afficher un message de succès
      setError(null);

    } catch (error) {
      console.error('❌ Error rating profile:', error);
      if (error.response?.status === 400) {
        setError(error.response.data.error || 'You have already rated this profile');
      } else if (error.response?.status === 401) {
        setError('Please log in to rate this profile');
      } else {
        setError('Failed to submit rating. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Fonction pour supprimer la notation (si applicable)
  const deleteRating = async () => {
    if (isSubmitting || !interactive) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to modify your rating');
        setIsSubmitting(false);
        return;
      }

      // Trouver l'ID du feedback existant pour le supprimer
      // Cette partie dépend de votre API
      const response = await axios.delete(
        `${URL}/feedback/${profileId}/delete-rating/`, // Vous devrez créer cet endpoint
        {
          headers: {
            'Authorization': `Token ${token}`,
            'X-CSRFToken': getCSRFToken(),
          },
          withCredentials: true
        }
      );
      
      console.log('✅ Delete rating response:', response.data);
      
      setUserRating(0);
      
      if (onRatingUpdate) {
        onRatingUpdate({
          userRating: 0,
          profileId: profileId,
          action: 'deleted'
        });
      }

      setError(null);

    } catch (error) {
      console.error('❌ Error deleting rating:', error);
      setError('Failed to delete rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCSRFToken = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  // ✅ Styles pour différentes tailles
  const sizeStyles = {
    small: { starSize: '16px', fontSize: '12px' },
    medium: { starSize: '20px', fontSize: '14px' },
    large: { starSize: '24px', fontSize: '16px' }
  };

  const { starSize, fontSize } = sizeStyles[size];

  return (
    <div className={`profile-star-rating ${size} ${!interactive ? 'read-only' : ''}`}>
      <div className="stars-container">
        <div className="stars" style={{ fontSize: starSize }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-btn ${star <= (hoverRating || userRating) ? 'active' : ''} ${!interactive ? 'non-interactive' : ''}`}
              onClick={() => rateProfile(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              disabled={isSubmitting || !interactive}
              title={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : `Rating: ${currentAverage.toFixed(1)}`}
            >
              {star <= (hoverRating || userRating || currentAverage) ? 
                <FaStar className="star-icon" /> : 
                <FaRegStar className="star-icon" />
              }
            </button>
          ))}
        </div>
        
        {/* Bouton pour supprimer la notation */}
        {interactive && userRating > 0 && (
          <button 
            className="delete-rating-btn"
            onClick={deleteRating}
            disabled={isSubmitting}
            title="Remove my rating"
            style={{ fontSize: starSize }}
          >
            ×
          </button>
        )}
      </div>
      
      {/* Statistiques de notation */}
      {showStats && (
        <div className="rating-stats" style={{ fontSize }}>
          {currentAverage > 0 ? (
            <>
              <span className="average-rating">{currentAverage.toFixed(1)}</span>
              <span className="rating-count">
                ({currentTotal} review{currentTotal !== 1 ? 's' : ''})
              </span>
              {userRating > 0 && interactive && (
                <span className="user-rating-badge">
                  Your rating: {userRating}
                </span>
              )}
            </>
          ) : (
            <span className="no-ratings">No reviews yet</span>
          )}
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && interactive && (
        <div className="rating-error" style={{ fontSize: '12px' }}>
          {error}
        </div>
      )}
      
      {/* Indicateur de chargement */}
      {isSubmitting && (
        <div className="rating-loading" style={{ fontSize: '12px' }}>
          Submitting...
        </div>
      )}
    </div>
  );
};

export default ProfileStarRating;