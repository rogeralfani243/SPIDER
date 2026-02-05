// components/post_detail/PostDetail.jsx
import React, { useState, useEffect,useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft,FaEllipsisV } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { useRef } from 'react';
// Custom hooks and components
import { usePost } from '../../hooks/post_detail/usePost';
import { useMedia } from '../../hooks/post_detail/useMedia';
import { useRating } from '../../hooks/post_detail/useRatings';
import PostMenu from './PostMenu';
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
import useParamDrag from '../../utils/useDrag';
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
  const dragBlock = useParamDrag()
  const getCommentIdFromURL = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('comment');
  }; 

  useEffect(() => {
    if (userId && postId) {
      fetchPostDetail();
      fetchMediaData()
      const checkMobile = () => setIsMobile(window.innerWidth <= 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      // Fetch current user info
      fetchCurrentUser();
      fetchPostDetail();
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, [userId, postId, fetchPostDetail]);
const fetchMediaData = async () => {
    if (!post || !post.id || !URL) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${URL}/post/posts/${post.id}/media-list/`);
      
      if (response.ok) {
        const data = await response.json();
        
        setMediaList(data.media || []);
      }
    }
    catch(err){
      console.error(err)
    }
  }
  // Function to get current user
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) {
        const response = await fetch( {
          headers: {
            'Authorization': `Token ${token}`
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
  const handleEditPost = useCallback((post) => {
    console.log('Editing post:', post.id);
    window.location.href = `/posts/edit/${post.id}/`;
  }, []);

  const handleThumbnailClick = (postId, files, clickedIndex) => {
    openGallery(postId, files, clickedIndex);
  };
const handleDeletePost = useCallback((post) => {
    console.log('Deleting post:', post.id);
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      alert(`Delete post ${post.id}`);
    }
  }, []);

  const handleReportPost = useCallback((post) => {
    console.log('Reporting post:', post.id);
    alert(`Report post ${post.id}`);
  }, []);

   // ✅ Validate post exists
  if (!post) {
    return null;
  }

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
    <div className="post-detail-wrapper" {...dragBlock}>
  
      <div className="post-detail-container">
        
        {/* Header avec navigation et actions */}
        <div className="post-header" 
      
  onSelectStart={(e) => e.preventDefault()}
  onContextMenu={(e) => e.preventDefault()}
  onCopy={(e) => e.preventDefault()}
  onDragStart={(e) => e.preventDefault()}
        >
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
              
       

                   
                    <div className="container-download-btn-post-detail">
                 <div  className="post-menu-togge" style={{zIndex:'100'}}>
           <PostMenu
                  post={post}
                  currentUser={currentUser}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                  onReport={handleReportPost}
                  
                          isOpen={showDownloadModal}
        onClose={handleCloseDownloadModal}

        URL={URL}
        onDownloadSelected={(selectedItems) => {
          console.log('Downloading selected items:', selectedItems);
        }}
        isInstall={handleInstall}
        mediaList={mediaList}
        isLoading={isLoading}
                />
    
    </div>
                    </div> 

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