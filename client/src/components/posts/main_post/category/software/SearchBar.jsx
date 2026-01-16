// src/components/posts/main_post/category/SoftwareSearchBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Code, Tag, User, Hash, Cpu, Server, Database, Cloud, Smartphone, Globe } from 'lucide-react';

const SearchBar = ({ 
  onSearchChange, 
  onFilterChange, 
  initialFilters = {},
  availableTags = [],
  popularTechs = [],
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [activeTag, setActiveTag] = useState(initialFilters.tag || '');
  const [searchType, setSearchType] = useState(initialFilters.searchType || 'all');
  const [techStack, setTechStack] = useState(initialFilters.techStack || []);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Predefined tech categories for software
  const techCategories = [
    {
      id: 'frontend',
      label: 'Frontend',
      icon: <Globe size={16} />,
      techs: ['React', 'Vue', 'Angular', 'JavaScript', 'TypeScript', 'HTML', 'CSS']
    },
    {
      id: 'backend',
      label: 'Backend',
      icon: <Server size={16} />,
      techs: ['Node.js', 'Python', 'Java', 'PHP', 'Ruby', 'Go', 'Rust', '.NET']
    },
    {
      id: 'mobile',
      label: 'Mobile',
      icon: <Smartphone size={16} />,
      techs: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS']
    },
    {
      id: 'database',
      label: 'Database',
      icon: <Database size={16} />,
      techs: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Firebase']
    },
    {
      id: 'cloud',
      label: 'Cloud & DevOps',
      icon: <Cloud size={16} />,
      techs: ['AWS', 'Docker', 'Kubernetes', 'Azure', 'CI/CD', 'Terraform']
    },
    {
      id: 'tools',
      label: 'Tools & Frameworks',
      icon: <Cpu size={16} />,
      techs: ['Git', 'Webpack', 'GraphQL', 'REST', 'Testing', 'Debugging']
    }
  ];

  // Predefined search types for software
  const searchTypes = [
    { id: 'all', label: 'All Software', icon: <Search size={16} /> },
    { id: 'code', label: 'Code Snippets', icon: <Code size={16} /> },
    { id: 'tutorial', label: 'Tutorials', icon: <Globe size={16} /> },
    { id: 'project', label: 'Projects', icon: <Server size={16} /> },
    { id: 'issue', label: 'Bug Fixes', icon: <Cpu size={16} /> },
    { id: 'discussion', label: 'Discussions', icon: <User size={16} /> }
  ];

  // Popular software tags
  const defaultPopularTags = [
    'javascript', 'python', 'react', 'nodejs', 'typescript', 
    'java', 'csharp', 'php', 'ruby', 'go', 'rust',
    'web', 'mobile', 'desktop', 'cloud', 'devops',
    'frontend', 'backend', 'database', 'api', 'security',
    'tutorial', 'project', 'bug', 'help', 'review'
  ];

  const popularTags = availableTags.length > 0 ? availableTags : defaultPopularTags;

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Show suggestions based on input
    if (value.length > 1) {
      const filteredSuggestions = popularTags.filter(tag =>
        tag.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Apply search
  const applySearch = () => {
    const filters = {
      search: searchTerm.trim(),
      tag: activeTag,
      searchType,
      techStack
    };
    
    onSearchChange(filters);
    if (onFilterChange) {
      onFilterChange(filters);
    }
    
    setShowSuggestions(false);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      applySearch();
    }
  };

  // Handle tag click
  const handleTagClick = (tag) => {
    setActiveTag(prev => prev === tag ? '' : tag);
  };

  // Handle search type change
  const handleSearchTypeClick = (type) => {
    setSearchType(type);
  };

  // Handle tech stack toggle
  const handleTechStackToggle = (tech) => {
    setTechStack(prev => 
      prev.includes(tech) 
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  };

  // Clear all filters
  const handleClearAll = () => {
    setSearchTerm('');
    setActiveTag('');
    setSearchType('all');
    setTechStack([]);
    setShowSuggestions(false);
    
    const clearedFilters = {
      search: '',
      tag: '',
      searchType: 'all',
      techStack: []
    };
    
    onSearchChange(clearedFilters);
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    
    const filters = {
      search: suggestion,
      tag: activeTag,
      searchType,
      techStack
    };
    
    onSearchChange(filters);
    if (onFilterChange) {
      onFilterChange(filters);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = searchTerm || activeTag || searchType !== 'all' || techStack.length > 0;

  return (
    <div className="software-search-bar">
      {/* Main Search Bar */}
      <div className="search-bar-main" ref={searchRef}>
        <div className="search-input-container">
          <Search className="search-icon" size={20} />
          
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            placeholder="Search software posts, code snippets, tutorials..."
            className="search-input"
            disabled={isLoading}
          />
          
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => {
                setSearchTerm('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
          
          <button 
            className="search-btn"
            onClick={applySearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <Search size={16} />
                <span className="search-btn-text">Search</span>
              </>
            )}
          </button>
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown" ref={suggestionsRef}>
            <div className="suggestions-header">
              <Tag size={14} />
              <span>Suggestions</span>
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <Hash size={12} />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        )}

        {/* Advanced Filter Toggle */}
        <button
          className={`advanced-toggle-btn ${showAdvanced ? 'active' : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-label="Advanced filters"
        >
          <Filter size={16} />
          <span>Advanced Filters</span>
          <span className="filter-count">{techStack.length}</span>
        </button>
      </div>

      {/* Quick Search Types */}
      <div className="search-types">
        {searchTypes.map(type => (
          <button
            key={type.id}
            className={`search-type-btn ${searchType === type.id ? 'active' : ''}`}
            onClick={() => handleSearchTypeClick(type.id)}
          >
            {type.icon}
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Popular Tags */}
      <div className="popular-tags">
        <div className="tags-header">
          <Tag size={16} />
          <span>Popular Tags</span>
        </div>
        <div className="tags-grid">
          {popularTags.slice(0, 12).map(tag => (
            <button
              key={tag}
              className={`tag-btn ${activeTag === tag ? 'active' : ''}`}
              onClick={() => handleTagClick(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="advanced-filters-panel">
          <div className="advanced-header">
            <h4>Advanced Tech Stack Filters</h4>
            <p>Select specific technologies to filter posts</p>
          </div>

          {/* Tech Categories */}
          <div className="tech-categories">
            {techCategories.map(category => (
              <div key={category.id} className="tech-category">
                <div className="category-header">
                  {category.icon}
                  <span>{category.label}</span>
                </div>
                <div className="category-techs">
                  {category.techs.map(tech => (
                    <button
                      key={tech}
                      className={`tech-btn ${techStack.includes(tech) ? 'selected' : ''}`}
                      onClick={() => handleTechStackToggle(tech)}
                    >
                      {tech}
                      {techStack.includes(tech) && <X size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Tech Stack */}
          {techStack.length > 0 && (
            <div className="selected-tech-stack">
              <div className="selected-header">
                <span>Selected Technologies ({techStack.length})</span>
                <button 
                  className="clear-techs-btn"
                  onClick={() => setTechStack([])}
                >
                  Clear All
                </button>
              </div>
              <div className="selected-techs">
                {techStack.map(tech => (
                  <span key={tech} className="selected-tech-tag">
                    {tech}
                    <button 
                      onClick={() => handleTechStackToggle(tech)}
                      className="remove-tech-btn"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="advanced-actions">
            <button 
              className="apply-filters-btn"
              onClick={applySearch}
              disabled={isLoading}
            >
              {isLoading ? 'Applying...' : 'Apply Filters'}
            </button>
            <button 
              className="clear-filters-btn"
              onClick={handleClearAll}
              disabled={!hasActiveFilters}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="active-filters">
          <div className="filters-header">
            <Filter size={14} />
            <span>Active Filters</span>
          </div>
          <div className="filters-tags">
            {searchTerm && (
              <span className="active-filter-tag">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')}>
                  <X size={12} />
                </button>
              </span>
            )}
            
            {activeTag && (
              <span className="active-filter-tag">
                Tag: #{activeTag}
                <button onClick={() => setActiveTag('')}>
                  <X size={12} />
                </button>
              </span>
            )}
            
            {searchType !== 'all' && (
              <span className="active-filter-tag">
                Type: {searchTypes.find(t => t.id === searchType)?.label}
                <button onClick={() => setSearchType('all')}>
                  <X size={12} />
                </button>
              </span>
            )}
            
            {techStack.map(tech => (
              <span key={tech} className="active-filter-tag">
                Tech: {tech}
                <button onClick={() => handleTechStackToggle(tech)}>
                  <X size={12} />
                </button>
              </span>
            ))}
            
            <button 
              className="clear-all-filters-btn"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;