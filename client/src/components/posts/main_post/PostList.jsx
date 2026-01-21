// src/components/posts/PostList.jsx
import React, { useState, useEffect, useRef,useCallback } from 'react';
import '../../../styles/main_post/posts.css';
import URL from '../../../hooks/useUrl';
import PostCard from '../PostCard';
import PostFilters from './PostFilters';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardMain from '../../dashboard_main';
import CategoryList from './CategoryList';
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
    sort: 'newest'
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
   const [localFilters, setLocalFilters] = useState(filters);
    
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

      const response = await fetch( {
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

  // Fonction pour récupérer les posts
// Ajoutez ceci dans votre fetchPosts function
// Fonction pour récupérer les posts - VERSION CORRIGÉE
// Fonction pour récupérer les posts - VERSION CORRIGÉE
const fetchPosts = useCallback(async (reset = false, customFilters = null) => {
  try {
    if (reset) {
      setRefreshing(true);
      setPage(1);
    }
    
    const token = localStorage.getItem('token');
    const currentFilters = customFilters || filters;
    
    console.log('🔍 Current filters:', currentFilters);
    
    // Construire les paramètres CORRECTEMENT
    const params = new URLSearchParams({
      page: reset ? 1 : page,
      page_size: 20,
      sort: currentFilters.sort || 'newest',
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
    
    // IMPORTANT: Gérer le cas où on utilise les endpoints spéciaux
    let url;
    if (currentFilters.sort === 'rated') {
      // Utiliser l'endpoint spécialisé pour "best rated"
      const specialParams = new URLSearchParams({
        limit: 20,
        min_ratings: 3,
        page: reset ? 1 : page
      });
      
      // Ajouter la catégorie et la recherche aux endpoints spéciaux aussi
      if (currentFilters.category) {
        specialParams.append('category', currentFilters.category);
      }
      if (currentFilters.search) {
        specialParams.append('search', currentFilters.search);
      }
      
      url = `${URL}/post/posts/best-rated/?${specialParams.toString()}`;
      
    } else if (currentFilters.sort === 'popular') {
      // Utiliser l'endpoint spécialisé pour "most popular"
      const specialParams = new URLSearchParams({
        limit: 20,
        days: 30,
        page: reset ? 1 : page
      });
      
      if (currentFilters.category) {
        specialParams.append('category', currentFilters.category);
      }
      if (currentFilters.search) {
        specialParams.append('search', currentFilters.search);
      }
      
      url = `${URL}/post/posts/most-popular/?${specialParams.toString()}`;
      
    } else {
      // Tri normal
      url = `${URL}/post/posts/?${params.toString()}`;
    }
    
    console.log('📡 Fetching from:', url);
    
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
    console.log('📦 API Response received, posts count:', 
      data.posts?.length || data.results?.length || (Array.isArray(data) ? data.length : 0));
    
    // GESTION DES DIFFÉRENTES STRUCTURES DE RÉPONSE
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
    
    // Mettre à jour l'état
    if (reset) {
      setPosts(postsArray);
    } else {
      setPosts(prev => [...prev, ...postsArray]);
    }
    
    // Gérer hasMore
    if (data.next) {
      setHasMore(true);
    } else if (data.pagination?.has_next !== undefined) {
      setHasMore(data.pagination.has_next);
    } else if (data.has_next !== undefined) {
      setHasMore(data.has_next);
    } else {
      // Si on utilise les endpoints spéciaux, on ne charge pas plus
      if (currentFilters.sort === 'rated' || currentFilters.sort === 'popular') {
        setHasMore(false);
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
    // Vérifier les paramètres d'URL
    const highlightParam = searchParams.get('highlight');
    const refreshParam = searchParams.get('refresh');
    
    if (highlightParam) {
      const postId = parseInt(highlightParam);
      if (!isNaN(postId)) {
        setHighlightedPostId(postId);
        
        // Nettoyer l'URL si c'est un refresh
        if (refreshParam === 'true') {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('highlight');
          newSearchParams.delete('refresh');
          navigate({ search: newSearchParams.toString() }, { replace: true });
        }
      }
    }
    
    // Vérifier sessionStorage (pour les rafraîchissements de page)
    const storedPostId = sessionStorage.getItem('highlightedPost');
    const storedTimestamp = sessionStorage.getItem('highlightTimestamp');
    
    if (storedPostId && storedTimestamp) {
      const timeDiff = Date.now() - parseInt(storedTimestamp);
      
      // Seulement si moins de 30 secondes se sont écoulées
      if (timeDiff < 30000) {
        const postId = parseInt(storedPostId);
        if (!isNaN(postId)) {
          setHighlightedPostId(postId);
        }
      }
      
      // Nettoyer sessionStorage
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
      // Attendre que le DOM soit mis à jour
      setTimeout(() => {
        if (highlightedPostRef.current) {
          highlightedPostRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          
          // Ajouter la classe de mise en évidence
          const postElement = document.querySelector(`.post-card-container[data-post-id="${highlightedPostId}"]`);
          if (postElement) {
            postElement.classList.add('post-highlighted');
            
            // Retirer la mise en évidence après 5 secondes
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
  };

  // Fonctions pour les actions du post (à passer à PostCard)
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
        }, withCredentials: false, 
      });

      if (response.ok) {
        alert('Post deleted successfully');
        // Rafraîchir la liste des posts
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
  
  // Mettre à jour les filtres
  const newFilters = {
    ...filters,
    category: categoryId || '',
    page: 1
  };
  
  setFilters(newFilters);
  setPage(1);
  
  // Réinitialiser et recharger les posts
  setPosts([]);
  fetchPosts(true, newFilters);
}, [filters, fetchPosts]);
    // Récupérer
  // Fonction pour naviguer vers la création de post
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
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button onClick={() => fetchPosts(true)} className="btn-retry">
            <i className="fas fa-redo"></i> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <>

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

        {/* En-tête avec filtres */}
        <div className="post-list-header">
     
          
          <PostFilters 
            filters={filters}
            onFilterChange={handleFilterChange}
            onRefresh={refreshPosts}
            refreshing={refreshing}
          />
     
        </div>

        {/* Grille de posts */}
        {loading && posts.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Chargement des posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
  <i className="fas fa-inbox"></i>
  <h3>No posts found</h3>
  <p>Create the first post or adjust your filters</p>

</div>

        ) : (
          <>
            <div className="posts-grid2">
              {posts.map(post => {
                const isHighlighted = post.id === highlightedPostId;
                return (
                  <div 
                    key={post.id} 
                    ref={isHighlighted ? highlightedPostRef : null}
                    className={`post-card-wrapper ${isHighlighted ? 'highlighted' : ''}`}
                    data-post-id={post.id}
                  >
          
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
                      <i className="fas fa-spinner fa-spin"></i> Loading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-arrow-down"></i> see more posts
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default PostList;