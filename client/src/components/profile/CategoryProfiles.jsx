import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import URL from '../../hooks/useUrl';
import '../../styles/CategoryProfiles.css';
import DashboardMain from '../dashboard_main';
const CategoryProfiles = () => {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryData, setCategoryData] = useState(null);

  const categoryName = location.state?.categoryName || 'Category';

  useEffect(() => {
    fetchCategoryProfiles();
  }, [categoryId]);

  const fetchCategoryProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      const apiUrl = `${URL}/api/profiles/category/${categoryId}/`;
      
      console.log('Fetching from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      console.log('Response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', text.substring(0, 500));
        
        // If it's HTML, check for common error pages
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          if (response.status === 404) {
            throw new Error(`Category not found (404). Please check if the API endpoint exists.`);
          } else if (response.status === 500) {
            throw new Error('Server error (500). Please check the Django server logs.');
          } else {
            throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
          }
        } else {
          throw new Error('Unexpected response format from server');
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      // Handle different response formats
      if (data.profiles) {
        setProfiles(data.profiles);
        setCategoryData(data);
      } else if (Array.isArray(data)) {
        // If the API returns an array directly
        setProfiles(data);
      } else {
        throw new Error('Unexpected data format from API');
      }
      
    } catch (err) {
      console.error('Error fetching category profiles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate initials from user's name or username
   * @param {Object} profile - Profile object
   * @returns {string} User initials
   */
  const getInitials = (profile) => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    } else if (profile.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    } else if (profile.last_name) {
      return profile.last_name.charAt(0).toUpperCase();
    } else {
      // Use first two characters of username
      return profile.username.substring(0, 2).toUpperCase();
    }
  };

  /**
   * Generate a consistent color based on user's name
   * @param {string} name - User's name or username
   * @returns {string} CSS color value
   */
  const getAvatarColor = (name) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  /**
   * Render profile avatar - either image or initials
   * @param {Object} profile - Profile object
   * @returns {JSX.Element} Avatar component
   */
  const renderAvatar = (profile) => {
    if (profile.image) {
      return (
        <img 
          src={profile.image} 
          alt={`Profile of ${profile.first_name || profile.username}`}
          className="profile-image-category"
          onError={(e) => {
            // If image fails to load, show initials instead
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    const initials = getInitials(profile);
    const backgroundColor = getAvatarColor(profile.first_name || profile.last_name || profile.username);
    
    return (
      <div 
        className="profile-initials"
        style={{ backgroundColor }}
      >
        {initials}
      </div>
    );
  };

  /**
   * Render star rating component
   * @param {number} rating - Average rating from 0 to 5
   */
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="star full">
          ★
        </span>
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <span key="half" className="star half">
          ★
        </span>
      );
    }

    // Empty stars
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="star empty">
          ★
        </span>
      );
    }

    return stars;
  };

  /**
   * Handle profile card click
   * @param {number} profileId 
   * @param {Event} e 
   */
  const handleProfileClick = (profileId, e) => {
    e.preventDefault();
    window.location.href = `/profile/${profileId}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="category-profiles-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading professionals...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="category-profiles-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Unable to Load Professionals</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button 
              onClick={fetchCategoryProfiles} 
              className="retry-button"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate(-1)} 
              className="back-button"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (profiles.length === 0) {
    return (
      <div className="category-profiles-page">
        <div className="page-header">
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <h1>{categoryName} Professionals</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No Professionals Found</h3>
          <p>There are no professionals in this category at the moment.</p>
          <button 
            onClick={() => navigate(-1)} 
            className="back-button"
          >
            Browse Other Categories
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
  <div>

      <div className="category-profiles-page">
      
      {/* Page header */}
      <div className="page-header">

        <div className="header-content">
          <h1>{categoryData?.category_name || categoryName} Account{profiles.length !== 1 ? 's' : ''}</h1>
          <p className="profiles-count">
            {profiles.length} account{profiles.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Profiles grid */}
      <div className="profiles-grid">
        {profiles.map((profile) => (
          <article 
            key={profile.id} 
            className="profile-card-large"
            onClick={(e) => handleProfileClick(profile.id, e)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleProfileClick(profile.id, e);
              }
            }}
            aria-label={`View ${profile.first_name || profile.username}'s profile`}
          >
            {/* Profile avatar - image or initials */}
             <div className="profile-avatar-container-3d">
                        {renderAvatar(profile)}
                        {profile.image && profile.image !== '/default-avatar.png' && !profile.image.includes('default-avatar') && (
                          <div 
                            className="profile-initials-3d fallback"
                            style={{ 
                              backgroundColor: getAvatarColor(profile.first_name || profile.last_name || profile.username),
                              display: 'none',
                            }}
                          >
                            {getInitials(profile)}
                          </div>
                        )}
                      </div>
                      
                      <div className="profile-content-3d">
                        <h3 className="profile-names">
                          {profile.first_name && profile.last_name 
                            ? `${profile.first_name} ${profile.last_name}`
                            : profile.username
                          }
                        </h3>
                        
                        <div className="profile-rating-3d">
                          <div className="stars-container-3d">
                            {renderStars(profile.avg_rating || 0)}
                          </div>
                          <span className="rating-value-3d">
                            ({(profile.avg_rating || 0).toFixed(1)})
                          </span>
                        </div>
                        
                        <p className="feedback-count-3d">
                          {profile.feedback_count || 0} review{(profile.feedback_count || 0) !== 1 ? 's' : ''}
                        </p>
                        
                        {profile.bio && (
                          <p className="profile-bio-3d">
                            {profile.bio.length > 80 
                              ? `${profile.bio.substring(0, 80)}...` 
                              : profile.bio
                            }
                          </p>
                        )}
                      </div>
     
          </article>
        ))}
      </div>
    </div>
  </div>
  );
};

export default CategoryProfiles;