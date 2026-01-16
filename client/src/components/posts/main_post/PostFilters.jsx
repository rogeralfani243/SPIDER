// src/components/posts/PostFilters.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Ajoutez cette importation
import { FaFilter, FaSlidersH, FaRedo, FaSearch, FaTag, FaSort, FaTimes } from 'react-icons/fa';
import CategoryList from './CategoryList';
import URL from '../../../hooks/useUrl';

const PostFilters = ({ filters, onFilterChange, onRefresh }) => {
  const navigate = useNavigate(); // Hook pour la navigation
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [localFilters, setLocalFilters] = useState(filters);
  const [categories, setCategories] = useState([]);
  const searchTimeoutRef = useRef(null);

  // Fetch all categories for the dropdown (fallback)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${URL}/post/categories/`, {
          headers: {
            'Authorization': token ? `Token ${token}` : '',
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          const categoriesArray = Array.isArray(data) ? data : data.results || data.categories || [];
          setCategories(categoriesArray);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Sync local state with props
  useEffect(() => {
    setLocalFilters(filters);
    setSearchInput(filters.search || '');
  }, [filters]);

  // Nettoyer le timeout quand le composant est démonté
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle category selection - MODIFIÉ pour gérer la redirection
  const handleCategorySelect = (categoryId) => {
    if (!categoryId) {
      // Si on désélectionne la catégorie
      const newFilters = { ...localFilters, category: '' };
      setLocalFilters(newFilters);
      onFilterChange(newFilters);
      return;
    }

    // Récupérer les informations de la catégorie sélectionnée
    const selectedCategory = categories.find(cat => cat.id === parseInt(categoryId));
    
    if (selectedCategory) {
      // Vérifier si c'est la catégorie "Software"
      const categoryName = selectedCategory.name.toLowerCase();
      
      if (categoryName.includes('software') || 
          selectedCategory.slug === 'software' ||
          selectedCategory.id === 1) { // Ajustez l'ID selon votre base de données
        // Rediriger vers la page dédiée
        navigate(`/posts/software`);
        return;
      }
    }

    // Pour les autres catégories, appliquer le filtre normal
    const newFilters = { ...localFilters, category: categoryId };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      const newFilters = { ...localFilters, search: value };
      setLocalFilters(newFilters);
      onFilterChange(newFilters);
    }, 500);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    const sortValue = e.target.value;
    let newFilters = { ...localFilters };
    
    delete newFilters.ordering;
    delete newFilters.min_ratings;
    delete newFilters.days;
    delete newFilters.confidence_weight;
    delete newFilters.engagement_weight;
    
    switch(sortValue) {
      case 'newest':
        newFilters.sort = 'newest';
        break;
      case 'oldest':
        newFilters.sort = 'oldest';
        break;
      case 'popular':
        newFilters.sort = 'popular';
        break;
      case 'rated':
        newFilters.sort = 'rated';
        break;
      default:
        newFilters.sort = 'newest';
    }
    
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    const defaultFilters = {
      category: '',
      search: '',
      sort: 'newest',
      ordering: '-created_at'
    };
    setLocalFilters(defaultFilters);
    setSearchInput('');
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    onFilterChange(defaultFilters);
  };

  // Get category name for display
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'All Categories';
    const category = categories.find(cat => cat.id === parseInt(categoryId));
    return category ? category.name : 'Selected Category';
  };

  // Clear search
  const clearSearch = () => {
    setSearchInput('');
    const newFilters = { ...localFilters, search: '' };
    setLocalFilters(newFilters);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    onFilterChange(newFilters);
  };

  return (
    <div className="post-filters">
      {/* Filter Header */}
      <div className="filter-header">
        <div className="filter-header-left">
          <button 
            className="btn-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
          >
            {showFilters ? <FaFilter /> : <FaSlidersH />}
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
          
          {/* Active filters indicator */}
          {(localFilters.category || localFilters.search || localFilters.sort !== 'newest') && (
            <div className="active-filters-indicator">
              <span className="filter-count">
                {[
                  localFilters.category && 'Category',
                  localFilters.search && 'Search',
                  localFilters.sort !== 'newest' && 'Sort'
                ].filter(Boolean).length} active
              </span>
            </div>
          )}
        </div>
        

      </div>

      {/* Expanded Filters Content */}
      {showFilters && (
        <div className="filter-content">
          {/* Category List Filter */}
          <div className="filter-section category-section">
            <div className="filter-section-header">
              <FaTag />
              <h4>Filter by Category</h4>
              {localFilters.category && (
                <button 
                  onClick={() => handleCategorySelect(null)}
                  className="btn-clear-category"
                  title="Clear category filter"
                >
                  <FaTimes /> Clear
                </button>
              )}
            </div>
            
          
          </div>

          {/* Search Filter */}
          <div className="filter-section">
            <div className="filter-section-header">
              <FaSearch />
              <h4>Search Posts</h4>
              {localFilters.search && (
                <button 
                  onClick={clearSearch}
                  className="btn-clear-search"
                  title="Clear search"
                >
                  <FaTimes /> Clear
                </button>
              )}
            </div>
            
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search by title or content..."
                value={searchInput}
                onChange={handleSearchChange}
                className="filter-input"
                aria-label="Search posts"
              />
              <FaSearch className="search-input-icon" />
            </div>
          </div>

          {/* Sort Filter */}
          <div className="filter-section">
            <div className="filter-section-header">
              <FaSort />
              <h4>Sort Posts</h4>
              {localFilters.sort !== 'newest' && (
                <button 
                  onClick={() => handleSortChange({ target: { value: 'newest' } })}
                  className="btn-clear-sort"
                  title="Reset to newest"
                >
                  <FaTimes /> Reset
                </button>
              )}
            </div>
            
            <div className="sort-options">
              <div className="sort-option-group">
                <div className="sort-radio-group">
                  <label className={`sort-option ${localFilters.sort === 'newest' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="sort"
                      value="newest"
                      checked={localFilters.sort === 'newest'}
                      onChange={handleSortChange}
                      className="sort-radio"
                    />
                    <span className="sort-label">
                      <span className="sort-title">Newest First</span>
                      <span className="sort-description">Show most recent posts first</span>
                    </span>
                  </label>
                  
                  <label className={`sort-option ${localFilters.sort === 'oldest' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="sort"
                      value="oldest"
                      checked={localFilters.sort === 'oldest'}
                      onChange={handleSortChange}
                      className="sort-radio"
                    />
                    <span className="sort-label">
                      <span className="sort-title">Oldest First</span>
                      <span className="sort-description">Show oldest posts first</span>
                    </span>
                  </label>
                </div>
                
                <div className="sort-radio-group">
                  <label className={`sort-option ${localFilters.sort === 'popular' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="sort"
                      value="popular"
                      checked={localFilters.sort === 'popular'}
                      onChange={handleSortChange}
                      className="sort-radio"
                    />
                    <span className="sort-label">
                      <span className="sort-title">Most Popular</span>
                      <span className="sort-description">Sort by number of likes</span>
                    </span>
                  </label>
                  
                  <label className={`sort-option ${localFilters.sort === 'rated' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="sort"
                      value="rated"
                      checked={localFilters.sort === 'rated'}
                      onChange={handleSortChange}
                      className="sort-radio"
                    />
                    <span className="sort-label">
                      <span className="sort-title">Best Rated</span>
                      <span className="sort-description">Sort by highest average rating</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="filter-actions">
            <button 
              onClick={clearFilters}
              className="btn-clear-all"
              disabled={!localFilters.category && !localFilters.search && localFilters.sort === 'newest'}
            >
              <FaTimes /> Clear All Filters
            </button>
            
            <div className="filter-summary">
              <span className="summary-text">
                {localFilters.category && (
                  <span className="summary-item">Category: {getCategoryName(localFilters.category)}</span>
                )}
                {localFilters.search && (
                  <span className="summary-item">Search: "{localFilters.search}"</span>
                )}
                {localFilters.sort !== 'newest' && (
                  <span className="summary-item">Sorted by: {localFilters.sort}</span>
                )}
                {!localFilters.category && !localFilters.search && localFilters.sort === 'newest' && (
                  <span className="summary-item">Showing all posts (newest first)</span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Current filter pills */}
      {(localFilters.category || localFilters.search || localFilters.sort !== 'newest') && (
        <div className="current-filters-pills">
          {localFilters.category && (
            <span className="filter-pill">
              Category: {getCategoryName(localFilters.category)}
              <button 
                onClick={() => handleCategorySelect(null)}
                className="pill-remove"
                aria-label="Remove category filter"
              >
                <FaTimes />
              </button>
            </span>
          )}
          
          {localFilters.search && (
            <span className="filter-pill">
              Search: "{localFilters.search}"
              <button 
                onClick={clearSearch}
                className="pill-remove"
                aria-label="Remove search filter"
              >
                <FaTimes />
              </button>
            </span>
          )}
          
          {localFilters.sort !== 'newest' && (
            <span className="filter-pill">
              Sorted by: {localFilters.sort}
              <button 
                onClick={() => handleSortChange({ target: { value: 'newest' } })}
                className="pill-remove"
                aria-label="Remove sort filter"
              >
                <FaTimes />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PostFilters;