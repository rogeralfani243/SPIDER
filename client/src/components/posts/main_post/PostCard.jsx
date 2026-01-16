// src/components/posts/PostCard.jsx
import React, { useState } from 'react';
import PostActions from './PostActions.jsx';

const PostCard = ({ post, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} j`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  // Truncate content
  const truncateContent = (content, maxLength = 200) => {
    if (content.length <= maxLength || expanded) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="post-card">
      {/* En-tête du post */}
      <div className="post-header">
        <div className="user-info">
          <div className="user-avatar">
            {post.user_profile_image ? (
              <img src={post.user_profile_image} alt={post.user_name} />
            ) : (
              <div className="avatar-placeholder">
                {post.user_name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-details">
            <h4 className="username">{post.user_name}</h4>
            <span className="post-time">
              <i className="far fa-clock"></i> {formatDate(post.created_at)}
            </span>
          </div>
        </div>
        
        <div className="post-actions-dropdown">
          <button 
            className="btn-more"
            onClick={() => setShowActions(!showActions)}
          >
            <i className="fas fa-ellipsis-v"></i>
          </button>
          
          {showActions && (
            <PostActions 
              post={post}
              onClose={() => setShowActions(false)}
              onUpdate={onUpdate}
            />
          )}
        </div>
      </div>

      {/* Catégorie */}
      {post.category && (
        <div className="post-category">
          <span className="category-badge">
            <i className="fas fa-tag"></i> {post.category_name}
          </span>
        </div>
      )}

      {/* Titre et contenu */}
      <div className="post-body">
        <h3 className="post-title">{post.title}</h3>
        
        <div className="post-content">
          <p>{truncateContent(post.content)}</p>
          {post.content.length > 200 && !expanded && (
            <button 
              className="btn-read-more"
              onClick={() => setExpanded(true)}
            >
         see more <i className="fas fa-chevron-down"></i>
            </button>
          )}
        </div>

        {/* Lien attaché */}
        {post.link && (
          <div className="post-link">
            <a 
              href={post.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="link-preview"
            >
              <i className="fas fa-link"></i>
              <span>{post.link.replace(/^https?:\/\//, '')}</span>
            </a>
          </div>
        )}
      </div>

      {/* Images */}
      {post.image_url && (
        <div className="post-media">
          <img 
            src={post.image_url} 
            alt={post.title}
            className="post-image"
            loading="lazy"
          />
        </div>
      )}

      {/* Fichiers attachés */}
      {post.file_url && (
        <div className="post-attachments">
          <div className="attachment-item">
            <i className="fas fa-file"></i>
            <span>Fichier joint</span>
            <a 
              href={post.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-download"
            >
              <i className="fas fa-download"></i>
            </a>
          </div>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map(tag => (
            <span key={tag.id} className="tag">
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Statistiques et actions */}
      <div className="post-footer">
        <div className="post-stats">
          <div className="stat-item">
            <i className="fas fa-star"></i>
            <span>{post.average_rating?.toFixed(1) || '0.0'}</span>
            <small>({post.total_ratings || 0})</small>
          </div>
          
          <div className="stat-item">
            <i className="far fa-comment"></i>
            <span>0</span>
          </div>
          
          <div className="stat-item">
            <i className="far fa-eye"></i>
            <span>0</span>
          </div>
        </div>

        <div className="post-actions">
          <button className="btn-action">
            <i className="far fa-thumbs-up"></i>
            <span>J'aime</span>
          </button>
          
          <button className="btn-action">
            <i className="far fa-comment"></i>
            <span>Commenter</span>
          </button>
          
          <button className="btn-action">
            <i className="fas fa-share"></i>
            <span>Partager</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;