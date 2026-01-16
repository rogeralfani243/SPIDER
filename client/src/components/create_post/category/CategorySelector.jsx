import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import URL from '../../../hooks/useUrl';
import '../../../styles/create_post/category-selector.css';

const CategorySelector = memo(({ 
  selectedCategoryId, 
  onCategoryChange, 
  disabled = false,
  showOnlyActive = true,
  placeholder = "Select a category"
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  
  const dropdownRef = useRef(null);

  // Function to find a category by ID
  const findCategoryById = useCallback((catList, catId) => {
    for (const cat of catList) {
      if (cat.id === catId) {
        return cat;
      }
      if (cat.subcategories && cat.subcategories.length > 0) {
        const found = findCategoryById(cat.subcategories, catId);
        if (found) {
          const parent = catList.find(c => 
            c.subcategories && c.subcategories.some(sc => sc.id === catId)
          );
          return { ...found, parent };
        }
      }
    }
    return null;
  }, []);

  // Load all categories with hierarchy - ONLY ONCE
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          active_only: showOnlyActive ? 'true' : 'false'
        });

        const response = await fetch(`${URL}/post/categories/?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': token ? `Token ${token}` : '',
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setCategories(data);
          
          // Find the selected category only if it has changed
          if (selectedCategoryId) {
            const foundCat = findCategoryById(data, selectedCategoryId);
            if (foundCat) {
              setSelectedCategory(foundCat);
              setSelectedParent(foundCat.parent || null);
            }
          }
        } else {
          setError('Error loading categories');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [selectedCategoryId, showOnlyActive, findCategoryById]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHoveredCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((category) => {
    console.log('Category selected:', category.id, category.name);
    onCategoryChange(category.id);
    setSelectedCategory(category);
    setSelectedParent(category.parent || null);
    setIsOpen(false);
    setHoveredCategory(null);
  }, [onCategoryChange]);

  const handleParentSelect = useCallback((parentCategory) => {
    // If the parent category has no subcategories, we can select it directly
    if (!parentCategory.subcategories || parentCategory.subcategories.length === 0) {
      handleSelect(parentCategory);
    } else {
      // Otherwise, we show the subcategories
      setHoveredCategory(parentCategory);
    }
  }, [handleSelect]);

  const clearSelection = useCallback(() => {
    console.log('Clearing category selection');
    onCategoryChange(null);
    setSelectedCategory(null);
    setSelectedParent(null);
  }, [onCategoryChange]);

  const getCategoryImage = useCallback((category) => {
    if (category.image_url) {
      return category.image_url;
    }
    if (category.image) {
      return category.image;
    }
    return 'https://via.placeholder.com/40x40?text=📁';
  }, []);

  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev);
      if (isOpen) {
        setHoveredCategory(null);
      }
    }
  }, [disabled, isOpen]);

  // Main categories (without parent)
  const parentCategories = categories.filter(cat => !cat.parent);

  if (loading) {
    return (
      <div className="modern-category-selector loading">
        <div className="selector-label">Category *</div>
        <div className="selector-input">
          <div className="loading-spinner"></div>
          <span>Loading categories...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-category-selector error">
        <div className="selector-label">Category *</div>
        <div className="selector-input">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  console.log('CategorySelector rendering with selected:', selectedCategoryId);

  return (
    <div className="modern-category-selector" ref={dropdownRef}>
      <div className="selector-label">Category *</div>
      
      <div className="selector-container">
        {/* Main selection field */}
        <div 
          className={`selector-input ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={toggleDropdown}
        >
          <div className="selected-value">
            {selectedCategory ? (
              <div className="selected-category-display">
                <img 
                  src={getCategoryImage(selectedCategory)} 
                  alt={selectedCategory.name}
                  className="selected-category-image"
                  loading="lazy"
                />
                <div className="selected-category-info">
                  <span className="selected-category-name">{selectedCategory.name}</span>
                  {selectedParent && (
                    <span className="selected-category-parent">{selectedParent.name} → </span>
                  )}
                </div>
              </div>
            ) : (
              <span className="placeholder">{placeholder}</span>
            )}
          </div>
          
          <div className="selector-actions">
            {selectedCategory && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="clear-btn"
                title="Clear selection"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
            <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
          </div>
        </div>

        {/* Categories dropdown */}
        {isOpen && !disabled && (
          <div className="category-dropdown">
            <div className="dropdown-header">
              <h5>
                <i className="fas fa-folder"></i>
                Select a category ({parentCategories.length} available)
              </h5>
            </div>
            
            <div className="categories-list">
              {/* Main categories list */}
              <div className="parent-categories-section">
                {parentCategories.map(category => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    hoveredCategory={hoveredCategory}
                    selectedCategory={selectedCategory}
                    onMouseEnter={setHoveredCategory}
                    onClick={handleParentSelect}
                    getCategoryImage={getCategoryImage}
                  />
                ))}
              </div>

              {/* Subcategories panel (appears on hover) */}
              {hoveredCategory && hoveredCategory.subcategories && hoveredCategory.subcategories.length > 0 && (
                <SubcategoriesPanel
                  hoveredCategory={hoveredCategory}
                  selectedCategory={selectedCategory}
                  onSelect={handleSelect}
                  onClose={() => setHoveredCategory(null)}
                  getCategoryImage={getCategoryImage}
                />
              )}
            </div>

            {/* No categories */}
            {parentCategories.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-folder-open"></i>
                <p>No categories available</p>
              </div>
            )}
          </div>
        )}
      </div>

     

      {/* Validation */}
      {!selectedCategory && isOpen && (
        <div className="validation-message">
          <i className="fas fa-exclamation-circle"></i>
          Please select a category
        </div>
      )}
    </div>
  );
});

