import React, { useState, useEffect } from 'react';
import StarRating from '../main/ui/ratings.jsx';
 // Assurez-vous d'importer le CSS

const RatingsSection = ({ post, onRatingUpdate }) => {
  const [animatedBars, setAnimatedBars] = useState(false);
  
  // Debug des données reçues
  useEffect(() => {
    console.log('📊 RatingsSection - Post Data:', {
      postId: post?.id,
      average_rating: post?.average_rating,
      total_ratings: post?.total_ratings,
      rating_distribution: post?.rating_distribution,
      has_rating_distribution: !!post?.rating_distribution
    });
    
    // Activer les animations après le rendu initial
    setTimeout(() => {
      setAnimatedBars(true);
    }, 100);
  }, [post]);

  // Fonction pour obtenir la distribution des notes
  const getRatingDistribution = () => {
    // Si la distribution est déjà fournie par l'API
    if (post.rating_distribution && typeof post.rating_distribution === 'object') {
      console.log('📈 Using API rating distribution:', post.rating_distribution);
      
      // Normaliser la distribution
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      
      // S'assurer que toutes les clés existent (traiter les clés numériques et string)
      Object.keys(distribution).forEach(key => {
        const numKey = parseInt(key);
        const value = post.rating_distribution[numKey] || 
                     post.rating_distribution[key] || 
                     post.rating_distribution[key.toString()] || 0;
        distribution[key] = parseInt(value) || 0;
      });
      
      console.log('📈 Normalized distribution:', distribution);
      return distribution;
    }
    
    console.log('⚠️ No rating distribution from API');
    return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  };

  const ratingDistribution = getRatingDistribution();
  
  // Calculer le total depuis la distribution
  const calculatedTotal = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0);
  
  // Utiliser le total de l'API ou celui calculé
  const totalRatings = post.total_ratings || calculatedTotal || 0;
  const averageRating = post.average_rating || 0;
  
  // Fonction pour afficher les étoiles de la moyenne
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
    <div className="ratings-section">
      <div className="section-header">
        <div className="reviews-summary">

          <div className="rating-overview">
            <div className="average-rating-display">
              <div className="average-number">{averageRating.toFixed(1)}</div>
              <div className="average-stars">
                {renderAverageStars()}
              </div>
              <div className="total-ratings">({totalRatings} ratings)</div>
            </div>
            
            {/* Rating Breakdown */}
            {totalRatings > 0 && (
              <div className="rating-breakdown2">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = ratingDistribution[stars] || 0;
                  const percentage = totalRatings > 0 
                    ? ((count / totalRatings) * 100)
                    : 0;
                  
                  console.log(`⭐ ${stars} stars: ${count}/${totalRatings} = ${percentage.toFixed(1)}%`);
                  
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
                          className={`bar-fill ${animatedBars ? 'animated' : ''}`}
                          style={{ 
                            '--target-width': `${percentage}%`,
                            width: animatedBars ? `${percentage}%` : '0%'
                          }}
                          aria-label={`${percentage.toFixed(1)}% of ratings are ${stars} stars`}
                        ></div>
                      </div>
                      <span 
                        className="count-label"
                        data-percentage={`${percentage.toFixed(1)}%`}
                        title={`${percentage.toFixed(1)}% of reviews (${count} reviews)`}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="ratings-content">
        {/* Interactive Star Rating Component */}
        <div className="interactive-rating-section">
          <h3 className="section-subtitle">Rate this post</h3>
          <StarRating
            postId={post.id}
            initialUserRating={post.user_rating}
            averageRating={averageRating}
            totalRatings={totalRatings}
            onRatingUpdate={onRatingUpdate}
          />
        </div>
        
        {/* Message si pas de ratings */}
        {totalRatings === 0 && (
          <div className="no-ratings-message">
            <div className="no-ratings-icon">⭐</div>
            <h3>No Ratings Yet</h3>
            <p>This post hasn't received any ratings yet.</p>
            <p>Be the first to share your opinion!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingsSection;