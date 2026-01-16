import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/profile_details/profile_posts.css';
import URL from '../../hooks/useUrl';
import MediaGallery from '../media/MediaGallery';
import FileRenderer from '../media/FileRenderer';
import PostCard from '../posts/PostCard.jsx';
import { FaSync, FaRedo, FaRefresh } from 'react-icons/fa';
const ProfilePosts = ({ profileId, userId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGallery, setActiveGallery] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [layoutMode, setLayoutMode] = useState('grid');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Fonction pour récupérer l'utilisateur connecté - IDENTIQUE À POSTLIST
  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, user not authenticated');
        setCurrentUser(null);
        return;
      }

      // CORRIGEZ L'URL ICI - AJOUTEZ VOTRE ENDPOINT D'AUTH
      const response = await fetch( {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Current user fetched in ProfilePosts:', userData);
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } else {
        console.warn('Failed to fetch current user in ProfilePosts:', response.status);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Error fetching current user in ProfilePosts:', err);
      setCurrentUser(null);
    }
  }, [URL]);

  // Fonction pour récupérer les posts du profil - AJOUT DU TOKEN
  const fetchProfilePosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      console.log('🟡 Fetching posts for user:', userId);
      
      const response = await fetch(`${URL}/post/posts/user/${userId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Token ${token}` })
        }
      });

      console.log('📨 Posts response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Posts data received:', data);
        
        const postsWithInteractions = (data.posts || []).map((post) => ({
          ...post,
          isLiked: false,
          likesCount: post.likes_count || 0,
          showComments: false,
          comments: [],
          newComment: '',
          expanded: false,
          showAllMedia: false
        }));
        
        postsWithInteractions.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        
        setPosts(postsWithInteractions);
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch posts');
      }
    } catch (err) {
      console.error('❌ Error fetching profile posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, URL]);

  // Effet pour charger l'utilisateur et les posts - SIMILAIRE À POSTLIST
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchCurrentUser();
      await fetchProfilePosts();
    };
    
    loadInitialData();
    
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setLayoutMode(mobile ? 'list' : 'grid');
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [fetchCurrentUser, fetchProfilePosts]);

  // ... (les autres fonctions restent les mêmes) ...

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

  const closeGallery = () => {
    setActiveGallery(null);
  };

  const handleThumbnailClick = (postId, files, clickedIndex) => {
    openGallery(postId, files, clickedIndex);
  };

  const renderFile = (fileUrl) => {
    return <FileRenderer fileUrl={fileUrl} URL={URL} />;
  };

  const handlePostClick = (postId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const post = posts.find(p => p.id === postId);
    if (post && postId) {
      const postUserId = post.user?.id || post.user_id || post.user;
      console.log('🚀 Navigation depuis ProfilePosts:', { postUserId, postId });
      window.location.href = `/user/${postUserId}/posts/${postId}`;
    }
  };

  const handleLayoutToggle = () => {
    setLayoutMode(layoutMode === 'grid' ? 'list' : 'grid');
  };

  // Ajoutez ces fonctions pour gérer les actions du post (optionnel)
  const handleEditPost = (post) => {
    console.log('Edit post requested:', post.id);
    navigate(`/posts/edit/${post.id}`);
  };

  const handleDeletePost = async (post) => {
    const token = localStorage.getItem('token');
    
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${URL}/post/posts/${post.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        },
      });

      if (response.ok) {
        alert('Post deleted successfully');
        fetchProfilePosts(); // Rafraîchir les posts
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert(err.message || 'Failed to delete post');
    }
  };

  const handleReportPost = async (post, reason) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('You must be logged in to report a post');
      return;
    }

    try {
      const response = await fetch(`${URL}/post/posts/${post.id}/report/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason }),
      });

      if (response.ok) {
        alert('Post reported successfully');
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to report post');
      }
    } catch (err) {
      console.error('Error reporting post:', err);
      alert(err.message || 'Failed to report post');
      return false;
    }
  };

  const featuredPost = posts.length > 0 ? posts[0] : null;

  if (loading) {
    return (
      <div className="profile-posts-section">
        <h2 className="section-title">Posts</h2>
        <div className="loading-posts">
          <div className="loading-spinner"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-posts-section">
        <h2 className="section-title">Posts</h2>
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <h3>Unable to load posts</h3>
          <p>{error}</p>
          <button onClick={fetchProfilePosts} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-posts-section">
      {activeGallery && (
        <MediaGallery 
          files={activeGallery.files} 
          onClose={closeGallery}
          renderFile={renderFile}
          startIndex={activeGallery.startIndex}
        />
      )}
      
      <div className="section-header">
        <h2 className="section-titles-bio">
          Posts 
          <span className="posts-count-profile">({posts.length})</span>
        </h2>
        
        <div className="section-controls">
          {posts.length > 1 && (
            <button 
              onClick={handleLayoutToggle}
              className="layout-toggle-btn"
              title={`Switch to ${layoutMode === 'list' ? 'list' : 'grid'} view`}
            >
              {layoutMode === 'list' ? '☷ List View' : '☰ Grid View'}
            </button>
          )}
          
<button 
  onClick={fetchProfilePosts} 
  className="refresh-btn"
  title="Refresh posts"
>
  <FaSync className="refresh-icon" />
</button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="no-posts">
          <div className="no-posts-icon">📝</div>
          <h3>No posts yet</h3>
          <p>This user hasn't created any posts.</p>
        </div>
      ) : (
        <div className={`posts-container ${layoutMode}`}>
          {featuredPost && layoutMode === 'grid' && (
            <div className="featured-post-container">
              <div className="featured-label">
                <span>✨ LATEST POST</span>
              </div>
              <div 
                className="post-card featured"
                role="button"
                tabIndex={0}
              >
                <PostCard
                  currentUser={currentUser} // ← PASSÉ ICI
                  post={featuredPost}
                  URL={URL}
                  isMobile={isMobile}
                  onToggleExpand={toggleExpand}
                  onToggleShowAllMedia={toggleShowAllMedia}
                  onThumbnailClick={handleThumbnailClick}
                  onOpenGallery={openGallery}
                  onEditPost={handleEditPost} // ← AJOUTÉ
                  onDeletePost={handleDeletePost} // ← AJOUTÉ
                  onReportPost={handleReportPost} // ← AJOUTÉ
                  isFeatured={true}
                />
              </div>
            </div>
          )}

          <div className={`posts-${layoutMode}`}>
            {posts.map((post, index) => {
              if (layoutMode === 'grid' && index === 0) return null;
              
              return (
                <div 
                  key={post.id} 
                  className={`post-card ${layoutMode === 'grid' ? 'grid-item' : 'list-item'}`}
                  role="button"
                  tabIndex={0}
                >
                  {index === 1 && layoutMode === 'grid' && (
                    <div className="trending-label">
                      <span>🔥 TRENDING</span>
                    </div>
                  )}
                  
                  <PostCard
                    currentUser={currentUser} // ← PASSÉ ICI
                    post={post}
                    URL={URL}
                    isMobile={isMobile}
                    onToggleExpand={toggleExpand}
                    onToggleShowAllMedia={toggleShowAllMedia}
                    onThumbnailClick={handleThumbnailClick}
                    onOpenGallery={openGallery}
                    onEditPost={handleEditPost} // ← AJOUTÉ
                    onDeletePost={handleDeletePost} // ← AJOUTÉ
                    onReportPost={handleReportPost} // ← AJOUTÉ
                    isCompact={layoutMode === 'grid'}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePosts;