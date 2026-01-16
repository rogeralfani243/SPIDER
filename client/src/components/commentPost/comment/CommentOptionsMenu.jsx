import React, { useRef, useEffect } from 'react';
import { FaEdit, FaTrash, FaThumbtack, FaFlag } from 'react-icons/fa';
import '../../../styles/comment_post/comment_option_menu.css';

const CommentOptionsMenu = ({
  canEdit,
  canDelete,
  canPin,
  isCurrentUserCommentAuthor,
  isPinned,
  showOptions,
  setShowOptions,
  onEdit,
  onDelete,
  onPin,
  onReport
}) => {
  const optionsMenuRef = useRef(null);

  // Fermer le menu en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptions && optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptions, setShowOptions]);

  if (!showOptions) return null;

  return (
    <div className="comment-options-menu" ref={optionsMenuRef}>
      {canEdit && (
        <button onClick={onEdit} className="option-edit">
          <FaEdit /> Edit
        </button>
      )}
      {canDelete && (
        <button onClick={onDelete} className="option-delete">
          <FaTrash /> Delete
        </button>
      )}
      {canPin && (
        <button onClick={onPin} className="option-pin">
          <FaThumbtack /> {isPinned ? "Unpin" : "Pin"}
        </button>
      )}
      {!isCurrentUserCommentAuthor && (
        <button onClick={onReport} className="option-report">
          <FaFlag /> Report
        </button>
      )}
    </div>
  );
};

export default CommentOptionsMenu;