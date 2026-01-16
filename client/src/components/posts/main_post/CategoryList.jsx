import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { FaSpinner, FaTimesCircle, FaFilter, FaChevronRight, FaChevronLeft, FaTimes, FaEllipsisH } from 'react-icons/fa';

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const CategoryList = ({ onCategorySelect, selectedCategoryId = null }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showViewMore, setShowViewMore] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [visibleCategoriesCount, setVisibleCategoriesCount] = useState(5);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const categoryCardRef = useRef(null);
  
  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${API_BASE_URL}/post/categories/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load categories: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Si l'API retourne un objet avec une propriété 'categories'
      const categoriesArray = data.categories || data.results || data;
      
      // Trier: d'abord les actives, puis par nom
      const sortedCategories = Array.isArray(categoriesArray) 
        ? categoriesArray.sort((a, b) => {
            // D'abord par statut (actif d'abord)
            if (a.is_active !== b.is_active) {
              return b.is_active - a.is_active;
            }
            // Puis par nom
            return (a.name || '').localeCompare(b.name || '');
          })
        : [];
      
      setCategories(sortedCategories);
      
    } catch (error) {
      console.error('Fetch categories error:', error);
      setError(error.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  // Calculate how many categories can fit in the container
  const calculateVisibleCategories = useCallback(() => {
    if (!containerRef.current || !categoryCardRef.current) {
      setVisibleCategoriesCount(5); // Default fallback
      return;
    }
    
    const containerWidth = containerRef.current.offsetWidth;
    const cardWidth = 152; // 140px card + 12px gap
    const maxVisible = Math.floor(containerWidth / cardWidth) - 1; // -1 for "All" card
    
    // Minimum 3, maximum all categories
    const calculatedCount = Math.max(3, Math.min(maxVisible, categories.length));
    
    setVisibleCategoriesCount(calculatedCount);
    
    // Check if we need "View More" button
    const totalCardsNeeded = categories.length + 1; // +1 for "All" card
    const canShowAll = maxVisible >= totalCardsNeeded;
    
    setShowViewMore(!canShowAll && categories.length > calculatedCount);
  }, [categories.length]);
  
  // Check on mount, resize, and when categories change
  useLayoutEffect(() => {
    calculateVisibleCategories();
  }, [calculateVisibleCategories]);
  
  useEffect(() => {
    const handleResize = () => {
      calculateVisibleCategories();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateVisibleCategories]);
  
  // Handle category click
  const handleCategoryClick = (categoryId) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId === selectedCategoryId ? null : categoryId);
    }
  };
  
  // Toggle show all categories
  const toggleShowAllCategories = () => {
    setShowAllCategories(!showAllCategories);
  };
  
  // Clear filter
  const clearFilter = () => {
    if (onCategorySelect) {
      onCategorySelect(null);
    }
  };
  
  // Get categories to display
  const getDisplayCategories = () => {
    if (showAllCategories) {
      return categories;
    }
    
    // Return only the number of categories that can fit
    return categories.slice(0, Math.max(0, visibleCategoriesCount - 1)); // -1 for "All" card
  };
  
  const displayCategories = getDisplayCategories();
  const activeCategories = categories.filter(c => c.is_active);
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  
  // Loading state
  if (loading) {
    return (
      <div className="category-grid-loading">
        <FaSpinner className="spinner" />
        <span>Loading categories...</span>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="category-grid-error">
        <FaTimesCircle className="error-icon" />
        <span>{error}</span>
        <button className="btn-retry" onClick={fetchCategories}>
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="category-grid-container">
      {/* Header */}
      <div className="category-grid-header">
        <div className="grid-title-section">
          <FaFilter className="filter-icon" />
          <h3>Categories</h3>
          {selectedCategory && (
            <div className="selected-category-indicator">
              <span className="selected-category-name">
                {selectedCategory.name}
              </span>
              <button 
                className="clear-selection-btn"
                onClick={clearFilter}
                title="Clear filter"
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>
        
        {!selectedCategory && (
          <div className="grid-stats">
            <span className="total-categories-badge">
              {activeCategories.length} categories
            </span>
          </div>
        )}
      </div>
      
      {/* Categories Grid Container */}
      <div 
        className="categories-grid-wrapper"
        ref={containerRef}
      >
        <div 
          className={`categories-grid ${showAllCategories ? 'show-all' : ''}`}
          ref={contentRef}
        >
          {/* All Categories Card */}
          <div 
            className={`category-card ${!selectedCategoryId ? 'selected' : ''}`}
            onClick={() => handleCategoryClick(null)}
            ref={categoryCardRef}
          >
            <div className="card-content">
              <div className="card-icon all-categories-icon">
                <span>All</span>
              </div>
              <div className="card-info">
                <h4 className="card-title">All</h4>
                <p className="card-count">
                  {activeCategories.length} categories
                </p>
              </div>
            </div>
            {!selectedCategoryId && (
              <div className="selection-indicator"></div>
            )}
          </div>
          
          {/* Category Cards */}
          {displayCategories.map(category => (
            <div 
              key={category.id} 
              className={`category-card ${category.id === selectedCategoryId ? 'selected' : ''} ${!category.is_active ? 'inactive' : ''}`}
              onClick={() => category.is_active && handleCategoryClick(category.id)}
              title={!category.is_active ? "Inactive category" : category.description || category.name}
            >
              <div className="card-content">
                <div className="card-icon">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name}
                      className="category-icon-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.innerHTML = 
                            `<div class="category-icon-fallback">${category.name.charAt(0).toUpperCase()}</div>`;
                        }
                      }}
                    />
                  ) : (
                    <div className="category-icon-fallback">
                      {category.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!category.is_active && (
                    <div className="inactive-overlay"></div>
                  )}
                </div>
                
                <div className="card-info">
                  <h4 className="card-title">
                    {category.name}
                    {!category.is_active && (
                      <span className="inactive-dot"></span>
                    )}
                  </h4>
                  <p className="card-count">
                    {category.posts_count || 0} posts
                  </p>
                </div>
              </div>
              
              {category.id === selectedCategoryId && (
                <div className="selection-indicator"></div>
              )}
            </div>
          ))}
          
          {/* View More Button (only when needed) */}
          {showViewMore && !showAllCategories && categories.length > visibleCategoriesCount - 1 && (
            <div 
              className="category-card view-more-card"
              onClick={toggleShowAllCategories}
            >
              <div className="card-content">
                <div className="card-icon view-more-icon">
                  <FaEllipsisH />
                </div>
                <div className="card-info">
                  <h4 className="card-title">View More</h4>
                  <p className="card-count">
                    +{categories.length - (visibleCategoriesCount - 1)} more
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="category-grid-footer">
        <p>
          {selectedCategory 
            ? `Selected: ${selectedCategory.name} • ${selectedCategory.posts_count || 0} posts`
            : `${activeCategories.length} active categories available`
          }
          {showAllCategories && categories.length > visibleCategoriesCount - 1 && (
            <button 
              className="show-less-btn"
              onClick={toggleShowAllCategories}
            >
              Show less
            </button>
          )}
        </p>
      </div>
    </div>
  );
};

export default CategoryList;