import React from 'react';
import CommentSorter from './comment/CommentSort';

const CommentSectionHeader = ({ 
  totalComments, 
  sortBy, 
  onSortChange, 
  showPinned, 
  onTogglePinned 
}) => {
  // Fonction pour formater le nombre (1K, 1M, etc.)
  const formatCommentCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
  };

  const formattedCount = formatCommentCount(totalComments);
  const displayCount = formattedCount ;

  return (
    <div className="comments-header">
      <div className="comments-title-container">
        <div className="comment-icon-with-count">
          <svg 
            className="comment-icon" 
            viewBox="0 0 48 48" 
            width="40" 
            height="40"
            aria-label={`${totalComments} comments`}
          >
            {/* Fond de l'icône de commentaire */}
            <path 
              d="M40 4H8C5.8 4 4 5.8 4 8V44L12 36H40C42.2 36 44 34.2 44 32V8C44 5.8 42.2 4 40 4Z" 
              fill="#f63b3bff" 
              stroke="#d81d1dff" 
              strokeWidth="1.5"
            />
            
            {/* Texte du nombre de commentaires */}
            <text 
              x="24" 
              y="24" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
              className="icon-count-text"
            >
              {displayCount}
            </text>
            
            {/* Effet de brillance */}
            <path 
              d="M40 4H8C5.8 4 4 5.8 4 8V12H44V8C44 5.8 42.2 4 40 4Z" 
              fill="rgba(255, 255, 255, 0.2)"
            />
          </svg>
        </div>
        
        <div className="comments-title-text">
          <h3 className="comments-title">
            Comments 
          </h3>

        </div>
      </div>
      
      <CommentSorter
        sortBy={sortBy}
        onSortChange={onSortChange}
        showPinned={showPinned}
        onTogglePinned={onTogglePinned}
      />
    </div>
  );
};

export default CommentSectionHeader;