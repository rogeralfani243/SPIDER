// components/post_detail/PostDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft,FaEllipsisV } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { useRef } from 'react';
// Custom hooks and components
import { usePost } from '../../hooks/post_detail/usePost';
import { useMedia } from '../../hooks/post_detail/useMedia';
import { useRating } from '../../hooks/post_detail/useRatings';

// Components
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorDisplay from '../../common/ErrorDisplay';
import UserInfo from './UserInfo';
import PostContent from './PostContent';
import MediaSection from './MediaSection';
import RatingsSection from './RatingsSection';
import DashboardMain from '../dashboard_main.jsx';
import RecentPosts from './RecentPosts';
import ShareMenu from './ShareMenu';
import { Download } from 'lucide-react';
import CommentsSection from '../commentPost/CommentSection';
import URL from '../../hooks/useUrl';
import DownloadMediaModal from './main_post/category/software/DownloadManager';
// Styles
import '../../styles/post_detail/post_detail.css';

const PostDetail = () => {
  const { userId, postId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [activeGallery, setActiveGallery] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  // Custom hooks for state management
  const { post, loading, error, fetchPostDetail, setPost } = usePost(userId, postId);
  const { handleRatingUpdate } = useRating(postId, post, setPost);
  const { getAllMedia } = useMedia(post);
  const [isLoading, setIsLoading] = useState(false);
  // Local state
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
   const [mediaList, setMediaList] = useState([]);
     const [showOptions, setShowOptions] = useState(false);
  // Get media files
  const mediaFiles = getAllMedia();
  const location = useLocation(); // Pour lire les query params
  const commentsSectionRef = useRef(null); // Ref pour le commentaire
    const optionsButtonRef = useRef(null);
  const getCommentIdFromURL = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('comment');
  }; 

  useEffect(() => {
    if (userId && postId) {
      fetchPostDetail();
      const checkMobile = () => setIsMobile(window.innerWidth <= 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      // Fetch current user info
      fetchCurrentUser();
      fetchPostDetail();
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, [userId, postId, fetchPostDetail]);

  // Function to get current user
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) {
        const response = await fetch(`${URL}/api/me/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  // Scroll to comment if commentId is in URL
  useEffect(() => {
    const commentId = getCommentIdFromURL();
    if (commentId && post) {
      // Petit délai pour s'assurer que les commentaires sont chargés
      const timer = setTimeout(() => {
        scrollToComment(commentId);
        
        // Nettoyer l'URL après le scroll (optionnel)
        const newSearchParams = new URLSearchParams(location.search);
        newSearchParams.delete('comment');
        navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
      }, 1000); // Ajustez le délai selon le temps de chargement des commentaires

      return () => clearTimeout(timer);
    }
  }, [post, location.search]); // Dépend de post et location.search

  // Fonction pour scroll vers le commentaire
  const scrollToComment = (commentId) => {
    const commentElement = document.getElementById(`comment-${commentId}`);
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Optionnel: ajouter un highlight temporaire
      commentElement.classList.add('comment-highlight');
      setTimeout(() => {
        commentElement.classList.remove('comment-highlight');
      }, 3000);
    } else {
      console.warn(`Comment with id ${commentId} not found`);
    }
  };

  const toggleExpand = (postId) => {
    setPosts(posts.map((post) =>
      post.id === postId ? { ...post, expanded: !post.expanded } : post
    ));
  };

  const toggleShowAllMedia = (postId) => {
    setPosts(posts.map((post) =>
      post.id === postId ? { ...post, showAllMedia: !post.showAllMedia } : post
    ));
  };

  const openGallery = (postId, files, startIndex = 0) => {
    setActiveGallery({ postId, files, startIndex });
  };
 const handleSharePost = (post) => {
    if (navigator.share) {
      navigator.share({
        title: post.title || 'Post',
        text: post.content?.substring(0, 100) || '',
        url: `${window.location.origin}/post/${post.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      alert('Post link copied to clipboard!');
    }
  };
  const closeGallery = () => {
    setActiveGallery(null);
  };
  const handleInstall = () => {
    // Vérifier s'il y a des fichiers média disponibles
    if (mediaFiles.length === 0) {
      console.log('No media files available for download');
      return;
    }
    
    // Activer le modal de téléchargement
    setShowDownloadModal(true);
  };

  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false);
  };

  // ✅ Validate post exists
  if (!post) {
    return null;
  }
  const handleThumbnailClick = (postId, files, clickedIndex) => {
    openGallery(postId, files, clickedIndex);
  };

  // Render loading state
  if (loading) {
    return <LoadingSpinner message="Loading post..." />;
  }

  // Render error state
  if (error) {
    return <ErrorDisplay error={error} onBack={() => navigate(-1)} />;
  }

  // Render not found state
  if (!post) {
    return (
      <ErrorDisplay 
        error="Post Not Found" 
        message="The post you're looking for doesn't exist or has been removed."
        onBack={() => navigate(-1)}
      />
    );
  }

  return (
    <div className="post-detail-wrapper">
  
      <div className="post-detail-container">
        
        {/* Header avec navigation et actions */}
        <div className="post-header">
          <button 
            onClick={() => navigate(-1)} 
            className="back-button"
          >
            <FaArrowLeft /> Back
          </button>
      
        
        </div>

        <div className="post-detail-layout">
          {/* Colonne principale avec le contenu du post */}
          <div className="post-main-content">
            {/* Contenu principal du post */}
            <div className="post-content">
              
              {/* Section informations utilisateur */}
              <UserInfo 
                userName={post.user_name}
                createdAt={post.created_at}
                profileImage={post.user_profile_image}
                userId={post.user_id || userId}
                profileId={post.user_profile_id}
              />
                <button 
                          ref={optionsButtonRef}
                          className="post-menu-toggles"
                          onClick={() => setShowOptions(!showOptions)}
                        >
                          <FaEllipsisV />
                        </button>

                         {showOptions && (
                    <div className="container-download-btn-post-detail">

                              <div className="download-button-post-section">
      <button 
        className="download-btn-post-detail"
        onClick={handleInstall}
        disabled={isLoading || mediaFiles.length === 0}
        title={mediaFiles.length === 0 ? "No files available" : "Download files"}
      >
        <Download size={18} />
        <span>Download</span>
        {mediaFiles.length > 0 && (
          <span className="file-count-badge">
            {mediaFiles.length}
          </span>
        )}
      </button>
        <ShareMenu 
            post={post} 
            onViewPost={() => {}} 
          />
    </div>
                    </div> )}
  {/* Download modal */}
      <DownloadMediaModal
        isOpen={showDownloadModal}
        onClose={handleCloseDownloadModal}
        post={post}
        URL={URL}
        onDownloadSelected={(selectedItems) => {
          console.log('Downloading selected items:', selectedItems);
        }}
      />
              {/* Titre et contenu du post */}
              <PostContent 
                title={post.title}
                content={post.content}
              />

              {/* Section fichiers média */}
              {mediaFiles.length > 0 && (
                <MediaSection
                  mediaFiles={mediaFiles}
                  activeMediaIndex={activeMediaIndex}
                  onMediaChange={setActiveMediaIndex}
                />
              )}
 
              {/* Section évaluations */}
              <RatingsSection
                post={post}
                onRatingUpdate={handleRatingUpdate}
              />
            </div>
            
            {/* Comments Section */}
            <div className="comments-section-container">
              <CommentsSection
                postId={post.id}
                currentUser={currentUser}
                totalComments={post.comments_count}
              />
            </div>
          </div>
          
          <div className='border'></div>
         
          {/* Sidebar with recent posts */}
          <div className="post-sidebar">
            <RecentPosts 
            profileId={post.user_profile_id}
              userId={userId} 
              maxPosts={5} 
              isMobile={isMobile}
              onToggleExpand={toggleExpand}
              onToggleShowAllMedia={toggleShowAllMedia}
              onThumbnailClick={handleThumbnailClick}
              onOpenGallery={openGallery}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;