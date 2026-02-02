// src/components/posts/AlgorithmSelector.jsx - MODIFICATIONS
import React, { useState } from 'react';
import { 
  FiFilter,
  FiGlobe,
  FiUser,
  FiTrendingUp,
  FiClock,
  FiStar,
  FiMessageCircle,
  FiEye,
  FiTarget,
  FiEyeOff,
  FiRefreshCw
} from 'react-icons/fi';
import { 
  MdOutlineRecommend,
  MdOutlineNewReleases,
  MdOutlineFlag,
  MdOutlineGroup,
  MdOutlineArrowDropDown,
  MdOutlineVisibilityOff
} from 'react-icons/md';
import { TbTargetArrow, TbEyeCancel } from 'react-icons/tb';

const AlgorithmSelector = ({ currentAlgorithm, onAlgorithmChange, algorithmInfo, userContext }) => {
  const [isOpen, setIsOpen] = useState(false);

  const algorithms = [
    {
      id: 'avoid_seen_priority', // NOUVEL ALGORITHME
      name: 'Discover New',
      icon: <FiEyeOff />,
      description: 'Prioritize posts you haven\'t interacted with',
      color: '#FF6B6B',
      priority: 1
    },
    {
      id: 'recommended',
      name: 'Recommended',
      icon: <MdOutlineRecommend />,
      description: 'Personalized recommendation algorithm',
      color: '#007AFF',
      priority: 2
    },
    {
      id: 'country_priority',
      name: 'Country Priority',
      icon: <MdOutlineFlag />,
      description: 'Priority to posts from your country',
      color: '#34C759',
      priority: 3
    },
    {
      id: 'fresh_for_you',
      name: 'Fresh for You',
      icon: <MdOutlineNewReleases />,
      description: 'Recent posts adapted to your preferences',
      color: '#FF9500',
      priority: 4
    },
    {
      id: 'similar_users',
      name: 'Similar Users',
      icon: <MdOutlineGroup />,
      description: 'Recommendations from similar users',
      color: '#AF52DE',
      priority: 5
    },
    {
      id: 'avoid_seen',
      name: 'Avoid Seen',
      icon: <TbTargetArrow />,
      description: 'Avoid posts already seen/rated',
      color: '#FF3B30',
      priority: 6
    },
    {
      id: 'newest',
      name: 'Newest',
      icon: <FiClock />,
      description: 'Most recent posts',
      color: '#8E8E93',
      priority: 7
    },
    {
      id: 'popular',
      name: 'Popular',
      icon: <FiTrendingUp />,
      description: 'Most popular posts',
      color: '#5856D6',
      priority: 8
    },
    {
      id: 'top_rated',
      name: 'Top Rated',
      icon: <FiStar />,
      description: 'Best rated posts',
      color: '#FFCC00',
      priority: 9
    },
    {
      id: 'most_commented',
      name: 'Most Commented',
      icon: <FiMessageCircle />,
      description: 'Most commented posts',
      color: '#5AC8FA',
      priority: 10
    }
  ];

  // Trier par priorité
  const sortedAlgorithms = [...algorithms].sort((a, b) => a.priority - b.priority);

  const currentAlgorithmData = algorithms.find(algo => algo.id === currentAlgorithm) || algorithms[0];

  // Grouper les algorithmes par catégorie
  const algorithmCategories = [
    {
      name: 'Discovery',
      algorithms: sortedAlgorithms.filter(algo => 
        ['avoid_seen_priority', 'fresh_for_you', 'newest'].includes(algo.id)
      )
    },
    {
      name: 'Personalized',
      algorithms: sortedAlgorithms.filter(algo => 
        ['recommended', 'country_priority', 'similar_users'].includes(algo.id)
      )
    },
    {
      name: 'Filtered',
      algorithms: sortedAlgorithms.filter(algo => 
        ['avoid_seen'].includes(algo.id)
      )
    },
    {
      name: 'Popularity',
      algorithms: sortedAlgorithms.filter(algo => 
        ['popular', 'top_rated', 'most_commented'].includes(algo.id)
      )
    }
  ];

  return (
    <div className="algorithm-selector">
      <button 
        className="algorithm-selector-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="algorithm-current">
          <span className="algorithm-icon" style={{ color: currentAlgorithmData.color }}>
            {currentAlgorithmData.icon}
          </span>
          <span className="algorithm-name">{currentAlgorithmData.name}</span>
          <MdOutlineArrowDropDown className="dropdown-arrow" />
        </span>
        {currentAlgorithm === 'avoid_seen_priority' && (
          <span className="algorithm-badge-new">NEW</span>
        )}
      </button>

      {isOpen && (
        <div className="algorithm-dropdown">
          <div className="algorithm-dropdown-header">
            <h4>📊 Content Discovery</h4>
            <p>Choose how posts are sorted and recommended to you</p>
          </div>
          
          {algorithmCategories.map((category, index) => (
            <div key={index} className="algorithm-category">
              <div className="algorithm-category-name">{category.name}</div>
              <div className="algorithm-list">
                {category.algorithms.map(algorithm => (
                  <button
                    key={algorithm.id}
                    className={`algorithm-option ${currentAlgorithm === algorithm.id ? 'active' : ''}`}
                    onClick={() => {
                      onAlgorithmChange(algorithm.id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="algorithm-option-icon" style={{ 
                      backgroundColor: `${algorithm.color}15`, 
                      color: algorithm.color 
                    }}>
                      {algorithm.icon}
                    </div>
                    <div className="algorithm-option-info">
                      <div className="algorithm-option-name">
                        {algorithm.name}
                        {algorithm.id === 'avoid_seen_priority' && (
                          <span className="algorithm-tag-new">New</span>
                        )}
                      </div>
                      <div className="algorithm-option-description">{algorithm.description}</div>
                    </div>
                    {currentAlgorithm === algorithm.id && (
                      <div className="algorithm-option-check">
                        <div className="check-circle" style={{ backgroundColor: algorithm.color }}>
                          ✓
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          <div className="algorithm-stats">
            {userContext && userContext.is_authenticated && (
              <>
                <div className="stat-item">
                  <FiEye />
                  <span>Personalized for you</span>
                </div>
                {userContext.country && (
                  <div className="stat-item">
                    <FiGlobe />
                    <span>Country: {userContext.country}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default AlgorithmSelector;