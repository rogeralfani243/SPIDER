import React from 'react';
import { Link } from 'react-router-dom';
import { FaEllipsisH, FaEdit, FaTrash, FaThumbtack, FaFlag } from 'react-icons/fa';
import ReportButton from '../../reports/ReportButton';
const CommentHeader = ({
  comment,
  localCurrentUser,
  formatDate,
  getProfileUrl,
  getDisplayName,
  isCurrentUserCommentAuthor,
  optionsButtonRef,
  showOptions,
  setShowOptions,
  optionsMenuRef,
  canEdit,
  canDelete,
  canPin,
  handleEdit,
  handleDelete,
  handlePin,
  handleReport
}) => {
  return (
    <div className="comment-header">
      <div className="comment-user">
        {/* Avatar cliquable vers le profil */}
        <Link 
          to={getProfileUrl(comment.user)}
          className="comment-avatar-link"
          onClick={(e) => {
            window.location.href = getProfileUrl(comment.user);
            e.stopPropagation();
     
            console.log('Navigating to user profile via avatar:', comment.user);
          }}
          title={`View ${getDisplayName(comment.user)}'s profile`}
        >
          <img 
            src={comment.user?.profile_picture || "/default-avatar.png"}
            onError={(e) => { e.target.src = "/default-avatar.png"; }}
            alt={`${getDisplayName(comment.user)}'s avatar`}
            className="comment-avatar"
          />
        </Link>

        <div className="comment-user-info">
          {/* Lien vers le profil avec ID */}
          <Link 
            to={getProfileUrl(comment.user)}
            className="comment-username-link"
            onClick={(e) => { 
              window.location.href = getProfileUrl(comment.user);
              e.stopPropagation();
              e.preventDefault();
            }}
            title={`View ${getDisplayName(comment.user)}'s profile`}
          >
            <span className="comment-username">
              {getDisplayName(comment.user)}
              {isCurrentUserCommentAuthor && (
                <span className="comment-author-badge"> You</span>
              )}
            </span>
          </Link>
          <span className="comment-date">
            {formatDate(comment.created_at)}
            {comment.is_edited && " • Edited"}
          </span>
        </div>
      </div>

      <div className="comment-actions">
        <div className="comment-options">
          <button 
            ref={optionsButtonRef}
            className="comment-options-toggle"
            onClick={() => setShowOptions(!showOptions)}
          >
            <FaEllipsisH />
          </button>

          {showOptions && (
            <div className="comment-options-menu" ref={optionsMenuRef}>
              {canEdit && (
                <button onClick={handleEdit} className="option-edit">
                  <FaEdit /> Edit
                </button>
              )}
              {canDelete && (
                <button onClick={handleDelete} className="option-delete">
                  <FaTrash /> Delete
                </button>
              )}
              {canPin && (
                <button onClick={handlePin} className="option-pin">
                  <FaThumbtack /> {comment.is_pinned ? "Unpin" : "Pin"}
                </button>
              )}
              
              {!isCurrentUserCommentAuthor && (
                         <ReportButton
                contentType="comment"
                contentId={comment.id}
                contentAuthorId={comment.user_id || comment.user?.id}
                contentObject={comment}
                buttonVariant="text"
                showIcon={false}
                showText={false}
                className="w-100 text-start p-0 border-0 bg-transparent"
                onReported={handleReport}
              >
                
                <FaFlag className="menu-icon" />
                <span>Report</span>
              </ReportButton>

              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentHeader;