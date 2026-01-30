/* ⭐ Star Rating Component */
import { useEffect, useState } from "react";
import axios from "axios";
import { FaStar, FaRegStar } from 'react-icons/fa';
import URL from "../../../hooks/useUrl";
import '../../../styles/rate/star-ratings.css';

const StarRating = ({ postId, initialUserRating, averageRating, totalRatings, onRatingUpdate }) => {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [currentAverage, setCurrentAverage] = useState(0);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ✅ CORRECTION : Synchroniser l'état local avec les props
  useEffect(() => {
    console.log(`🎯 StarRating ${postId} - Props reçus:`, {
      initialUserRating,
      averageRating,
      totalRatings
    });
    
    // Vérifier si initialUserRating est un objet avec stars ou directement un nombre
    const ratingValue = initialUserRating?.stars || initialUserRating || 0;
    
    setUserRating(ratingValue);
    setCurrentAverage(averageRating || 0);
    setCurrentTotal(totalRatings || 0);
  }, [postId, initialUserRating, averageRating, totalRatings]);

  const ratePost = async (stars) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    // ✅ MISE À JOUR OPTIMISTE IMMÉDIATE
    const oldUserRating = userRating;
    setUserRating(stars);
    
    try {
      const response = await axios.post(
        `${URL}/post/posts/${postId}/rate/`, 
        { stars },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
          },
        
        }
      );
      
      console.log('✅ Rating response:', response.data);
      
      // ✅ Extraire les données correctement
      const newUserRating = response.data.user_rating?.stars || stars;
      const newAverage = response.data.average_rating || averageRating;
      const newTotal = response.data.total_ratings || totalRatings;
      
      // ✅ Mettre à jour les états locaux avec les données du serveur
      setUserRating(newUserRating);
      setCurrentAverage(newAverage);
      setCurrentTotal(newTotal);
      
      // ✅ Appeler le callback parent avec un format cohérent
      if (onRatingUpdate) {
        onRatingUpdate({
          userRating: newUserRating,
          averageRating: newAverage,
          totalRatings: newTotal,
          user_rating: newUserRating,
          average_rating: newAverage,
          total_ratings: newTotal
        });
      }
    } catch (error) {
      console.error('❌ Error rating post:', error);
      setError('Failed to submit rating. Please try again.');
      
      // ✅ REVERT en cas d'erreur
      setUserRating(oldUserRating);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRating = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    // ✅ MISE À JOUR OPTIMISTE
    const oldUserRating = userRating;
    setUserRating(0);
    
    try {
      const response = await axios.delete(
        `${URL}/post/posts/${postId}/rate/delete/`,
        {
          headers: {
            'X-CSRFToken': getCSRFToken(),
          },

        }
      );
      
      console.log('✅ Delete rating response:', response.data);
      
      const newAverage = response.data.average_rating || 0;
      const newTotal = response.data.total_ratings || 0;
      
      setUserRating(0);
      setCurrentAverage(newAverage);
      setCurrentTotal(newTotal);
      
      if (onRatingUpdate) {
        onRatingUpdate({
          userRating: 0,
          averageRating: newAverage,
          totalRatings: newTotal,
          user_rating: 0,
          average_rating: newAverage,
          total_ratings: newTotal
        });
      }
    } catch (error) {
      console.error('❌ Error deleting rating:', error);
      setError('Failed to delete rating. Please try again.');
      
      // ✅ REVERT en cas d'erreur
      setUserRating(oldUserRating);
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

  // ✅ Fonction pour rendre les étoiles avec état actuel
  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => {
      const isActive = star <= (hoverRating || userRating);
      
      return (
        <button
          key={star}
          type="button"
          className={`star-btn ${isActive ? 'active' : ''} ${isSubmitting ? 'disabled' : ''}`}
          onClick={() => ratePost(star)}
          onMouseEnter={() => !isSubmitting && setHoverRating(star)}
          onMouseLeave={() => !isSubmitting && setHoverRating(0)}
          disabled={isSubmitting}
          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          {isActive ? <FaStar /> : <FaRegStar />}
        </button>
      );
    });
  };

  return (
    <div className="star-rating">
      <div className="stars-container">
        <div className="stars">
          {renderStars()}
        </div>
        
        {userRating > 0 && (
          <button 
            className="delete-rating-btn"
            onClick={deleteRating}
            disabled={isSubmitting}
            title="Remove my rating"
            aria-label="Remove my rating"
          >
            ×
          </button>
        )}
      </div>
      
      {/* Affichage du rating actuel de l'utilisateur */}
 
      
      {error && (
        <div className="rating-error">
          {error}
        </div>
      )}
      
      {isSubmitting && (
        <div className="submitting-overlay">
          <div className="submitting-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default StarRating;