// components/commentPost/CommentActions.jsx
import React from 'react';
import '../../styles/comment_post/CommentActions.css';

const CommentActions = ({ 
  isOwner, 
  hasLiked, 
  likesCount, 
  onLike, 
  onEdit, 
  onDelete, 
  onReply, 
  showReply, 
  depth 
}) => {
  return (
    <div className="comment-actions">
      {/* Bouton Like */}
      <button 
        className={`comment-action-btn like-btn ${hasLiked ? 'active' : ''}`}
        onClick={onLike}
        title={hasLiked ? 'Unlike' : 'Like'}
        aria-label={hasLiked ? 'Unlike comment' : 'Like comment'}
      >
        <span className="action-icon">
          {hasLiked ? '❤️' : '🤍'}
        </span>
        {likesCount > 0 && (
          <span className="action-count">{likesCount}</span>
        )}
        <span className="action-text">
          {hasLiked ? 'Liked' : 'Like'}
        </span>
      </button>
      
      {/* Bouton Reply */}
      {showReply && (
        <button 
          className="comment-action-btn reply-btn"
          onClick={onReply}
          title="Reply to comment"
          aria-label="Reply to comment"
        >
          <span className="action-icon">💬</span>
          <span className="action-text">Reply</span>
        </button>
      )}
      
      {/* Actions du propriétaire */}
      {isOwner && (
        <>
          <button 
            className="comment-action-btn edit-btn"
            onClick={onEdit}
            title="Edit comment"
            aria-label="Edit comment"
          >
            <span className="action-icon">✏️</span>
            <span className="action-text">Edit</span>
          </button>
          
          <button 
            className="comment-action-btn delete-btn"
            onClick={onDelete}
            title="Delete comment"
            aria-label="Delete comment"
          >
            <span className="action-icon">🗑️</span>
            <span className="action-text">Delete</span>
          </button>
        </>
      )}
    </div>
  );
};

export default CommentActions;