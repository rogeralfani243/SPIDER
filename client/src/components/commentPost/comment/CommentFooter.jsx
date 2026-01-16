import React, { useRef } from 'react';
import { FaHeart, FaReply, FaCaretDown, FaCaretUp } from 'react-icons/fa';

const CommentFooter = ({
  isLiked,
  likeAnimation,
  isLiking,
  token,
  comment,
  showReplies,
  handleLike,
  handleReply,
  setShowReplies,
  heartRef,
  likeBtnRef,
  particles
}) => {
  const replyBtnRef = useRef(null);
  
  const handleReplyClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Supprime rapidement le focus pour éviter l'effet bleu
    if (replyBtnRef.current) {
      replyBtnRef.current.blur();
    }
    
    // Appelle la fonction handleReply
    handleReply();
  };

  return (
    <div className="comment-footer">
      {/* Bouton like avec animations */}
      <button 
        ref={likeBtnRef}
        className={`comment-like-btn ${isLiked ? "liked" : ""}`}
        onClick={handleLike}
        disabled={isLiking || !token}
        title={isLiked ? "Unlike" : "Like"}
      >
        <div className="heart-container">
          <div className="heart-fill"></div>
          <FaHeart 
            ref={heartRef}
            className="heart-icon" 
            style={{
              transform: isLiked && likeAnimation ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.2s ease'
            }}
          />
        </div>
        
        <span className={`like-count ${likeAnimation ? "like-count-pop" : ""}`}>
          {comment.likes_count || 0}
        </span>
        
        {likeAnimation && !isLiked && (
          <div className="new-like-indicator"></div>
        )}
        
        {particles.length > 0 && (
          <div className="heart-particles">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="heart-particle"
                style={{
                  '--tx': `${particle.tx}px`,
                  '--ty': `${particle.ty}px`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  backgroundColor: particle.color,
                  animation: `particleExplosion 0.8s ease ${particle.delay}s forwards`
                }}
              />
            ))}
          </div>
        )}
      </button>

      <button 
        ref={replyBtnRef}
        className="comment-reply-btn"
        onClick={handleReplyClick}
        onMouseDown={(e) => e.stopPropagation()} // Empêche la propagation
        onTouchStart={(e) => e.stopPropagation()} // Pour mobile
        disabled={!token}
      >
        <FaReply /> Reply
      </button>

      {/* Show/Hide Replies button with counter */}
      {comment.reply_count > 0 && (
        <button 
          className="comment-show-replies-btn"
          onClick={() => setShowReplies(!showReplies)}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {showReplies ? (
            <>
              <FaCaretUp /> Hide {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
            </>
          ) : (
            <>
              <FaCaretDown /> Show {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default CommentFooter;