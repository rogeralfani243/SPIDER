// components/posts/RecentPosts.jsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaClock, 
  FaUser, 
  FaFileAlt, 
  FaImage, 
  FaVideo, 
  FaMusic, 
  FaExclamationTriangle,
  FaFilePdf,
  FaPlay,
  FaEye
} from 'react-icons/fa';
import { useRecentPosts } from '../../hooks/post_detail/useRecentPosts';
import URL from '../../hooks/useUrl';
import PostCard from './PostCard';

// Helper function to safely get URL from file or string
const getSafeUrl = (item) => {
  if (!item) return null;
  
  // If it's already a string (URL), return it
  if (typeof item === 'string') return item;
  
  // If it's an object, extract URL
  if (typeof item === 'object') {
    return item.url || item.file_url || item.file || item.image || null;
  }
  
  return null;
};

// Helper function to safely get file extension
const getFileExtension = (item) => {
  const url = getSafeUrl(item);
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Get the filename from URL
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const cleanName = filename.split('?')[0]; // Remove query parameters
    
    // Extract extension
    const extensionParts = cleanName.split('.');
    if (extensionParts.length > 1) {
      return extensionParts.pop().toLowerCase();
    }
    return null;
  } catch (e) {
    return null;
  }
};

// Helper function to check if URL starts with http
const isFullUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

const RecentPosts = ({ 
  userId, 
  profileId,
  maxPosts = 5, 
  excludeCurrentPost = true, 
  isMobile, 
  onToggleExpand, 
  onToggleShowAllMedia, 
  onThumbnailClick, 
  onOpenGallery 
}) => {
  const navigate = useNavigate();
  const { postId: currentPostId } = useParams(); // Récupère le postId actuel depuis l'URL
  
  // Utilise le hook avec exclusion du post actuel
  const { recentPosts, userInfo, loading, error, refetch } = useRecentPosts(
    userId, 
    excludeCurrentPost ? currentPostId : null
  );
  
  const [imageErrors, setImageErrors] = useState({});

  // Fonction pour obtenir le type de média et l'URL complète
  const getMediaInfo = (post) => {
    const media = [];
    
    // Image principale - SAFELY
    if (post.image) {
      const imageUrl = getSafeUrl(post.image);
      if (imageUrl) {
        const fullImageUrl = isFullUrl(imageUrl) ? imageUrl : `${URL}${imageUrl}`;
        media.push({
          type: 'image',
          url: fullImageUrl,
          thumbnail: fullImageUrl,
          isMainImage: true
        });
      }
    }
    
    // Fichiers attachés - SAFELY
    if (post.files) {
      let filesArray = [];
      
      // Handle different formats
      if (Array.isArray(post.files)) {
        filesArray = post.files;
      } else if (post.files && typeof post.files === 'object') {
        filesArray = [post.files];
      } else if (typeof post.files === 'string') {
        filesArray = [post.files];
      }
      
      filesArray.forEach(file => {
        const fileUrl = getSafeUrl(file);
        if (fileUrl) {
          const fullFileUrl = isFullUrl(fileUrl) ? fileUrl : `${URL}${fileUrl}`;
          const extension = getFileExtension(file);
          
          let type = 'document';
          if (extension) {
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
              type = 'image';
            } else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) {
              type = 'video';
            } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
              type = 'audio';
            } else if (extension === 'pdf') {
              type = 'pdf';
            }
          }
          
          media.push({
            type,
            url: fullFileUrl,
            thumbnail: type === 'image' ? fullFileUrl : null,
            extension,
            fileData: typeof file === 'object' ? file : null
          });
        }
      });
    }
    
    return media;
  };

  // Rendu des miniatures
  const renderThumbnails = (post) => {
    const media = getMediaInfo(post);
    const visibleMedia = media.slice(0, 3);
    
    if (visibleMedia.length === 0) return null;

    return (
      <div className="post-thumbnails">
        {visibleMedia.map((item, index) => (
          <div key={index} className={`thumbnail ${item.type}`}>
            {item.type === 'image' && item.thumbnail ? (
              <img 
                src={item.thumbnail} 
                alt={`Thumbnail ${index + 1}`}
                className="thumbnail-image"
                onError={(e) => {
                  setImageErrors(prev => ({ ...prev, [`${post.id}-${index}`]: true }));
                  e.target.style.display = 'none';
                }}
              />
            ) : item.type === 'video' ? (
              <div className="video-thumbnail">
                <FaPlay className="play-icon" />
                <span className="file-extension">{item.extension || 'vid'}</span>
              </div>
            ) : item.type === 'audio' ? (
              <div className="audio-thumbnail">
                <FaMusic className="audio-icon" />
                <span className="file-extension">{item.extension || 'aud'}</span>
              </div>
            ) : item.type === 'pdf' ? (
              <div className="pdf-thumbnail">
                <FaFilePdf className="pdf-icon" />
                <span className="file-extension">PDF</span>
              </div>
            ) : (
              <div className="document-thumbnail">
                <FaFileAlt className="document-icon" />
                <span className="file-extension">{item.extension || 'doc'}</span>
              </div>
            )}
          </div>
        ))}
        
        {media.length > 3 && (
          <div className="thumbnail-more">
            +{media.length - 3}
          </div>
        )}
      </div>
    );
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  // Truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'No content';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Gestion du clic sur un post
  const handlePostClick = (postId) => {
    console.log('🖱️ Navigating to post:', postId);
    
    // Solution simple qui fonctionne
    window.location.href = `/user/${userId}/posts/${postId}`;
  };

  if (loading) {
    return (
      <div className="recent-posts-loading">
        <div className="loading-spinner-small"></div>
        <p>Loading recent posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recent-posts-error">
        <FaExclamationTriangle className="error-icon" />
        <p className="error-message">{error}</p>
        <button onClick={refetch} className="retry-button">
          Try Again
        </button>
        <div className="debug-info">
          <small>User ID: {userId}</small>
          {currentPostId && <small>Current Post ID: {currentPostId}</small>}
        </div>
      </div>
    );
  }

  if (!recentPosts || recentPosts.length === 0) {
    return (
      <div className="recent-posts-empty">
        <FaFileAlt className="empty-icon" />
        <p>No recent posts found</p>
        <span>This user hasn't posted anything recently.</span>
      </div>
    );
  }
  
  return (
    <div className="recent-posts-container">
      <div className="recent-posts-header">
        <h3 className="recent-posts-title">
          <FaClock className="title-icon" />
          User’s Recent Posts
          {recentPosts.length > 0 && (
            <span className="posts-count">({recentPosts.length})</span>
          )}
        </h3>
      </div>

      <div className="recent-posts-list">
        {recentPosts.slice(0, maxPosts).map((post) => {
          return (
            <div
              key={post.id}
              className="recent-post-car"
             
              style={{ cursor: 'pointer' }}
            >
    

                <PostCard
                
                  post={post}
                  URL={URL}
                  isMobile={isMobile}
                  onToggleShowAllMedia={onToggleShowAllMedia}
                  onThumbnailClick={onThumbnailClick}
                  onOpenGallery={onOpenGallery}
                />

    

           

     
            </div>
          );
        })}
      </div>

      {recentPosts.length > maxPosts && (
        <div className="recent-posts-footer">
          <a 
            className="view-all-posts"
           href={`/profile/${profileId}/#profilePost`}
          >
            View All Posts ({recentPosts.length})
          </a>
        </div>
      )}
    </div>
  );
};

export default RecentPosts;