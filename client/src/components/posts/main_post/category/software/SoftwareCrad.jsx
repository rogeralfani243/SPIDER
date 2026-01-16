// src/components/posts/main_post/category/SoftwareCard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Star, Download, Eye, MessageCircle, Share2, Image, Video, Music, File, Calendar, User, Package, FileText } from 'lucide-react';
import StarRating from '../../../../main/ui/ratings';
import '../../../../../styles/main_post/software-card-playstore.css';
import DownloadMediaModal from './DownloadManager';
import PostMenu from '../../../PostMenu';
const SoftwareCard = ({ 
  post, 
  currentUser,
  URL,
  onViewDetails,
  onInstall,
  onRatingUpdate,
  onToggleComments,
  onLike,
  onSharePost
}) => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [mediaList, setMediaList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    totalSize: '0 KB',
    images: 0,
    videos: 0,
    audio: 0,
    documents: 0
  });
  const [mainMedia, setMainMedia] = useState(null);
  const [mainMediaType, setMainMediaType] = useState('image');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch les données du media depuis l'API
  useEffect(() => {
    if (post && post.id) {
      fetchMediaData();
    }
  }, [post, URL]);

  const fetchMediaData = async () => {
    if (!post || !post.id || !URL) return;
    
    setIsLoading(true);
    try {
      // Essayer d'abord l'API media-list
      const response = await fetch(`${URL}/post/posts/${post.id}/media-list/`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Mettre à jour la liste des médias
        setMediaList(data.media || []);
        
        // Mettre à jour les statistiques
        setStats({
          total: data.total_media || 0,
          totalSize: data.total_size || '0 KB',
          images: data.statistics?.images || 0,
          videos: data.statistics?.videos || 0,
          audio: data.statistics?.audio || 0,
          documents: data.statistics?.documents || 0
        });
        
        // Déterminer le media principal (premier de la liste)
        if (data.media && data.media.length > 0) {
          const firstMedia = data.media[0];
          setMainMedia(firstMedia.url);
          setMainMediaType(firstMedia.type);
        } else {
          // Fallback: utiliser l'image du post
          const imageUrl = post.image_url || post.image;
          if (imageUrl) {
            setMainMedia(getDirectUrl(imageUrl));
            setMainMediaType('image');
          }
        }
      } else {
        // Fallback: extraire les données du post
        extractMediaFromPost();
      }
    } catch (error) {
      console.error('Error fetching media data:', error);
      // Fallback en cas d'erreur
      extractMediaFromPost();
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback: extraire les données directement du post
  const extractMediaFromPost = () => {
    const extractedMedia = [];
    let mainMediaFound = null;
    let mainMediaTypeFound = 'image';
    
    // 1. Image principale
    if (post.image || post.image_url) {
      const imageUrl = post.image || post.image_url;
      const directUrl = getDirectUrl(imageUrl);
      
      extractedMedia.push({
        id: 'main-image',
        type: 'image',
        name: 'Image principale',
        url: imageUrl,
        directUrl: directUrl,
        size: '300 KB',
        extension: getFileExtension(getFilenameFromUrl(imageUrl)) || 'jpg',
        order: 0
      });
      
      if (!mainMediaFound) {
        mainMediaFound = directUrl;
        mainMediaTypeFound = 'image';
      }
    }
    
    // 2. Images du post (post_images)
    if (post.post_images && Array.isArray(post.post_images)) {
      post.post_images.forEach((img, index) => {
        if (img.image || img.image_url) {
          const imageUrl = img.image || img.image_url;
          const directUrl = getDirectUrl(imageUrl);
          
          extractedMedia.push({
            id: `image-${index}`,
            type: 'image',
            name: `Image ${index + 1}`,
            url: imageUrl,
            directUrl: directUrl,
            size: '500 KB',
            extension: getFileExtension(getFilenameFromUrl(imageUrl)) || 'jpg',
            order: index + 1
          });
          
          if (!mainMediaFound) {
            mainMediaFound = directUrl;
            mainMediaTypeFound = 'image';
          }
        }
      });
    }
    
    // 3. Fichiers du post (post_files)
    if (post.post_files && Array.isArray(post.post_files)) {
      post.post_files.forEach((file, index) => {
        const fileUrl = file.file || file.file_url || file.url;
        if (fileUrl) {
          const directUrl = getDirectUrl(fileUrl);
          const filename = getFilenameFromUrl(fileUrl) || file.name || `file-${index}`;
          const extension = getFileExtension(filename);
          const type = file.file_type || getTypeFromExtension(extension);
          
          extractedMedia.push({
            id: `file-${index}`,
            type: type,
            name: file.name || filename,
            url: fileUrl,
            directUrl: directUrl,
            size: '1 MB',
            extension: extension || 'file',
            order: 100 + index,
            file_type_display: file.file_type_display
          });
          
          if (!mainMediaFound) {
            mainMediaFound = directUrl;
            mainMediaTypeFound = type;
          }
        }
      });
    }
    
    // Calculer les statistiques
    const stats = {
      total: extractedMedia.length,
      totalSize: calculateTotalSize(extractedMedia),
      images: extractedMedia.filter(m => m.type === 'image').length,
      videos: extractedMedia.filter(m => m.type === 'video').length,
      audio: extractedMedia.filter(m => m.type === 'audio').length,
      documents: extractedMedia.filter(m => m.type === 'document').length
    };
    
    setMediaList(extractedMedia);
    setStats(stats);
    
    // Définir le media principal
    if (mainMediaFound) {
      setMainMedia(mainMediaFound);
      setMainMediaType(mainMediaTypeFound);
    }
  };
  // Fonctions pour le menu du post
  const handleEditPost = useCallback((post) => {
    console.log('Editing post:', post.id);
    // Implémentez votre logique d'édition ici
    // Par exemple: navigate(`/edit-post/${post.id}`);
    window.location.href = `/posts/edit/${post.id}/`;
  }, []);

  const handleDeletePost = useCallback((post) => {
    console.log('Deleting post:', post.id);
    // Implémentez votre logique de suppression ici
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      // Appeler votre API de suppression
      alert(`Delete post ${post.id}`);
    }
  }, []);

  const handleReportPost = useCallback((post) => {
    console.log('Reporting post:', post.id);
    // Implémentez votre logique de signalement ici
    alert(`Report post ${post.id}`);
  }, []);

  // Fonctions utilitaires
  const getFilenameFromUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    return url.split('/').pop().split('?')[0];
  };

  const getFileExtension = (filename) => {
    if (!filename || typeof filename !== 'string') return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };

  const getTypeFromExtension = (extension) => {
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
    const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'];
    
    if (imageExts.includes(extension)) return 'image';
    if (videoExts.includes(extension)) return 'video';
    if (audioExts.includes(extension)) return 'audio';
    if (docExts.includes(extension)) return 'document';
    return 'other';
  };

const getDirectUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  // Si déjà URL complète
  if (url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }
  
  // Si l'URL commence avec //
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  
  // Ajouter l'URL de base
  if (URL) {
    const base = URL.endsWith('/') ? URL.slice(0, -1) : URL;
    
    // Si l'URL a déjà le base URL, ne pas le dupliquer
    if (url.startsWith(base)) {
      return url;
    }
    
    // Nettoyer le chemin
    let path = url;
    if (path.startsWith('/')) {
      // Supprimer le slash de début s'il y en a déjà dans l'URL de base
      path = path.substring(1);
    }
    
    // Construire l'URL complète
    return `${base}/${path}`;
  }
  
  return url;
};
  const calculateTotalSize = (items) => {
    if (!items || items.length === 0) return '0 KB';
    
    const sizeMap = {
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };
    
    let totalBytes = 0;
    
    items.forEach(item => {
      if (item.size) {
        const sizeStr = String(item.size);
        const match = sizeStr.match(/(\d+\.?\d*)\s*(KB|MB|GB)/i);
        
        if (match) {
          const value = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          const multiplier = sizeMap[unit] || 1;
          totalBytes += value * multiplier;
        }
      }
    });
    
    if (totalBytes < 1024) {
      return `${totalBytes.toFixed(0)} B`;
    } else if (totalBytes < 1024 * 1024) {
      return `${(totalBytes / 1024).toFixed(1)} KB`;
    } else if (totalBytes < 1024 * 1024 * 1024) {
      return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  };

  // Get user info avec profile ID
  const getUserInfo = () => {
    const profileId = post.user_profile_id || 
                     post.profile_id ||
                     post.user_id ||
                     post.user?.id ||
                     post.author?.id;
    
    const profileImage = post.user_profile_image;
    
    // Construire l'URL du profil
    const profileUrl = profileId ? `/profile/${profileId}` : '#';
    
    return {
      userName: post.user_name || 
                post.username || 
                post.user?.username || 
                post.author?.username ||
                'Unknown Developer',
      profileId: profileId,
      profileImage: profileImage,
      profileUrl: profileUrl,
      userId: post.user_id || 
             post.user?.id || 
             post.author?.id
    };
  };

  // Get category
  const getCategory = () => {
    if (post.category?.name) return post.category.name;
    if (post.category_name) return post.category_name;
    if (post.category_details?.name) return post.category_details.name;
    
    if (post.tags && post.tags.length > 0) {
      const tagNames = post.tags.map(tag => 
        typeof tag === 'object' ? tag.name : tag
      );
      
      const softwareCategories = [
        'productivity', 'social', 'entertainment', 'education', 
        'tools', 'development', 'design', 'business', 'utility'
      ];
      
      const found = tagNames.find(tag => 
        softwareCategories.includes(tag.toLowerCase())
      );
      
      if (found) return found.charAt(0).toUpperCase() + found.slice(1);
    }
    
    return 'Software';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  const handleInstall = () => {
    setShowDownloadModal(true);
  };

  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false);
  };

  const handleViewDetails = () => {
    if (onViewDetails) onViewDetails(post);
  };

  const handleRatingUpdate = useCallback((ratingData) => {
    const userRating = ratingData.userRating || ratingData.user_rating || 0;
    const averageRating = ratingData.averageRating || ratingData.average_rating || 0;
    const totalRatings = ratingData.totalRatings || ratingData.total_ratings || 0;
    
    setLocalPost(prev => ({
      ...prev,
      average_rating: averageRating,
      total_ratings: totalRatings,
      user_rating: userRating
    }));
    
    if (onRatingUpdate) {
      onRatingUpdate(localPost.id, ratingData);
    }
  }, [localPost.id, onRatingUpdate]);

  // Rendu du media principal
  const renderMainMedia = () => {
    if (!mainMedia) {
      return (
        <div className="main-media-placeholder" onClick={handleViewDetails}>
          <div className="placeholder-content">
            <span className="placeholder-icon">📱</span>
            <span className="placeholder-text">No Media</span>
          </div>
        </div>
      );
    }

    const mediaUrl = getDirectUrl(mainMedia);
    
    switch(mainMediaType) {
      case 'image':
        return (
          <img 
            src={mediaUrl}
            alt={post.title || 'Software'}
            className="main-media-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div class="main-media-placeholder"><div class="placeholder-content"><span class="placeholder-icon">📱</span><span class="placeholder-text">Image Error</span></div></div>';
            }}
            onClick={handleViewDetails}
          />
        );
      case 'video':
        return (
          <div className="main-video" onClick={handleViewDetails}>
            <video
                className="video-element-card"
    src={mediaUrl}
    autoPlay
    muted
    loop
    playsInline
    poster="/video-placeholder.png"
  />

      
          </div>
        );
      case 'audio':
        return (
          <div className="main-media-audio" onClick={handleViewDetails}>
            <audio 
              src={mediaUrl}
              className="audio-element"
              controls
            />
            <div className="audio-overlay">
              <Music size={32} />
              <span className="audio-badge">AUDIO</span>
            </div>
          </div>
        );
      case 'document':
        return (
          <div className="main-media-document" onClick={handleViewDetails}>
            <div className="document-content">
              <File size={48} />
              <span className="document-badge">DOCUMENT</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="main-media-other" onClick={handleViewDetails}>
            <div className="other-content">
              <File size={48} />
              <span className="other-badge">FILE</span>
            </div>
          </div>
        );
    }
  };

  const userInfo = getUserInfo();
  const category = getCategory();
  const description = post.content || 'No description available';
  const truncatedDescription = description.length > 120 
    ? `${description.substring(0, 120)}...` 
    : description;

  return (
    <>
      <div className="software-card">
        {/* Rating badge en absolute transparent */}
        <div className="rating-badge-absolute">
          <Star size={14} />
          <span className="rating-value">{localPost.average_rating?.toFixed(1) || '0.0'}</span>
          <span className="rating-count">({localPost.total_ratings || 0})</span>
        </div>
        
        {/* Lien du profil avec photo */}
        <a 
          href={userInfo.profileUrl} 
          className="profile-link-absolute"
          onClick={(e) => {
            if (userInfo.profileUrl === '#') e.preventDefault();
          }}
        >
          {userInfo.profileImage ? (
            <img 
              src={getDirectUrl(userInfo.profileImage)}
              alt={userInfo.userName}
              className="profile-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="profile-placeholder"><User size={16} /></div>';
              }}
            />
          ) : (
            <div className="profile-placeholder">
              <User size={16} />
            </div>
          )}
          <span className="profile-name">{userInfo.userName}</span>
        </a>
        
        {/* Media principal - 100% width */}
        <div className="main-media-section">
          <div className="main-media-container">
            {renderMainMedia()}
            
            {/* Badge Featured si nécessaire */}
            {post.featured && (
              <div className="featured-badge-simple">
                <span>🔥 Featured</span>
              </div>
            )}
          </div>
        </div>

        {/* Contenu en dessous du media */}
        <div className="card-content-simple">
          {/* Titre et Catégorie */}
          <div className="title-section">
            <h3 className="app-title-simple" onClick={handleViewDetails}>
              {post.title || 'Untitled Software'}
            </h3>
            <div className="category-meta">
              <div className="category-badge">
                <Package size={12} />
                <span>{category}</span>
              </div>
              <div className="size-date-info">
              
                <div className="date-info">
                  <Calendar size={12} />
                  <span>{formatDate(post.updated_at || post.created_at)}</span>
                </div>           <PostMenu
  post={localPost}
  currentUser={currentUser}
  onEdit={handleEditPost}
  onDelete={handleDeletePost}
  onReport={handleReportPost}
