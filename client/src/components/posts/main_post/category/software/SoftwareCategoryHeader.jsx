import React from 'react';
import { Link } from 'react-router-dom';

const SoftwareCategoryHeader = ({ category }) => {
  if (!category) return null;

  return (
    <div className="software-header">
      <div className="header-background">
        {category.image_url && (
          <img
            src={category.image_url}
            alt={category.name}
            className="header-bg-image"
          />
        )}
        <div className="header-overlay"></div>
      </div>
      
      <div className="header-content">
        <div className="header-main">
          <div className="category-icon">
            <i className="fas fa-code"></i>
          </div>
          <div className="category-info">
            <h1 className="category-title">
              {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
            </h1>
            <p className="category-description">
              {category.description || 'Explore software development topics, tutorials, and discussions'}
            </p>
            
            <div className="category-stats">
              <div className="stat">
                <i className="fas fa-file-alt"></i>
                <span className="stat-value">{category.posts_count || 0}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat">
                <i className="fas fa-users"></i>
                <span className="stat-value">--</span>
                <span className="stat-label">Contributors</span>
              </div>
              <div className="stat">
                <i className="fas fa-star"></i>
                <span className="stat-value">--</span>
                <span className="stat-label">Average Rating</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <Link to="/create-post" className="btn-primary btn-large">
            <i className="fas fa-plus"></i> Create Post
          </Link>
          
          <div className="action-buttons">
            <button className="btn-action">
              <i className="fas fa-bell"></i> Subscribe
            </button>
            <button className="btn-action">
              <i className="fas fa-share-alt"></i> Share
            </button>
            <button className="btn-action">
              <i className="fas fa-cog"></i> Settings
            </button>
          </div>
        </div>
      </div>
      
      <div className="category-breadcrumb">
        <Link to="/" className="breadcrumb-item">
          <i className="fas fa-home"></i> Home
        </Link>
        <i className="fas fa-chevron-right breadcrumb-separator"></i>
        <Link to="/categories" className="breadcrumb-item">
          Categories
        </Link>
        <i className="fas fa-chevron-right breadcrumb-separator"></i>
        <span className="breadcrumb-current">
          {category.name}
        </span>
      </div>
    </div>
  );
};

export default SoftwareCategoryHeader;