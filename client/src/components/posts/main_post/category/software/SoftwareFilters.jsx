// src/components/posts/main_post/category/SoftwareFilters.jsx
import React, { useState } from 'react';
import { Search, Filter, TrendingUp, Calendar, Star, Code, Server, Database, Cloud } from 'lucide-react';

// ✅ Fonction composant correctement exportée
const SoftwareFilters = ({ filters, onFilterChange, onRefresh, refreshing }) => {
  const [localFilters, setLocalFilters] = useState({
    search: filters.search || '',
    sort: filters.sort || 'newest',
    tag: filters.tag || '',
    type: filters.type || 'all',
    difficulty: filters.difficulty || 'all'
  });

  const softwareTags = [
    'javascript', 'python', 'react', 'nodejs', 'typescript',
    'java', 'csharp', 'php', 'ruby', 'go', 'rust',
    'web', 'mobile', 'desktop', 'cloud', 'devops',
    'frontend', 'backend', 'database', 'api', 'security'
  ];

  const difficultyLevels = [
    { id: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800' },
    { id: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'advanced', label: 'Advanced', color: 'bg-orange-100 text-orange-800' },
    { id: 'expert', label: 'Expert', color: 'bg-red-100 text-red-800' }
  ];

  const softwareTypes = [
    { id: 'all', label: 'All Software', icon: '📁' },
    { id: 'tutorial', label: 'Tutorials', icon: '📚' },
    { id: 'project', label: 'Projects', icon: '🚀' },
    { id: 'code', label: 'Code Snippets', icon: '💻' },
    { id: 'review', label: 'Reviews', icon: '⭐' },
    { id: 'bug', label: 'Bug Fixes', icon: '🐛' },
    { id: 'discussion', label: 'Discussions', icon: '💬' },
    { id: 'tool', label: 'Tools', icon: '🛠️' }
  ];

  const sortOptions = [
    { id: 'newest', label: 'Newest', icon: <Calendar size={16} /> },
    { id: 'popular', label: 'Most Popular', icon: <TrendingUp size={16} /> },
    { id: 'rated', label: 'Best Rated', icon: <Star size={16} /> },
    { id: 'most_commented', label: 'Most Discussed', icon: '💬' }
  ];

  const techCategories = [
    { id: 'frontend', label: 'Frontend', icon: <Code size={16} /> },
    { id: 'backend', label: 'Backend', icon: <Server size={16} /> },
    { id: 'database', label: 'Database', icon: <Database size={16} /> },
    { id: 'cloud', label: 'Cloud/DevOps', icon: <Cloud size={16} /> }
  ];

  const handleSearchChange = (e) => {
    const value = e.target.value;
    const newFilters = { ...localFilters, search: value };
    setLocalFilters(newFilters);
    onFilterChange({ search: value });
  };

  const handleSortChange = (sortType) => {
    const newFilters = { ...localFilters, sort: sortType };
    setLocalFilters(newFilters);
    onFilterChange({ sort: sortType });
  };

  const handleTagClick = (tag) => {
    const newTag = localFilters.tag === tag ? '' : tag;
    const newFilters = { ...localFilters, tag: newTag };
    setLocalFilters(newFilters);
    onFilterChange({ tag: newTag });
  };

  const handleTypeChange = (type) => {
    const newFilters = { ...localFilters, type };
    setLocalFilters(newFilters);
    onFilterChange({ type });
  };

  const handleDifficultyChange = (difficulty) => {
    const newFilters = { ...localFilters, difficulty };
    setLocalFilters(newFilters);
    onFilterChange({ difficulty });
  };

  const clearFilters = () => {
    const cleared = {
      search: '',
      sort: 'newest',
      tag: '',
      type: 'all',
      difficulty: 'all'
    };
    setLocalFilters(cleared);
    onFilterChange(cleared);
  };

  const isFilterActive = () => {
    return localFilters.search !== '' || 
           localFilters.sort !== 'newest' || 
           localFilters.tag !== '' || 
           localFilters.type !== 'all' ||
           localFilters.difficulty !== 'all';
  };

  return (
    <div className="software-filters bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Code className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Software Filters</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          {isFilterActive() && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 px-3 py-1 border border-red-200 rounded hover:bg-red-50"
            >
              Clear All
            </button>
          )}
          
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 flex items-center space-x-1"
          >
            <span>Refresh</span>
            {refreshing && (
              <span className="animate-spin">⟳</span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={localFilters.search}
            onChange={handleSearchChange}
            placeholder="Search software posts, code snippets, tutorials..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Sort Options */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Sort by</h3>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSortChange(option.id)}
              className={`px-3 py-2 text-sm rounded-lg flex items-center space-x-2 ${
                localFilters.sort === option.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.icon && <span>{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Software Types */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Software Type</h3>
        <div className="flex flex-wrap gap-2">
          {softwareTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeChange(type.id)}
              className={`px-3 py-2 text-sm rounded-lg flex items-center space-x-2 ${
                localFilters.type === type.id
                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Levels */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Difficulty Level</h3>
        <div className="flex flex-wrap gap-2">
          {difficultyLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => handleDifficultyChange(level.id)}
              className={`px-3 py-2 text-sm rounded-lg ${
                localFilters.difficulty === level.id
                  ? `${level.color} border`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Popular Tags */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {softwareTags.slice(0, 10).map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1 text-sm rounded-full ${
                localFilters.tag === tag
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Tech Categories */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Tech Categories</h3>
        <div className="flex flex-wrap gap-2">
          {techCategories.map((category) => (
            <button
              key={category.id}
              className="px-3 py-2 text-sm rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 flex items-center space-x-2"
              onClick={() => {
                // Option: Add category filtering logic
              }}
            >
              {category.icon}
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {isFilterActive() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h3>
          <div className="flex flex-wrap gap-2">
            {localFilters.search && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Search: "{localFilters.search}"
                <button
                  onClick={() => {
                    const newFilters = { ...localFilters, search: '' };
                    setLocalFilters(newFilters);
                    onFilterChange({ search: '' });
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {localFilters.tag && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                Tag: #{localFilters.tag}
                <button
                  onClick={() => {
                    const newFilters = { ...localFilters, tag: '' };
                    setLocalFilters(newFilters);
                    onFilterChange({ tag: '' });
                  }}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {localFilters.type !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                Type: {softwareTypes.find(t => t.id === localFilters.type)?.label}
                <button
                  onClick={() => {
                    const newFilters = { ...localFilters, type: 'all' };
                    setLocalFilters(newFilters);
                    onFilterChange({ type: 'all' });
                  }}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {localFilters.difficulty !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                Difficulty: {difficultyLevels.find(d => d.id === localFilters.difficulty)?.label}
                <button
                  onClick={() => {
                    const newFilters = { ...localFilters, difficulty: 'all' };
                    setLocalFilters(newFilters);
                    onFilterChange({ difficulty: 'all' });
                  }}
                  className="ml-2 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ EXPORT PAR DÉFAUT (sans accolades)
export default SoftwareFilters;