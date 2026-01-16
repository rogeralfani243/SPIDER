import React from 'react';

const StaticStars = ({ rating, size = 'medium' }) => {
  const starSize = {
    small: '1rem',
    medium: '1.5rem',
    large: '2rem'
  }[size];

  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.3 && rating % 1 <= 0.7;
  const hasFullExtraStar = rating % 1 > 0.7;

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} className="star full" style={{ fontSize: starSize }}>
        ★
      </span>
    );
  }

  if (hasHalfStar) {
    stars.push(
      <span key="half" className="star half" style={{ fontSize: starSize }}>
        ★
      </span>
    );
  } else if (hasFullExtraStar) {
    stars.push(
      <span key="extra-full" className="star full" style={{ fontSize: starSize }}>
        ★
      </span>
    );
  }

  const totalDisplayedStars = stars.length;
  const emptyStars = 5 - totalDisplayedStars;

  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span key={`empty-${i}`} className="star empty" style={{ fontSize: starSize }}>
        ★
      </span>
    );
  }

  return (
    <div className="stars-container">
      {stars}
      <span className="rating-number" style={{ marginLeft: '8px', fontSize: '0.9rem', color: '#666' }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

export default StaticStars;