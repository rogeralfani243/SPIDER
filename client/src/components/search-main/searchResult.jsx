// components/SearchResults.jsx - version corrigée
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';
import SearchBar from './searchBarMain';
import PostCard from '../posts/PostCard';
import { GroupCard } from './GroupCard';
import URL from '../../hooks/useUrl';
import ProfileSearchResults from './ProfileSearchResults';
import { groupAPI } from '../../hooks/messaging/messagingApi';
import '../../styles/search-result.css'
const SearchResults = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    results, 
    loading, 
    error, 
    type,
    search, 
    setType
  } = useSearch();
  
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Posts state
  const [searchPosts, setSearchPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]); // All fetched posts
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  
  // Profiles state
  const [allProfiles, setAllProfiles] = useState([]); // All fetched profiles
  const [searchProfiles, setSearchProfiles] = useState([]); // Filtered profiles
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState(null);
  const [profileCategories, setProfileCategories] = useState([]);
  
  // Groups state
  const [allGroups, setAllGroups] = useState([]); // All fetched groups
  const [searchGroups, setSearchGroups] = useState([]); // Filtered groups
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState(null);
  const [groupCategories, setGroupCategories] = useState([]);
  const [groupsPage, setGroupsPage] = useState(1);
  const [hasMoreGroups, setHasMoreGroups] = useState(true);

  // Ref pour suivre la dernière recherche
  const lastSearchQuery = useRef('');

  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCurrentUser(null);
        return;
      }

      const response = await fetch(`${URL}/api/auth/user/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      setCurrentUser(null);
    }
  }, []);

  // Fetch ALL posts (not just search results)
  const fetchAllPosts = useCallback(async (reset = false) => {
    try {
      setPostsLoading(true);
      setPostsError('');
      
      const token = localStorage.getItem('token');
      const currentPage = reset ? 1 : postsPage;

      const params = new URLSearchParams({
        page: currentPage,
        page_size: 20,
        sort: 'newest'
      });

      const url = `${URL}/post/posts/?${params.toString()}`;
      console.log('📝 Fetching all posts from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Posts API Error:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 All posts response:', data);

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
        for (const key in data) {
          if (Array.isArray(data[key])) {
            postsArray = data[key];
            break;
          }
        }
      }

      if (reset) {
        setAllPosts(postsArray);
        // Ne pas filtrer automatiquement ici - laissé à filterAllData
      } else {
        setAllPosts(prev => [...prev, ...postsArray]);
      }

      // Check if there are more posts to load
      if (data.next) {
        setHasMorePosts(true);
      } else if (data.pagination?.has_next !== undefined) {
        setHasMorePosts(data.pagination.has_next);
      } else if (data.has_next !== undefined) {
        setHasMorePosts(data.has_next);
      } else {
        setHasMorePosts(postsArray.length >= 20);
      }

    } catch (err) {
      console.error('Fetch all posts error:', err);
      setPostsError(err.message || 'Failed to load posts');
    } finally {
      setPostsLoading(false);
    }
  }, [postsPage]);

  // Fetch ALL profiles (not just search results)
  const fetchAllProfiles = useCallback(async () => {
    try {
      setProfilesLoading(true);
      setProfilesError(null);
      
      const apiUrl = `${URL}/api/profiles/category/`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Flatten all profiles from all categories
      const allProfilesArray = [];
      data.forEach(category => {
        if (category.profiles && Array.isArray(category.profiles)) {
          allProfilesArray.push(...category.profiles.map(profile => ({
            ...profile,
            category_id: category.category_id,
            category_name: category.category_name
          })));
        }
      });
      
      setAllProfiles(allProfilesArray);
      // Ne pas filtrer automatiquement ici - laissé à filterAllData
      setProfileCategories(data);
      
      console.log('👤 Fetched', allProfilesArray.length, 'profiles');
      
    } catch (err) {
      console.error('Error fetching all profiles:', err);
      setProfilesError(err.message);
    } finally {
      setProfilesLoading(false);
    }
  }, []);

  // Fetch ALL groups (not just search results)
  const fetchAllGroups = useCallback(async (reset = false) => {
    try {
      setGroupsLoading(true);
      setGroupsError(null);
      
      const currentPage = reset ? 1 : groupsPage;
      
      const params = {
        page: currentPage,
        limit: 12,
        sort: 'newest',
      };
      
      console.log('👥 Fetching all groups with params:', params);
      
      const response = await groupAPI.exploreGroups(params);
      
      const groupsData = response.data.results || response.data || [];
      
      if (reset) {
        setAllGroups(groupsData);
        // Ne pas filtrer automatiquement ici - laissé à filterAllData
      } else {
        setAllGroups(prev => [...prev, ...groupsData]);
      }
      
      // Check if there are more groups to load
      if (response.data.next) {
        setHasMoreGroups(true);
      } else {
        setHasMoreGroups(groupsData.length >= 12);
      }
      
      console.log('👥 Fetched', groupsData.length, 'groups');
      
    } catch (err) {
      console.error('Error fetching all groups:', err);
      setGroupsError(err.response?.data?.error || 'Failed to load groups. Please try again.');
    } finally {
      setGroupsLoading(false);
    }
  }, [groupsPage]);

  // Load group categories
  const loadGroupCategories = async () => {
    try {
      const response = await groupAPI.getCategories();
      setGroupCategories(response.data || []);
    } catch (err) {
      console.error('Error loading group categories:', err);
      setGroupCategories([]);
    }
  };

  // Filter posts based on search query
  const filterPosts = useCallback((query = '') => {
    if (!query.trim()) {
      setSearchPosts(allPosts); // Show all posts if no query
      return;
    }
    
    const searchLower = query.toLowerCase();
    const filtered = allPosts.filter(post => {
      return (
        (post.title && post.title.toLowerCase().includes(searchLower)) ||
        (post.content && post.content.toLowerCase().includes(searchLower)) ||
        (post.user?.username && post.user.username.toLowerCase().includes(searchLower)) ||
        (post.tags && Array.isArray(post.tags) && post.tags.some(tag => 
          tag.toLowerCase().includes(searchLower)
        ))
      );
    });
    
    setSearchPosts(filtered);
  }, [allPosts]);

  // Filter profiles based on search query
  const filterProfiles = useCallback((query = '') => {
    if (!query.trim()) {
      setSearchProfiles(allProfiles); // Show all profiles if no query
      return;
    }
    
    const searchLower = query.toLowerCase();
    const filtered = allProfiles.filter(profile => {
      return (
        (profile.first_name && profile.first_name.toLowerCase().includes(searchLower)) ||
        (profile.last_name && profile.last_name.toLowerCase().includes(searchLower)) ||
        (profile.username && profile.username.toLowerCase().includes(searchLower)) ||
        (profile.bio && profile.bio.toLowerCase().includes(searchLower)) ||
        (profile.title && profile.title.toLowerCase().includes(searchLower))
      );
    });
    
    setSearchProfiles(filtered);
  }, [allProfiles]);

  // Filter groups based on search query
  const filterGroups = useCallback((query = '') => {
    if (!query.trim()) {
      setSearchGroups(allGroups); // Show all groups if no query
      return;
    }
    
    const searchLower = query.toLowerCase();
    const filtered = allGroups.filter(group => {
      return (
        (group.name && group.name.toLowerCase().includes(searchLower)) ||
        (group.description && group.description.toLowerCase().includes(searchLower)) ||
        (group.tags && Array.isArray(group.tags) && group.tags.some(tag => 
          tag.toLowerCase().includes(searchLower)
        )) ||
        (group.category?.name && group.category.name.toLowerCase().includes(searchLower))
      );
    });
    
    setSearchGroups(filtered);
  }, [allGroups]);

  // Fonction principale pour filtrer toutes les données
  const filterAllData = useCallback((query = '', currentType = type) => {
    console.log('🔍 Filtering data with query:', query, 'type:', currentType);
    
    // Éviter les doublons de filtrage
    if (lastSearchQuery.current === query) {
      return;
    }
    
    lastSearchQuery.current = query;
    
    // Filtrer selon le type
    if (currentType === 'all' || currentType === 'posts') {
      filterPosts(query);
    }
    
    if (currentType === 'all' || currentType === 'profiles') {
      filterProfiles(query);
    }
    
    if (currentType === 'all' || currentType === 'groups') {
      filterGroups(query);
    }
  }, [filterPosts, filterProfiles, filterGroups, type]);

  // Get search query from URL and filter data
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    const urlType = params.get('type') || 'all';
    
    setType(urlType);
    
    // Charger toutes les données initialement
    loadGroupCategories();
    fetchAllPosts(true);
    fetchAllProfiles();
    fetchAllGroups(true);
    fetchCurrentUser();
    
    // Filtrer les données si il y a une requête
    if (query) {
      filterAllData(query, urlType);
    } else {
      // Si pas de requête, montrer toutes les données
      setSearchPosts(allPosts);
      setSearchProfiles(allProfiles);
      setSearchGroups(allGroups);
    }
  }, [location.search]);

  // Mettre à jour les données filtrées quand les données complètes changent
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    
    if (query) {
      filterAllData(query, type);
    } else {
      setSearchPosts(allPosts);
      setSearchProfiles(allProfiles);
      setSearchGroups(allGroups);
    }
  }, [allPosts, allProfiles, allGroups, type]);

  // Handle type change - filter data based on current query
  const handleTypeChange = (newType) => {
    setType(newType);
    
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    
    // Mettre à jour l'URL
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}&type=${newType}`);
    } else {
      navigate(`/search?type=${newType}`);
    }
    
    // Filtrer les données pour le nouveau type
    filterAllData(query, newType);
  };

  // Handle search - update URL and filter data
  const handleSearch = (query, searchType = type) => {
    // Mettre à jour l'URL
    navigate(`/search?q=${encodeURIComponent(query)}&type=${searchType}`);
    
    // Filtrer toutes les données
    filterAllData(query, searchType);
  };

  // Handle search change from SearchBar (for real-time filtering)
  const handleSearchChange = (query, searchType = type) => {
    // Mettre à jour l'URL immédiatement
    navigate(`/search?q=${encodeURIComponent(query)}&type=${searchType}`);
    
    // Filtrer toutes les données en temps réel
    filterAllData(query, searchType);
  };

  const loadMorePosts = () => {
    setPostsPage(prev => prev + 1);
  };

  const loadMoreGroups = () => {
    setGroupsPage(prev => prev + 1);
  };
  
  // Get all profiles from categories for ProfileSearchResults component
  const getAllProfilesForDisplay = () => {
    // Group profiles by category for the ProfileSearchResults component
    const categoriesMap = {};
    searchProfiles.forEach(profile => {
      const categoryId = profile.category_id || 'uncategorized';
      const categoryName = profile.category_name || 'Other';
      
      if (!categoriesMap[categoryId]) {
        categoriesMap[categoryId] = {
          category_id: categoryId,
          category_name: categoryName,
          profiles: []
        };
      }
      categoriesMap[categoryId].profiles.push(profile);
    });
    
    return Object.values(categoriesMap);
  };

  // Render GroupCard
  const renderGroupCard = (group) => {
    const cardProps = {
      key: group.id || `group-${Math.random()}`,
      group: group,
      onClick: () => {
        if (group.id) {
          console.log('Click group:', group.id);
          if (onClose) onClose();
          navigate(`/groups/${group.id}`);
        }
      },

      onJoinRequest: async (groupId) => {
        try {
         const response = await groupAPI.requestToJoin(groupId);
    
    // Le backend retourne {'success': True, 'message': '...'}
    // Utiliser response.data.message au lieu de response.data.success
    let message = response.data.message || 'Join request sent successfully!';
    
    // Si jamais message n'est pas défini, on utilise un fallback
    if (!message && response.data.success === true) {
      message = 'Request sent successfully!';
    }
    
    alert(message);
          fetchAllGroups(true);
        } catch (err) {
       let errorMessage = err.response?.data?.error || 
                      err.response?.data?.detail || 
                      'Failed to send join request';
    
    alert(errorMessage);
        }
      },
      isHovered: hoveredCard === group.id,
      onMouseEnter: () => group.id && setHoveredCard(group.id),
      onMouseLeave: () => group.id && setHoveredCard(null),
      compact: true,
      showDescription: false,
      showStats: true,
      className: "search-group-card",
      isSearchResult: true
    };
    
    return <GroupCard {...cardProps} />;
  };
  
  // Render PostCard
  const renderPostCard = (post) => {
    if (!post) return null;
    
    return (
      <div className="post-card-wrapper" data-post-id={post.id}>
        <PostCard 
          currentUser={currentUser}
          post={post}
          URL={URL}
          isMobile={window.innerWidth <= 768}
          onToggleExpand={(postId) => {
            setSearchPosts(prevPosts =>
              prevPosts.map(p =>
                p.id === postId ? { ...p, expanded: !p.expanded } : p
              )
            );
          }}
          onToggleShowAllMedia={(postId) => {
            setSearchPosts(prevPosts =>
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
          onEditPost={(post) => {
            console.log('Edit post requested:', post.id);
            navigate(`/posts/edit/${post.id}`);
          }}
          onDeletePost={async (post) => {
            const token = localStorage.getItem('token');
            
            if (!window.confirm('Are you sure you want to delete this post?')) {
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
                setSearchPosts(prev => prev.filter(p => p.id !== post.id));
                setAllPosts(prev => prev.filter(p => p.id !== post.id));
              } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete post');
              }
            } catch (err) {
              console.error('Error deleting post:', err);
              alert(err.message || 'Failed to delete post');
            }
          }}
          onReportPost={async (post, reason) => {
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
          }}
          onSharePost={(post) => {
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
          }}
          onRatingUpdate={async (postId, ratingData) => {
            console.log('Rating updated for post', postId, ':', ratingData);
          }}
          showUserBio={false}
          userBio={''}
        />
      </div>
    );
  };
  
  // Get stats based on filtered data
  const getStats = () => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    
    return {
      profiles: searchProfiles.length,
      posts: searchPosts.length,
      groups: searchGroups.length,
      categories: 0, // Not using searchAPI for these
      tags: 0, // Not using searchAPI for these
    };
  };
  
  const stats = getStats();
  
  // Get total count for "All" tab
  const getTotalCount = () => {
    return stats.posts + stats.profiles + stats.groups;
  };
  
  // Load more posts when postsPage changes
  useEffect(() => {
    if (postsPage > 1) {
      fetchAllPosts(false);
    }
  }, [postsPage]);

  // Load more groups when groupsPage changes
  useEffect(() => {
    if (groupsPage > 1) {
      fetchAllGroups(false);
    }
  }, [groupsPage]);

  return (
    <div className="search-results-page">
      {/* Header with SearchBar and close button */}
      <div className="search-results-header">
        <div className="searh-container">
          <SearchBar
            initialType={type}
            showTypeFilter={false}
            onSearch={handleSearch}
            onSearchChange={handleSearchChange} // Nouvelle prop pour le filtrage en temps réel
            className="results-search-bar"
            debounceTime={300} // Optionnel: ajouter un délai pour éviter trop d'appels
          />
        </div>
        
  {/*
        <div className="results-controls">
          {onClose && (
            <button 
              className="close-results-btn"
              onClick={onClose}
              aria-label="Close results"
            >
              &times;
            </button>
          )}
          
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide filters' : 'Filters'}
          </button>
        </div>
  */}
      </div>
      
      {/* Type tabs */}
      <div className="search-type-tabs">
        {[
          { id: 'all', label: 'All', count: getTotalCount() },
          { id: 'profiles', label: 'Profiles', count: stats.profiles },
          { id: 'posts', label: 'Posts', count: stats.posts },
          { id: 'groups', label: 'Groups', count: stats.groups },
        ].map(tab => (
          <button
            key={tab.id}
            className={`type-tab ${type === tab.id ? 'active' : ''}`}
            onClick={() => handleTypeChange(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>
      
      {/* Results content */}
      <div className="results-content">
        {(postsLoading || profilesLoading || groupsLoading) ? (
          <div className="loading-state">
            <div className="spinner large"></div>
            <p>Loading...</p>
          </div>
        ) : (postsError || profilesError || groupsError) ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Error loading data</h3>
            <p>{postsError || profilesError || groupsError}</p>
            <button 
              className="retry-btn"
              onClick={() => {
                fetchAllPosts(true);
                fetchAllProfiles();
                fetchAllGroups(true);
              }}
            >
              Try again
            </button>
          </div>
        ) : getTotalCount() > 0 ? (
          <>
            {/* Summary */}
            <div className="results-summary">
              <p>
                <strong>{getTotalCount()}</strong> 
                result{getTotalCount() > 1 ? 's' : ''}
                {location.search.includes('q=') && ` found`}
              </p>
            </div>
            
            {/* Results grid */}
            <div className="results-grid">
                            {/* Profiles - Only show when type is profiles or all */}
              {(type === 'all' || type === 'profiles') && (
                <div className="result-section">
                  <div className="section-header">
                    <h3 className="section-title">Profiles</h3>
                    <span className="section-count">
                      {stats.profiles} result{stats.profiles > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {searchProfiles.length > 0 ? (
                    <ProfileSearchResults
                      profiles={searchProfiles}
                      query={new URLSearchParams(location.search).get('q') || ''}
                      loading={profilesLoading}
                      error={profilesError}
                      onProfileClick={(profileId) => {
                        if (onClose) onClose();
                        navigate(`/profile/${profileId}`);
                      }}
                    />
                  ) : (
                    <div className="no-results-subsection">
                      <p>No profiles found</p>
                    </div>
                  )}
                </div>
              )}
              {/* Posts - Only show when type is posts or all */}
              {(type === 'all' || type === 'posts') && (
                <div className="result-section">
                  <div className="section-header">
                    <h3 className="section-title">Posts</h3>
                    <span className="section-count">
                      {stats.posts} result{stats.posts > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {searchPosts.length > 0 ? (
                    <>
                      <div className="posts-grid">
                        {searchPosts.map(renderPostCard)}
                      </div>
                      
                      {/* "Load more" button for posts */}
                      {hasMorePosts && type === 'posts' && (
                        <div className="load-more-container">
                          <button 
                            onClick={loadMorePosts} 
                            disabled={postsLoading}
                            className="btn-load-more"
                          >
                            {postsLoading ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i> Loading...
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
                  ) : (
                    <div className="no-results-subsection">
                      <p>No posts found</p>
                    </div>
                  )}
                </div>
              )}
              

              
              {/* Groups - Only show when type is groups or all */}
              {(type === 'all' || type === 'groups') && (
                <div className="result-section">
                  <div className="section-header">
                    <h3 className="section-title">Groups</h3>
                    <span className="section-count">
                      {stats.groups} result{stats.groups > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {searchGroups.length > 0 ? (
                    <>
                      <div className="groups-grid">
                        {searchGroups.map(renderGroupCard)}
                      </div>
                      
                      {/* Load more groups button */}
                      {hasMoreGroups && type === 'groups' && (
                        <div className="load-more-container">
                          <button 
                            onClick={loadMoreGroups} 
                            disabled={groupsLoading}
                            className="btn-load-more"
                          >
                            {groupsLoading ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i> Loading...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-arrow-down"></i> Load more groups
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="no-results-subsection">
                      <p>No groups found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : location.search.includes('q=') ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h2>No results found</h2>
            <p>Try different search terms</p>
          </div>
        ) : (
          <div className="initial-state">
            <div className="initial-icon">🔍</div>
            <h2>Start your search</h2>
            <p>Type something to begin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;