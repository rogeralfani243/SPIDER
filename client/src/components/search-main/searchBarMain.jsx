// components/SearchBar.jsx - Version refactorisée en anglais
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';
import { searchAPI } from '../services/api';
import URL from '../../hooks/useUrl';
import '../../styles/searchBar.css';

const SearchBar = ({ 
  placeholder = "Search profiles, posts, groups...",
  initialType = 'all',
  showTypeFilter = true,
  autoFocus = false,
  className = '',
  onSearchChange,
  onResultSelect,
  onSearchSubmit,
  navigateOnProfileSelect = true,
  value=''
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [searchType, setSearchType] = useState(initialType);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { search } = useSearch();
  
  const debounceTimeout = useRef(null);

  // Load recent searches
  useEffect(() => {
    const savedSearches = localStorage.getItem('recent_searches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches).slice(0, 5));
    }
  }, []);
  
  // AJOUTEZ CE useEffect POUR SYNCHRONISER LA VALEUR
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save to recent searches
  const saveToRecentSearches = (query, type) => {
    const newSearch = { query, type, timestamp: Date.now() };
    const updatedSearches = [
      newSearch,
      ...recentSearches.filter(s => s.query !== query)
    ].slice(0, 10);
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recent_searches', JSON.stringify(updatedSearches));
  };

  // Perform search with debounce
  const performSearch = useCallback((query, type = searchType) => {
    if (query.trim()) {
      search(query, type);
      saveToRecentSearches(query, type);
      
      if (onSearchChange) {
        onSearchChange(query, type);
      }
      
      // Navigate to search page if not already there
      const isOnSearchPage = window.location.pathname.includes('/search');
      if (!isOnSearchPage) {
        navigate(`/search?q=${encodeURIComponent(query)}&type=${type}`);
      }
    }
  }, [search, searchType, navigate, onSearchChange]);

  // Handle input change
  const handleInputChange = async (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (onSearchChange) {
      onSearchChange(value, searchType);
    }
    
    if (value.trim()) {
      // Debounce for suggestions
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      debounceTimeout.current = setTimeout(async () => {
        try {
          setIsLoading(true);
          const response = await searchAPI.getSearchSuggestions(value);
          console.log('🔍 Search suggestions response:', response.data);
          setSuggestions(response.data.suggestions || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(inputValue);
    setShowSuggestions(false);
    
    if (onSearchSubmit) {
      onSearchSubmit(inputValue, searchType);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    console.log('🎯 Suggestion clicked:', suggestion);
    
    // If custom handler provided, use it
    if (onResultSelect) {
      onResultSelect(suggestion);
      setShowSuggestions(false);
      return;
    }
    
    // Default behavior
    if (suggestion.type === 'profile') {
      // For profiles, navigate directly
      const profileId = suggestion.id || suggestion.user_id;
      if (profileId && navigateOnProfileSelect) {
        navigate(`/profile/${profileId}`);
      } else {
        // Or search for profile
        setInputValue(suggestion.username || suggestion.name);
        performSearch(suggestion.username || suggestion.name, 'profiles');
      }
    } else if (suggestion.type === 'post') {
      // For posts, navigate directly to post
      const postId = suggestion.id;
      const userId = suggestion.userId;
      if (postId,userId) {
        navigate(`user/${userId}/posts/${postId}`);
      } else {
        // Or search for post
        setInputValue(suggestion.title);
        performSearch(suggestion.title, 'posts');
      }
    } else if (suggestion.type === 'group') {
      // For groups, navigate directly
      const groupId = suggestion.id;
      if (groupId) {
        navigate(`/groups/${groupId}`);
      } else {
        // Or search for group
        setInputValue(suggestion.name);
        performSearch(suggestion.name, 'groups');
      }
    } else if (suggestion.type === 'category') {
      // For categories, search in categories
      setInputValue(suggestion.name);
      performSearch(suggestion.name, 'categories');
    } else if (suggestion.type === 'tag') {
      // For tags, search in tags
      setInputValue(suggestion.name);
      performSearch(suggestion.name, 'tags');
    } else {
      // For other types, do a general search
      setInputValue(suggestion.title || suggestion.name || suggestion.username);
      const typeMap = {
        'profile': 'profiles',
        'post': 'posts',
        'category': 'categories',
        'group': 'groups',
        'tag': 'tags'
      };
      const type = typeMap[suggestion.type] || searchType;
      setSearchType(type);
      performSearch(suggestion.title || suggestion.name || suggestion.username, type);
    }
    
    setShowSuggestions(false);
  };

  // Quick search with types
  const handleQuickSearch = (type) => {
    if (inputValue.trim()) {
      performSearch(inputValue, type);
      setSearchType(type);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    
    if (onSearchChange) {
      onSearchChange('', searchType);
    }
  };

  // Recent search
  const handleRecentSearchClick = (recentSearch) => {
    setInputValue(recentSearch.query);
    setSearchType(recentSearch.type);
    performSearch(recentSearch.query, recentSearch.type);
  };

  // Get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If full URL
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If relative path
    if (imagePath.startsWith('/')) {
      return `${URL}${imagePath}`;
    }
    
    // Default
    return `${URL}/media/${imagePath}`;
  };

  return (
    <div className={`search-bar-container ${className}`} ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="search-form">
        <div className="search-input-wrapper">
          <div className="search-icon">
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 21L16.65 16.65" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="search-input"
            aria-label="Search"
          />
          
          {inputValue && (
            <button 
              type="button"
              className="clear-btn"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          
          <button 
            type="submit"
            className="search-submit-btn"
            disabled={!inputValue.trim()}
            aria-label="Search"
          >
            Search
          </button>
        </div>

       
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="suggestions-dropdown">
          {isLoading ? (
            <div className="loading-suggestions">
              <div className="spinner small"></div>
              <span>Searching suggestions...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="suggestions-header">
                <h4>Suggestions</h4>
                <span className="suggestions-count">{suggestions.length} results</span>
              </div>
              
              <div className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <SuggestionItem
                    key={`${suggestion.type}-${suggestion.id || index}`}
                    suggestion={suggestion}
                    onClick={handleSuggestionClick}
                    getImageUrl={getImageUrl}
                  />
                ))}
              </div>
            </>
          ) : inputValue.trim() && recentSearches.length > 0 ? (
            <>
              <div className="suggestions-header">
                <h4>Recent searches</h4>
                <button 
                  type="button"
                  className="clear-history-btn"
                  onClick={() => {
                    localStorage.removeItem('recent_searches');
                    setRecentSearches([]);
                  }}
                >
                  Clear
                </button>
              </div>
              
              <div className="recent-searches">
                {recentSearches.map((recent, index) => (
                  <div
                    key={index}
                    className="recent-search-item"
                    onClick={() => handleRecentSearchClick(recent)}
                  >
                    <div className="recent-search-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 19L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M5 12L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="recent-search-content">
                      <div className="recent-search-query">{recent.query}</div>
                      <div className="recent-search-type">
                        {recent.type === 'all' && 'All'}
                        {recent.type === 'profiles' && 'Profiles'}
                        {recent.type === 'posts' && 'Posts'}
                        {recent.type === 'groups' && 'Groups'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

// SuggestionItem component
const SuggestionItem = ({ suggestion, onClick, getImageUrl }) => {
  const getTypeLabel = () => {
    switch (suggestion.type) {
      case 'profile': return 'Profile';
      case 'post': return 'Post';
      case 'group': return 'Group';
      case 'category': return 'Category';
      case 'tag': return 'Tag';
      default: return suggestion.type || 'Result';
    }
  };

  // Get appropriate image
  const getImage = () => {
    if (!suggestion.type) {
      return (
        <div className="suggestion-icon">
          🔍
        </div>
      );
    }
    
    // For PROFILES
    if (suggestion.type === 'profile') {
      const imageUrl = suggestion.avatar || suggestion.profile_picture || suggestion.image_url;
      if (imageUrl) {
        return (
          <div className="suggestion-image profile-image">
            <img 
              src={getImageUrl(imageUrl)} 
              alt={suggestion.username || suggestion.name}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="image-fallback profile-fallback">
                    ${(suggestion.first_name?.[0] || suggestion.username?.[0] || suggestion.name?.[0] || 'U').toUpperCase()}
                  </div>
                `;
              }}
            />
          </div>
        );
      }
    }
    
    // For POSTS - main image
    if (suggestion.type === 'post') {
      // Try different possible image fields from your API
      const postImage = suggestion.image_url || suggestion.thumbnail || suggestion.image;
      
      if (postImage) {
        return (
          <div className="suggestion-image post-image">
            <img 
              src={getImageUrl(postImage)} 
              alt={suggestion.title}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="image-fallback post-fallback">
                    📝
                  </div>
                `;
              }}
            />
          </div>
        );
      }
      
      // If no post image, show author avatar
      if (suggestion.user_profile_image || suggestion.author_avatar) {
        return (
          <div className="suggestion-image post-author-image">
            <img 
              src={getImageUrl(suggestion.user_profile_image || suggestion.author_avatar)} 
              alt={suggestion.author || suggestion.author_name}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="image-fallback author-fallback">
                    ${(suggestion.author?.[0] || suggestion.author_name?.[0] || 'A').toUpperCase()}
                  </div>
                `;
              }}
            />
          </div>
        );
      }
    }
    
    // For GROUPS
    if (suggestion.type === 'group') {
      // Try different possible image fields
      const groupImage = suggestion.group_photo_url || 
                        suggestion.image || 
                        suggestion.avatar || 
                        suggestion.cover_image;
      
      if (groupImage) {
        return (
          <div className="suggestion-image group-image">
            <img 
              src={getImageUrl(groupImage)} 
              alt={suggestion.name || suggestion.title}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="image-fallback group-fallback">
                    👥
                  </div>
                `;
              }}
            />
          </div>
        );
      }
    }
    
    // For CATEGORIES
    if (suggestion.type === 'category') {
      if (suggestion.image_url) {
        return (
          <div className="suggestion-image category-image">
            <img 
              src={getImageUrl(suggestion.image_url)} 
              alt={suggestion.name}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="image-fallback category-fallback">
                    🏷️
                  </div>
                `;
              }}
            />
          </div>
        );
      }
    }
    
    // Default icon
    return (
      <div className="suggestion-icon">
        {suggestion.type === 'profile' && '👤'}
        {suggestion.type === 'post' && '📝'}
        {suggestion.type === 'group' && '👥'}
        {suggestion.type === 'category' && '🏷️'}
        {suggestion.type === 'tag' && '🔖'}
        {!['profile', 'post', 'group', 'category', 'tag'].includes(suggestion.type) && '🔍'}
      </div>
    );
  };

  const getDisplayName = () => {
    if (!suggestion) return 'Unknown';
    
    if (suggestion.type === 'profile') {
      if (suggestion.first_name && suggestion.last_name) {
        return `${suggestion.first_name} ${suggestion.last_name}`;
      }
      return suggestion.username || suggestion.name || 'User';
    }
    
    if (suggestion.type === 'post') {
      return suggestion.title || 'Untitled post';
    }
    
    if (suggestion.type === 'group') {
      return suggestion.name || suggestion.title || 'Group';
    }
    
    if (suggestion.type === 'category') {
      return suggestion.name || suggestion.title || 'Category';
    }
    
    if (suggestion.type === 'tag') {
      return suggestion.name || suggestion.title || 'Tag';
    }
    
    return suggestion.title || suggestion.name || suggestion.username || 'Result';
  };

  const getSubtitle = () => {
    if (!suggestion) return '';
    
    if (suggestion.type === 'profile') {
      return suggestion.title || suggestion.bio_preview || suggestion.bio || suggestion.username || '';
    }
    
    if (suggestion.type === 'post') {
      const content = suggestion.content_preview || suggestion.content || suggestion.description || '';
      return content.length > 80 ? content.substring(0, 80) + '...' : content;
    }
    
    if (suggestion.type === 'group') {
      return suggestion.description || 
             (suggestion.member_count ? `${suggestion.member_count} members` : '') ||
             (suggestion.privacy ? (suggestion.privacy === 'private' ? 'Private group' : 'Public group') : '');
    }
    
    if (suggestion.type === 'category') {
      return suggestion.description || suggestion.post_count ? `${suggestion.post_count} posts` : '';
    }
    
    if (suggestion.type === 'tag') {
      return suggestion.description || suggestion.post_count ? `${suggestion.post_count} posts` : '';
    }
    
    return suggestion.description || suggestion.content_preview || '';
  };

  const getMetaInfo = () => {
    if (!suggestion) return null;
    
    if (suggestion.type === 'profile') {
      return (
        <div className="suggestion-meta">
          {suggestion.category_name && (
            <span className="suggestion-category">
              {suggestion.category_name}
            </span>
          )}
          {suggestion.followers_count !== undefined && (
            <span className="suggestion-count">
              • {suggestion.followers_count} followers
            </span>
          )}
        </div>
      );
    }
    
    if (suggestion.type === 'post') {
      return (
        <div className="suggestion-meta">
          <span className="suggestion-author">
            {suggestion.author || suggestion.author_name || 'User'}
          </span>
          {suggestion.created_at && (
            <span className="suggestion-time">
              • {formatDate(suggestion.created_at)}
            </span>
          )}
          {(suggestion.like_count !== undefined) && (
            <span className="suggestion-count">
              • {suggestion.like_count} rates
            </span>
          )}
          {(suggestion.comment_count !== undefined) && (
            <span className="suggestion-count">
              • {suggestion.comment_count} comments
            </span>
          )}
        </div>
      );
    }
    
    if (suggestion.type === 'group') {
      return (
        <div className="suggestion-meta">
          {suggestion.privacy && (
            <span className="suggestion-privacy">
              {suggestion.privacy === 'private' ? '🔒 Private' : '🌐 Public'}
            </span>
          )}
          {(suggestion.member_count !== undefined) && (
            <span className="suggestion-count">
              • {suggestion.member_count} members
            </span>
          )}
          {suggestion.category_name && (
            <span className="suggestion-category">
              • {suggestion.category_name}
            </span>
          )}
        </div>
      );
    }
    
    if (suggestion.type === 'category') {
      return (
        <div className="suggestion-meta">
          {suggestion.post_count !== undefined && (
            <span className="suggestion-count">
              {suggestion.post_count} posts
            </span>
          )}
          {suggestion.parent_name && (
            <span className="suggestion-parent">
              • {suggestion.parent_name}
            </span>
          )}
        </div>
      );
    }
    
    if (suggestion.type === 'tag') {
      return (
        <div className="suggestion-meta">
          {suggestion.post_count !== undefined && (
            <span className="suggestion-count">
              {suggestion.post_count} posts
            </span>
          )}
        </div>
      );
    }
    
    return null;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 60) return `${diffMins} min`;
      if (diffHours < 24) return `${diffHours} h`;
      if (diffDays < 7) return `${diffDays} d`;
      return date.toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(suggestion);
  };

  if (!suggestion) {
    return null;
  }

  return (
    <div
      className={`suggestion-item suggestion-${suggestion.type || 'unknown'}`}
      onClick={handleClick}
      onMouseEnter={(e) => e.currentTarget.classList.add('hovered')}
      onMouseLeave={(e) => e.currentTarget.classList.remove('hovered')}
    >
      {getImage()}
      
      <div className="suggestion-content">
        <div className="suggestion-header">
          <h5 className="suggestion-title">
            {getDisplayName()}
          </h5>
          <span className="suggestion-type-badge">{getTypeLabel()}</span>
        </div>
        
        {getSubtitle() && (
          <p className="suggestion-subtitle">
            {getSubtitle()}
          </p>
        )}
        
        {getMetaInfo()}
      </div>
    </div>
  );
};

export default SearchBar;