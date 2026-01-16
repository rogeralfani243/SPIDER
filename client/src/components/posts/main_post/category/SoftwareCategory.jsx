// src/components/posts/main_post/category/SoftwareCategory.jsx
import React, { useState, useEffect } from 'react';
import SoftwareCard from './software/SoftwareCrad';
import URL from '../../../../hooks/useUrl';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Star, 
  Download,
  Award,
  Sparkles,
  Smartphone,
  Gamepad2,
  Music,
  Camera
} from 'lucide-react';
import '../../../../styles/main_post/category/software/software-categry.css';
import PostContainer from './software/PostContainer';
const SoftwareCategory = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('forYou');
  const [filters, setFilters] = useState({
    category: 'all',
    sort: 'popular',
    rating: 'all',
    price: 'all'
  });

  // Fetch software posts from YOUR backend
  const fetchSoftwarePosts = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      // Get all posts (or filter by category software)
      const response = await fetch(`${URL}/post/posts/`, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the response to get posts array
      let postsArray = [];
      
      if (Array.isArray(data)) {
        postsArray = data;
      } else if (data.posts && Array.isArray(data.posts)) {
        postsArray = data.posts;
      } else if (data.results && Array.isArray(data.results)) {
        postsArray = data.results;
      }
      
      // Filter for software posts (by category or tags)
      const softwarePosts = postsArray.filter(post => 
        // Check if post is in software category
        (post.category && 
         (post.category.name?.toLowerCase().includes('software') || 
          post.category_name?.toLowerCase().includes('software'))) ||
        // OR has software tags
        (post.tags && post.tags.some(tag => {
          const tagName = typeof tag === 'object' ? tag.name?.toLowerCase() : tag.toLowerCase();
          return tagName.includes('software') || 
                 tagName.includes('app') || 
                 tagName.includes('development');
        }))
      );
      
      setPosts(softwarePosts);
      setFilteredPosts(softwarePosts);
      
    } catch (err) {
      console.error('Error fetching software posts:', err);
      // Fallback to empty array
      setPosts([]);
      setFilteredPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoftwarePosts();
  }, []);

  // Filter posts based on search and filters
  useEffect(() => {
    let filtered = [...posts];
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(post =>
        post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sort filter
    switch (filters.sort) {
      case 'popular':
        filtered.sort((a, b) => (b.total_ratings || 0) - (a.total_ratings || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'new':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      default:
        break;
    }
    
    setFilteredPosts(filtered);
  }, [searchTerm, filters, posts]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle install
  const handleInstall = (post) => {
    console.log('Installing:', post.title);
    // Call your backend to track install
    // fetch(`${URL}/post/posts/${post.id}/install/`, { method: 'POST' });
    alert(`Installing ${post.title}...`);
  };

  // Handle view details
  const handleViewDetails = (post) => {
    console.log('Viewing details:', post.id);
    // Navigate to post details
    window.location.href = `/post/${post.id}`;
  };

  // Handle rating update
  const handleRatingUpdate = (postId, rating) => {
    console.log(`Rating post ${postId}: ${rating} stars`);
    // Call your rating API
  };

  // Handle like
  const handleLike = (postId) => {
    console.log('Liking post:', postId);
    // Call your like API
  };

  // Handle share
  const handleShare = (post) => {
    console.log('Sharing post:', post.id);
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content?.substring(0, 100),
        url: `${window.location.origin}/post/${post.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      alert('Link copied to clipboard!');
    }
  };

  // Handle toggle comments
  const handleToggleComments = (postId) => {
    console.log('Toggling comments for:', postId);
    // Navigate to post with comments open
    window.location.href = `/post/${postId}#comments`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="playstore-loading">
        <div className="loading-spinner"></div>
        <p>Loading Play Store...</p>
      </div>
    );
  }

  return (
    <div className="software-category-playstore">
      {/* Play Store Header */}
      <header className="playstore-header">
        <div className="header-top">
          <div className="header-left">
            <h1 className="store-title">
              <span className="play-icon">▶️</span>
              Play Store
            </h1>
            <div className="user-section">
              <div className="user-avatar">👤</div>
              <span className="user-points">150 points</span>
            </div>
          </div>
          
          <div className="header-right">
            <button className="header-btn">
              <Sparkles size={20} />
            </button>
            <button className="header-btn">
              <Award size={20} />
            </button>
            <button className="header-btn">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search apps & games"
            className="search-input"
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="category-tabs">
        <button 
          className={`tab ${activeTab === 'forYou' ? 'active' : ''}`}
          onClick={() => setActiveTab('forYou')}
        >
          <Sparkles size={16} />
          <span>For You</span>
        </button>
        
        <button 
          className={`tab ${activeTab === 'topCharts' ? 'active' : ''}`}
          onClick={() => setActiveTab('topCharts')}
        >
          <TrendingUp size={16} />
          <span>Top Charts</span>
        </button>
        
        <button 
          className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Smartphone size={16} />
          <span>Categories</span>
        </button>
        
        <button 
          className={`tab ${activeTab === 'editorChoice' ? 'active' : ''}`}
          onClick={() => setActiveTab('editorChoice')}
        >
          <Award size={16} />
          <span>Editor's Choice</span>
        </button>
      </nav>

      {/* Quick Categories */}
      <div className="quick-categories">
        <div className="categories-scroll">
          <button 
            className={`category-btn ${filters.category === 'all' ? 'active' : ''}`}
            onClick={() => setFilters({...filters, category: 'all'})}
          >
            <Smartphone />
            <span>All Apps</span>
          </button>
          
          <button 
            className={`category-btn ${filters.category === 'games' ? 'active' : ''}`}
            onClick={() => setFilters({...filters, category: 'games'})}
          >
            <Gamepad2 />
            <span>Games</span>
          </button>
          
          <button 
            className={`category-btn ${filters.category === 'social' ? 'active' : ''}`}
            onClick={() => setFilters({...filters, category: 'social'})}
          >
            <span className="category-icon">👥</span>
            <span>Social</span>
          </button>
          
          <button 
            className={`category-btn ${filters.category === 'tools' ? 'active' : ''}`}
            onClick={() => setFilters({...filters, category: 'tools'})}
          >
            <span className="category-icon">🛠️</span>
            <span>Tools</span>
          </button>
        </div>
      </div>

      {/* Sorting Options */}
      <div className="sorting-section">
        <h3 className="section-title">Sort by</h3>
        <div className="sort-buttons">
          <button 
            className={`sort-btn ${filters.sort === 'popular' ? 'active' : ''}`}
            onClick={() => setFilters({...filters, sort: 'popular'})}
          >
            <TrendingUp size={14} />
            <span>Popular</span>
          </button>
          
          <button 
            className={`sort-btn ${filters.sort === 'rating' ? 'active' : ''}`}
            onClick={() => setFilters({...filters, sort: 'rating'})}
          >
            <Star size={14} />
            <span>Top Rated</span>
          </button>
          
          <button 
            className={`sort-btn ${filters.sort === 'new' ? 'active' : ''}`}
            onClick={() => setFilters({...filters, sort: 'new'})}
          >
            <span className="new-icon">🆕</span>
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="apps-section">
        <div className="section-header">
          <h2 className="section-title">
            {activeTab === 'forYou' ? 'Recommended For You' : 
             activeTab === 'topCharts' ? 'Top Charts' :
             activeTab === 'editorChoice' ? "Editor's Choice" : 'Categories'}
          </h2>
          <span className="apps-count">{filteredPosts.length} apps</span>
        </div>
        
        {filteredPosts.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">📱</div>
            <h3>No software apps found</h3>
            <p>Try a different search or check back later</p>
          </div>
        ) : (
          <div className="apps-grid">
            {filteredPosts.map(post => (
              <PostContainer
                key={post.id}
                post={post}
                currentUser={null}
                URL={URL}
                onInstall={handleInstall}
                onViewDetails={handleViewDetails}
                onRatingUpdate={handleRatingUpdate}
                onLike={handleLike}
                onSharePost={handleShare}
                onToggleComments={handleToggleComments}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SoftwareCategory;