import { useState } from "react";

const InteractiveStars = ({ rating, size = 'medium', onRatingChange = null }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  const starSize = {
    small: '1rem',
    medium: '1.5rem',
    large: '2rem'
  }[size];

  const handleStarClick = (starValue) => {
    if (onRatingChange) {
      setCurrentRating(starValue);
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue) => {
    if (onRatingChange) {
      setHoverRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    if (onRatingChange) {
      setHoverRating(0);
    }
  };

  const stars = [];
  const displayRating = hoverRating || currentRating;

  for (let i = 1; i <= 5; i++) {
    const isActive = i <= displayRating;
    const starClass = isActive ? 'star active' : 'star inactive';
    
    stars.push(
      <span
        key={i}
        className={starClass}
        style={{ 
          fontSize: starSize,
          cursor: onRatingChange ? 'pointer' : 'default',
          color: isActive ? '#ffc107' : '#e4e5e9',
          transition: 'color 0.2s ease',
          margin: '0 2px'
        }}
        onClick={() => onRatingChange && handleStarClick(i)}
        onMouseEnter={() => onRatingChange && handleStarHover(i)}
        onMouseLeave={handleMouseLeave}
      >
        ★
      </span>
    );
  }

  return (
    <div className="stars-container" onMouseLeave={handleMouseLeave}>
      {stars}
      {onRatingChange && (
        <div className="rating-value" style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#666' }}>
          {currentRating}/5
        </div>
      )}
    </div>
  );
};

export default InteractiveStars;