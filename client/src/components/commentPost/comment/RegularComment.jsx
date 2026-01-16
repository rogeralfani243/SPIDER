import React from 'react';
import Comment from '../Comment';
import { forwardRef } from 'react';
const RegularCommentsSection = ({ 
  regularComments, 
  showPinned, 
  pinnedComments, 
  onShowPinned,
  postId, 
  currentUser, 
  onUpdate, 
  onDelete, 
  firstCommentId, 
  trendingCommentId 
}, ref) => {
  if (!regularComments || regularComments.length === 0) {
    return null;
  }

  return (
    <div className="regular-comments-section" ref={ref}>
      {!showPinned && pinnedComments && pinnedComments.length > 0 && (
        <div className="pinned-hidden-notice">
          <span className="notice-icon">📌</span>
          <span className="notice-text">
            {pinnedComments.length} pinned comment{pinnedComments.length !== 1 ? 's' : ''} hidden
          </span>
          <button 
            className="show-pinned-btn"
            onClick={onShowPinned}
          >
            Show
          </button>
        </div>
      )}
      
      {/* Regular comments list */}
      {regularComments.map(comment => (
        <div 
          key={comment.id} 
          id={`comment-${comment.id}`}
          className="comment-wrapper"
        >
          <Comment
            comment={comment}
            postId={postId}
            currentUser={currentUser}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isFirstComment={firstCommentId === comment.id}
            isTrending={trendingCommentId === comment.id}
          />
        </div>
      ))}
    </div>
  );
};

export default RegularCommentsSection;