import React from 'react';
import AddFeedbackForm from './AddFeeback';
import FeedbackCard from './FeedbackCard';
import StaticStars from '../shared/StaticStars';
import '../../styles/profiles/feedback_sections.css';
import URL from "../../hooks/useUrl";

const FeedbacksSection = ({ 
  feedbacks, 
  profileId, 
  currentUserId,
  onFeedbackAdded, 
  onFeedbackUpdate,
  onFeedbackDelete,
  
  showError, 
  showSuccess 
}) => {
  console.log('🎯 [FRONTEND DEBUG] FeedbacksSection rendered:', {
    profileId,
    currentUserId,
    feedbacksCount: feedbacks.length,
    feedbacks: feedbacks.map(f => ({ id: f.id, user: f.user, is_owner: f.is_owner }))
  });

  const calculateAverageRating = () => {
    if (feedbacks.length === 0) return 0;
    const sum = feedbacks.reduce((total, feedback) => total + feedback.rating, 0);
    return sum / feedbacks.length;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach(feedback => {
      const rating = Math.round(feedback.rating);
      distribution[rating]++;
    });
    return distribution;
  };

  const averageRating = calculateAverageRating();
  const ratingDistribution = getRatingDistribution();
  const totalReviews = feedbacks.length;
  const renderAverageStars = () => {
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;
    
    return (
      <div className="average-stars-display">
        {[1, 2, 3, 4, 5].map((star) => {
          let starClass = 'star-empty';
          
          if (star <= fullStars) {
            starClass = 'star-full';
          } else if (hasHalfStar && star === fullStars + 1) {
            starClass = 'star-half';
          }
          
          return (
            <span key={star} className={`average-star ${starClass}`}>
              ★
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="feedbacks-section">
      <div className="section-header">
        <div className="reviews-summary">
          <h2 className="section-titles-bio">Client Reviews</h2>
          <div className="rating-overview">
            <div className="average-rating-display">
              <div className="average-number">{averageRating.toFixed(1)}</div>
              <div className="average-stars">
               {renderAverageStars()}
              </div>
              <div className="total-reviews">({totalReviews} reviews)</div>
            </div>
{totalReviews > 0 && (
  <div className="rating-breakdown">
    {[5, 4, 3, 2, 1].map(stars => {
      const percentage = totalReviews > 0 
        ? ((ratingDistribution[stars] / totalReviews) * 100).toFixed(1)
        : 0;
      
      return (
        <div 
          key={stars} 
          className={`rating-bar stars-${stars}`}
        >
          <span className="stars-label">
            {stars}
            <span className="star-icon">★</span>
          </span>
          <div className="bar-container">
            <div 
              className="bar-fill"
              style={{ 
                width: `${percentage}%` 
              }}
              aria-label={`${percentage}% of reviews are ${stars} stars`}
            ></div>
          </div>
          <span 
            className="count-label"
            data-percentage={`${percentage}%`}
            title={`${percentage}% of reviews (${ratingDistribution[stars]} reviews)`}
          >
            {ratingDistribution[stars]}
          </span>
        </div>
      );
    })}
  </div>
)}
          </div>
        </div>
        
        <AddFeedbackForm 
          profileId={profileId} 
          onFeedbackAdded={onFeedbackAdded} // ← Déléguer directement au parent
          showError={showError}
          showSuccess={showSuccess}
        />
      </div>

      {feedbacks.length === 0 ? (
        <div className="no-feedbacks">
          <div className="no-feedbacks-icon">💬</div>
          <h3>No Reviews Yet</h3>
          <p>This professional hasn't received any reviews yet.</p>
          <p>Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="feedbacks-grid">
          {feedbacks.map((feedback) => (
            <FeedbackCard 
              key={feedback.id} 
              feedback={feedback}
              currentUserId={currentUserId}
              onUpdate={onFeedbackUpdate}
              onDelete={onFeedbackDelete}
               
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbacksSection;