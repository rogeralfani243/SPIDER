import React, {forwardRef} from 'react';
import Comment from '../Comment';
import { PiPushPinFill } from 'react-icons/pi';

const PinnedCommentsSection = ({ 
  showPinned, 
  pinnedComments, 
  postId, 
  currentUser, 
  onUpdate, 
  onDelete, 
  firstCommentId, 
  trendingCommentId 
},ref) => {
  if (!showPinned || !pinnedComments || pinnedComments.length === 0) {
    return null;
  }

  return (
    <div className="pinned-comments-section" ref={ref}>
      <div className="pinned-header">
        <div className="pinned-header-content">
          <div className="pinned-icon-wrapper">
            <PiPushPinFill className="pinned-main-icon" />
          </div>
          <div className="pinned-title-section">
            <h4 className="pinned-comments-title">
              Pinned Comments
              <span className="pinned-count">
                {pinnedComments.length}
              </span>
            </h4>
            <p className="pinned-subtitle">
              Important messages from the post author
            </p>
          </div>
        </div>
        <div className="pinned-divider"></div>
      </div>
      
      <div className="pinned-comments-container">
        {pinnedComments.map(comment => (
          <div 
            key={comment.id} 
            id={`comment-${comment.id}`}
            className="comment-wrapper pinned-comment"
            data-pinned-index={pinnedComments.indexOf(comment) + 1}
          >
            <Comment
              comment={comment}
              postId={postId}
              currentUser={currentUser}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isFirstComment={firstCommentId === comment.id}
              isTrending={trendingCommentId === comment.id}
              isPinned={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PinnedCommentsSection;