// Memoized component for category items
const CategoryItem = memo(({ 
  category, 
  hoveredCategory, 
  selectedCategory, 
  onMouseEnter, 
  onClick, 
  getCategoryImage 
}) => {
  return (
    <div 
      className={`category-item ${hoveredCategory?.id === category.id ? 'hovered' : ''} ${selectedCategory?.id === category.id ? 'selected' : ''}`}
      onMouseEnter={() => onMouseEnter(category)}
      onClick={() => onClick(category)}
    >
      <div className="category-item-content">
        <img 
          src={getCategoryImage(category)} 
          alt={category.name}
          className="category-image"
          loading="lazy"
        />
        <div className="category-info">
          <div className="category-name">{category.name}</div>
          {category.description && (
            <div className="category-description">{category.description}</div>
          )}
          {category.posts_count > 0 && (
            <div className="category-stats">
              <i className="fas fa-file-alt"></i>
              <span>{category.posts_count} post{category.posts_count > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        
        {/* Subcategories indicator */}
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="subcategory-indicator">
            <i className="fas fa-chevron-right"></i>
            <span>{category.subcategories.length} subcategor{category.subcategories.length > 1 ? 'ies' : 'y'}</span>
          </div>
        )}
      </div>
    </div>
  );
});

// Memoized component for subcategories panel
const SubcategoriesPanel = memo(({ 
  hoveredCategory, 
  selectedCategory, 
  onSelect, 
  onClose, 
  getCategoryImage 
}) => {
  return (
    <div className="subcategories-panel">
      <div className="subcategories-header">
        <h6>
          <img 
            src={getCategoryImage(hoveredCategory)} 
            alt={hoveredCategory.name}
            className="parent-category-image"
            loading="lazy"
          />
          Subcategories of {hoveredCategory.name}
        </h6>
        <button 
          className="close-subcategories"
          onClick={onClose}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="subcategories-list">
        {hoveredCategory.subcategories.map(subCategory => (
          <SubcategoryItem
            key={subCategory.id}
            subCategory={subCategory}
            selectedCategory={selectedCategory}
            onSelect={onSelect}
            getCategoryImage={getCategoryImage}
          />
        ))}
      </div>
    </div>
  );
});

// Memoized component for subcategory items
const SubcategoryItem = memo(({ 
  subCategory, 
  selectedCategory, 
  onSelect, 
  getCategoryImage 
}) => {
  return (
    <div 
      className={`subcategory-item ${selectedCategory?.id === subCategory.id ? 'selected' : ''}`}
      onClick={() => onSelect(subCategory)}
    >
      <img 
        src={getCategoryImage(subCategory)} 
        alt={subCategory.name}
        className="subcategory-image"
        loading="lazy"
      />
      <div className="subcategory-info">
        <div className="subcategory-name">{subCategory.name}</div>
        {subCategory.description && (
          <div className="subcategory-description">{subCategory.description}</div>
        )}
        {subCategory.posts_count > 0 && (
          <div className="subcategory-stats">
            <i className="fas fa-file-alt"></i>
            <span>{subCategory.posts_count}</span>
          </div>
        )}
      </div>
      {selectedCategory?.id === subCategory.id && (
        <i className="fas fa-check selected-icon"></i>
      )}
    </div>
  );
});

// Display component name in devtools
CategorySelector.displayName = 'CategorySelector';
CategoryItem.displayName = 'CategoryItem';
SubcategoriesPanel.displayName = 'SubcategoriesPanel';
SubcategoryItem.displayName = 'SubcategoryItem';

export default CategorySelector;