/>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="description-section-simple">
            <p className="description-text-simple">
              {showFullDescription ? description : truncatedDescription}
            </p>
            {description.length > 120 && (
              <button 
                className="read-more-btn-simple"
                onClick={() => setShowFullDescription(!showFullDescription)}
              >
                {showFullDescription ? 'Show Less' : 'Read More'}
              </button>
            )}
          </div>

         
          {/* Rating interactif */}
          <div >
            <StarRating
              key={`star-rating-${localPost.id}-${localPost.user_rating || 0}`}
              postId={localPost.id}
              initialUserRating={localPost.user_rating}
              averageRating={localPost.average_rating || 0}
              totalRatings={localPost.total_ratings || 0}
              onRatingUpdate={handleRatingUpdate}
              compact={true}
            />
          </div>

          {/* Boutons d'action */}
          <div className="action-buttons-simple">
            
            <button 
              className="download-btn-simple"
              onClick={handleInstall}
              disabled={isLoading}
            >
              <Download size={18} />
              <span>{isLoading ? 'Loading...' : ` (${stats.totalSize})`}</span>
            </button>
            
            <div className="secondary-actions">
              <button 
                className="action-btn-simple"
                onClick={() => onToggleComments && onToggleComments(post.id)}
                title="Comments"
              >
                <MessageCircle size={16} />
                <span className="action-count">{post.comments_count || 0}</span>
              </button>
              
              <button 
                className="action-btn-simple"
                onClick={() => onSharePost && onSharePost(post)}
                title="Share"
              >
                <Share2 size={16} />
              </button>


            </div>
          </div>
        </div>
      </div>
      
      <DownloadMediaModal
        isOpen={showDownloadModal}
        onClose={handleCloseDownloadModal}
        post={post}
        URL={URL}
        onDownloadSelected={(selectedItems) => {
          console.log('Downloading selected items:', selectedItems);
        }}
      />
    </>
  );
};

export default SoftwareCard;