import React from 'react';
import { FaPaperPlane } from 'react-icons/fa';

const PostComments = ({ post, onAddComment, onCommentChange }) => {
  return (
    <div className="comments-section">
      {post.comments.length > 0 && (
        <div className="comment-list">
          {post.comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">{comment.user.avatar}</div>
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-username">
                    @{comment.user.username}
                  </span>
                  <span className="comment-timestamp">
                    {comment.timestamp}
                  </span>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => onAddComment(post.id, e)}
        className="comment-form"
      >
        <input
          type="text"
          placeholder="Add a comment..."
          value={post.newComment}
          onChange={(e) => onCommentChange(post.id, e.target.value)}
          className="comment-input"
        />
        <button
          type="submit"
          disabled={!post.newComment.trim()}
          className="send-button"
        >
          <FaPaperPlane size={14} />
        </button>
      </form>
    </div>
  );
};

export default PostComments;