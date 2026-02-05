// src/components/posts/PostList.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../../../styles/main_post/posts.css';
import URL from '../../../hooks/useUrl';
import PostCard from '../PostCard';
import PostFilters from './PostFilters';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardMain from '../../dashboard_main';
import CategoryList from './CategoryList';
import useParamDrag from '../../../utils/useDrag';
// Composant pour le sélecteur d'algorithme
import AlgorithmSelector from './AlgorithmSelector';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPosts, setTotalPosts] = useState(0);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    algorithm: 'recommended', // Nouveau: algorithme de recommandation
    sort: 'newest',
    tag: '',
    user: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const dragBlock = useParamDrag()
  // Nouveau: métadonnées de l'algorithme
  const [algorithmInfo, setAlgorithmInfo] = useState(null);
  const [userContext, setUserContext] = useState(null);
  const [paginationMeta, setPaginationMeta] = useState(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedPostRef = useRef(null);

  // Fonction pour récupérer l'utilisateur connecté
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, user not authenticated');
        setCurrentUser(null);
        return;
      }

      const response = await fetch({
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: false, 
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Current user fetched:', userData);
        setCurrentUser(userData);
        
        // Stocker aussi dans localStorage pour une utilisation facile
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } else {
        console.warn('Failed to fetch current user:', response.status);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      setCurrentUser(null);
    }
  };

  // Fonction pour récupérer les posts avec l'algorithme de recommandation
  const fetchPosts = useCallback(async (reset = false, customFilters = null) => {
    try {
      if (reset) {
        setRefreshing(true);
        setPage(1);
      }
      
      const token = localStorage.getItem('token');
      const currentFilters = customFilters || filters;
      
      console.log('🔍 Current filters:', currentFilters);
      console.log('🤖 Using algorithm:', currentFilters.algorithm);
      
      // Construire les paramètres pour l'API de recommandation
      const params = new URLSearchParams({
        page: reset ? 1 : page,
        page_size: 20,
        algorithm: currentFilters.algorithm || 'recommended', // Paramètre algorithm
      });
      
      // Ajouter la catégorie SEULEMENT si elle existe et n'est pas vide
      if (currentFilters.category && currentFilters.category !== '') {
        params.append('category', currentFilters.category);
        console.log(`🔍 Adding category filter: ${currentFilters.category}`);
      }
      
      // Ajouter la recherche SEULEMENT si elle existe et n'est pas vide
      if (currentFilters.search && currentFilters.search.trim() !== '') {
        params.append('search', currentFilters.search.trim());
        console.log(`🔍 Adding search filter: "${currentFilters.search}"`);
      }
      
      // Ajouter le tag SEULEMENT si spécifié
      if (currentFilters.tag && currentFilters.tag.trim() !== '') {
        params.append('tag', currentFilters.tag.trim());
        console.log(`🔍 Adding tag filter: "${currentFilters.tag}"`);
      }
      
      // Ajouter l'utilisateur SEULEMENT si spécifié
      if (currentFilters.user && currentFilters.user.trim() !== '') {
        params.append('user', currentFilters.user.trim());
        console.log(`🔍 Adding user filter: "${currentFilters.user}"`);
      }
      
      // Pour les algorithmes spéciaux, on utilise l'endpoint principal
      // car l'algorithme est géré côté backend
      const url = `${URL}/post/posts/?${params.toString()}`;
      
      console.log('📡 Fetching from:', url);
      console.log('📊 Parameters:', params.toString());
      
      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        },
        withCredentials: false, 
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 API Response received:', data);
      console.log('📊 Posts count:', data.posts?.length || 0);
      
      // Mettre à jour les métadonnées
      if (data.pagination) {
        setPaginationMeta(data.pagination);
        setTotalPosts(data.pagination.total_posts || 0);
        setHasMore(data.pagination.has_next || false);
      }
      
      if (data.algorithm_info) {
        setAlgorithmInfo(data.algorithm_info);
      }
      
      if (data.user_context) {
        setUserContext(data.user_context);
      }
      
      if (data.filters) {
        console.log('🎯 Active filters from backend:', data.filters);
      }
      
      // GESTION DES POSTS
      let postsArray = [];
      
      if (Array.isArray(data)) {
        postsArray = data;
      } else if (data.posts && Array.isArray(data.posts)) {
        postsArray = data.posts;
      } else if (data.results && Array.isArray(data.results)) {
        postsArray = data.results;
      } else if (Array.isArray(data.data)) {
        postsArray = data.data;
      } else {
        // Chercher un tableau dans l'objet
        for (const key in data) {
          if (Array.isArray(data[key])) {
            postsArray = data[key];
            break;
          }
        }
      }
      
      console.log(`📊 Extracted ${postsArray.length} posts`);
      
      // Ajouter les informations d'algorithme à chaque post
      const enrichedPosts = postsArray.map(post => ({
        ...post,
        algorithm_info: data.algorithm_info,
        recommendation_score: post.recommendation_score || 0,
        country_score: post.country_score || 0,
        user_context: data.user_context
      }));
      
      // Mettre à jour l'état
      if (reset) {
        setPosts(enrichedPosts);
      } else {
        setPosts(prev => [...prev, ...enrichedPosts]);
      }
      
      // Gérer hasMore si pas de pagination dans la réponse
      if (!data.pagination) {
        if (data.next) {
          setHasMore(true);
        } else if (data.has_next !== undefined) {
          setHasMore(data.has_next);
        } else {
          setHasMore(postsArray.length >= 20);
        }
      }
      
    } catch (err) {
      console.error('Fetch posts error:', err);
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, page]);

  // Fonction pour vérifier et gérer la mise en évidence
  const checkForPostHighlighting = () => {
    const highlightParam = searchParams.get('highlight');
    const refreshParam = searchParams.get('refresh');
    
    if (highlightParam) {
      const postId = parseInt(highlightParam);
      if (!isNaN(postId)) {
        setHighlightedPostId(postId);
        
        if (refreshParam === 'true') {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('highlight');
          newSearchParams.delete('refresh');
          navigate({ search: newSearchParams.toString() }, { replace: true });
        }
      }
    }
    
    const storedPostId = sessionStorage.getItem('highlightedPost');
    const storedTimestamp = sessionStorage.getItem('highlightTimestamp');
    
    if (storedPostId && storedTimestamp) {
      const timeDiff = Date.now() - parseInt(storedTimestamp);
      
      if (timeDiff < 30000) {
        const postId = parseInt(storedPostId);
        if (!isNaN(postId)) {
          setHighlightedPostId(postId);
        }
      }
      
      sessionStorage.removeItem('highlightedPost');
      sessionStorage.removeItem('highlightTimestamp');
    }
  };

  // Effet pour charger l'utilisateur, les posts et vérifier la mise en évidence
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchCurrentUser();
      await fetchPosts(true);
      checkForPostHighlighting();
    };
    
    loadInitialData();
  }, [filters]);

  // Effet pour scroller vers le post mis en évidence
  useEffect(() => {
    if (highlightedPostId && posts.length > 0) {
      setTimeout(() => {
        if (highlightedPostRef.current) {
          highlightedPostRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          
          const postElement = document.querySelector(`.post-card-container[data-post-id="${highlightedPostId}"]`);
          if (postElement) {
            postElement.classList.add('post-highlighted');
            
            setTimeout(() => {
              postElement.classList.remove('post-highlighted');
              setHighlightedPostId(null);
            }, 5000);
          }
        }
      }, 500);
    }
  }, [highlightedPostId, posts]);

  // Effet pour rafraîchir si le paramètre refresh est présent
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam === 'true') {
      fetchPosts(true);
    }
  }, [searchParams]);

  // Charger plus de posts
  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 1) {
      fetchPosts(false);
    }
  }, [page]);

  // Rafraîchir les posts
  const refreshPosts = () => {
    fetchPosts(true);
  };

  // Gérer les filtres
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  // Gérer le changement d'algorithme
  const handleAlgorithmChange = (newAlgorithm) => {
    console.log('Changing algorithm to:', newAlgorithm);
    setFilters(prev => ({ 
      ...prev, 
      algorithm: newAlgorithm,
      sort: newAlgorithm === 'newest' ? 'newest' : prev.sort
    }));
    setPage(1);
    setPosts([]);
    
    // Recharger les posts avec le nouvel algorithme
    fetchPosts(true, { ...filters, algorithm: newAlgorithm });
  };

  // Fonction pour les actions du post
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
        withCredentials: false, 
      });

      if (response.ok) {
        alert('Post deleted successfully');
        refreshPosts();
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

  // Fonction pour mettre à jour le rating
  const handleRatingUpdate = async (postId, ratingData) => {
    console.log('Rating updated for post', postId, ':', ratingData);
  };

  const handleCategorySelect = useCallback((categoryId) => {
    console.log('Category selected:', categoryId);
    
    const newFilters = {
      ...filters,
      category: categoryId || '',
      page: 1
    };
    
    setFilters(newFilters);
    setPage(1);
    setPosts([]);
    fetchPosts(true, newFilters);
  }, [filters, fetchPosts]);

  // Récupérer
  const handleCreatePost = () => {
    window.location.href=('/create-post/');
  };

  // Fonction pour supprimer la mise en évidence
  const clearHighlight = () => {
    setHighlightedPostId(null);
    sessionStorage.removeItem('highlightedPost');
    sessionStorage.removeItem('highlightTimestamp');
  };

  if (error) {
    return (
      <div className="post-list-error">
        <div className="error-card">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Loading Error</h3>
          <p>{error}</p>
          <button onClick={() => fetchPosts(true)} className="btn-retry">
            <i className="fas fa-redo"></i> Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div {...dragBlock}>
      <CategoryList
        onCategorySelect={handleCategorySelect}
        selectedCategory={filters.category}
        onClearFilters={() => handleCategorySelect('')}
      />
      
      <div className="post-list-container">
        {/* Bouton de création flottant */}
        <button className="fab-create" onClick={handleCreatePost}>
          <i className="fas fa-plus"></i>
          <span>Share Something New 🚀</span>
        </button>

        {/* En-tête avec algorithm selector et filtres */}
        <div className="post-list-header">
          {/* Sélecteur d'algorithme */}
          <div className="algorithm-selector-container">
            <AlgorithmSelector
              currentAlgorithm={filters.algorithm}
              onAlgorithmChange={handleAlgorithmChange}
              algorithmInfo={algorithmInfo}
              userContext={userContext}
            />
          </div>
          
          {/* Filtres standards */}

          {/* Info sur l'algorithme actuel */}
        
        </div>

       

        {/* Grille de posts */}
        {loading && posts.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No posts found</h3>
            <p>Create the first post or adjust your filters</p>
          </div>
        ) : (
          <>
            <div className="posts-grid2"   >
              {posts.map(post => {
                const isHighlighted = post.id === highlightedPostId;
                return (
                  <div 
                    key={post.id} 
                    ref={isHighlighted ? highlightedPostRef : null}
                    className={`post-cad-wrapper ${isHighlighted ? 'highlighted' : ''}`}
                    data-post-id={post.id}
                  >
                    {/* Badge d'algorithme (optionnel) */}
                    {/*post.recommendation_score && post.recommendation_score > 50 && (
                      <div className="recommendation-badge">
                        <i className="fas fa-star"></i>
                        <span>Recommended for you</span>
                      </div>
                    )*/}
                    
                    <PostCard 
                      currentUser={currentUser}
                      post={post}
                      URL={URL}
                      isMobile={window.innerWidth <= 768}
                      onToggleExpand={(postId) => {
                        setPosts(prevPosts =>
                          prevPosts.map(p =>
                            p.id === postId ? { ...p, expanded: !p.expanded } : p
                          )
                        );
                      }}
                      onToggleShowAllMedia={(postId) => {
                        setPosts(prevPosts =>
                          prevPosts.map(p =>
                            p.id === postId ? { ...p, showAllMedia: !p.showAllMedia } : p
                          )
                        );
                      }}
                      onThumbnailClick={(postId, mediaUrls, mediaIndex) => {
                        console.log('Thumbnail clicked:', { postId, mediaIndex });
                      }}
                      onOpenGallery={(postId, mediaUrls) => {
                        console.log('Open gallery for post:', postId);
                      }}
                      onLike={(postId) => {
                        console.log('Like post:', postId);
                      }}
                      onToggleComments={(postId) => {
                        navigate(`/post/${postId}`);
                      }}
                      onAddComment={(postId, comment) => {
                        console.log('Add comment to post:', postId, comment);
                      }}
                      onCommentChange={(postId, commentId, newContent) => {
                        console.log('Edit comment:', { postId, commentId, newContent });
                      }}
                      onViewPost={(postId) => {
                        navigate(`/post/${postId}`);
                      }}
                      onEditPost={handleEditPost}
                      onDeletePost={handleDeletePost}
                      onReportPost={handleReportPost}
                      onSharePost={handleSharePost}
                      onRatingUpdate={handleRatingUpdate}
                      showUserBio={false}
                      userBio={''}
                    />
                  </div>
                );
              })}
            </div>

            {/* Bouton "Voir plus" */}
            {hasMore && (
              <div className="load-more-container">
                <button 
                  onClick={loadMore} 
                  disabled={loading || refreshing}
                  className="btn-load-more"
                >
                  {loading || refreshing ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Loading more...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-arrow-down"></i> Load more posts
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PostList;