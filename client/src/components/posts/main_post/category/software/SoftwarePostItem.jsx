import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../../../../main/ui/ratings';

const SoftwarePostItem = ({ post, onTagClick, onRate, onDeleteRating }) => {
  const [isRating, setIsRating] = useState(false);
  const [userRating, setUserRating] = useState(post.user_rating);

  const handleRate = async (stars) => {
    if (!onRate) return;
    
    setIsRating(true);
    try {
      if (stars === null && userRating) {
        // Delete existing rating
        await onDeleteRating(post.id);
        setUserRating(null);
      } else if (stars !== null) {
        // Add or update rating
        await onRate(post.id, stars);
        setUserRating({ stars });
      }
    } catch (error) {
      console.error('Rating error:', error);
    } finally {
      setIsRating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="software-post-item">
      <div className="post-header">
        <div className="post-author">
          <img
            src={post.user_profile_image || '/default-avatar.png'}
            alt={post.user_name}
            className="author-avatar"
          />
          <div className="author-info">
            <Link to={`/user/${post.user_id}`} className="author-name">
              {post.user_name}
            </Link>
            <span className="post-date">
              <i className="far fa-clock"></i> {formatDate(post.created_at)}
            </span>
          </div>
        </div>
        
        <div className="post-category">
          <span className="category-badge">
            <i className="fas fa-folder"></i> {post.category_name}
          </span>
        </div>
      </div>

      <div className="post-content">
        <Link to={`/post/${post.id}`} className="post-title">
          <h3>{post.title}</h3>
        </Link>
        
        <p className="post-excerpt">
          {truncateContent(post.content)}
        </p>

        {post.image_url && (
          <div className="post-image">
            <img
              src={post.image_url}
              alt={post.title}
              loading="lazy"
            />
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map(tag => (
              <button
                key={tag.id}
                className="post-tag"
                onClick={() => onTagClick?.(tag.name)}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="post-footer">
        <div className="post-rating">
          <StarRating
            rating={post.average_rating}
            userRating={userRating?.stars}
            onRate={handleRate}
            disabled={isRating}
            showCount={true}
            count={post.total_ratings}
          />
          <div className="rating-actions">
            <span className="rating-score">
              {post.average_rating.toFixed(1)}/5
            </span>
            {userRating && (
              <button
                className="btn-remove-rating"
                onClick={() => handleRate(null)}
                disabled={isRating}
              >
                <i className="fas fa-trash-alt"></i> Remove
              </button>
            )}
          </div>
        </div>

        <div className="post-actions">
          <button className="btn-action">
            <i className="far fa-comment"></i> {post.comments_count || 0}
          </button>
          <button className="btn-action">
            <i className="far fa-bookmark"></i> Save
          </button>
          <button className="btn-action">
            <i className="fas fa-share"></i> Share
          </button>
        </div>
      </div>

      {post.files && post.files.length > 0 && (
        <div className="post-files">
          <div className="files-header">
            <i className="fas fa-paperclip"></i> Attachments ({post.files.length})
          </div>
          <div className="files-list">
            {post.files.slice(0, 2).map(file => (
              <a
                key={file.id}
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="file-item"
              >
                <i className={`fas fa-${getFileIcon(file.file_type)}`}></i>
                <span className="file-name">{file.name}</span>
              </a>
            ))}
            {post.files.length > 2 && (
              <span className="more-files">
                +{post.files.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const getFileIcon = (fileType) => {
  switch (fileType) {
    case 'video': return 'file-video';
    case 'audio': return 'file-audio';
    case 'document': return 'file-pdf';
    default: return 'file';
  }
};

export default SoftwarePostItem;