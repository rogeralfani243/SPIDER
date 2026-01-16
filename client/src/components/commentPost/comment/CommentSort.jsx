import React from 'react';
import '../../../styles/comment_post/CommentSorter.css';

const CommentSorter = ({ sortBy, onSortChange, showPinned, onTogglePinned }) => {
  return (
    <div className="comment-sorter">
      {/* Sort dropdown */}
      <div className="sorter-group">
        <span className="sorter-label">Sort by:</span>
        <select 
          value={sortBy} 
          onChange={(e) => onSortChange(e.target.value)}
          className="sorter-select"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="most_liked">Most liked</option>
          <option value="most_replied">Most replied</option>
        </select>
      </div>
      
      {/* Toggle buttons */}
      <div className="sorter-group">
        <button
          className={`sorter-toggle ${sortBy === 'newest' ? 'active' : ''}`}
          onClick={() => onSortChange('newest')}
          title="Show newest comments first"
        >
          ⏰ Newest
        </button>
        
        <button
          className={`sorter-toggle ${sortBy === 'most_liked' ? 'active' : ''}`}
          onClick={() => onSortChange('most_liked')}
          title="Show most liked comments"
        >
          👍 Popular
        </button>
        
        <button
          className={`sorter-toggle ${showPinned ? 'active' : ''}`}
          onClick={onTogglePinned}
          title="Toggle pinned comments"
        >
          {showPinned ? '📌 Pinned' : '📌 Show pinned'}
        </button>
      </div>
      
      {/* Sort info */}
      <div className="sort-info">
        <span className="sort-info-text">
          {sortBy === 'newest' && 'Showing newest comments first'}
          {sortBy === 'oldest' && 'Showing oldest comments first'}
          {sortBy === 'most_liked' && 'Showing most liked comments first'}
          {sortBy === 'most_replied' && 'Showing most replied comments first'}
          {!showPinned && ' • Pinned comments hidden'}
        </span>
      </div>
    </div>
  );
};

export default CommentSorter;