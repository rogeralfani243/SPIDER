// components/search/ProfileSearchResults.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import '../../styles/userbar/user_profil_bar.css';
import '../../styles/profileSearch.css';
import URL from '../../hooks/useUrl';
import { 
  FiUser, 
  FiMapPin, 
  FiBriefcase, 
  FiStar, 
  FiFilter,
  FiGrid,
  FiMessageSquare,

  FiX,
  FiSearch
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip
} from '@mui/material';
const ProfileSearchResults = ({ query, loading, error, onProfileClick }) => {
  const [categories, setCategories] = useState([]);
  const [searchLoading, setSearchLoading] = useState(true);
  const [searchError, setSearchError] = useState(null);
  const [middleSlideIndex, setMiddleSlideIndex] = useState(0);
  const [sortOption, setSortOption] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const swiperRef = useRef(null);
  const navigate = useNavigate();

  // Fetch profiles like UserProfileBar
  useEffect(() => {
    fetchProfilesByCategory();
  }, []);

  // Calculate middle index when categories change
  useEffect(() => {
    if (categories.length > 0) {
      const firstCategory = categories[0];
      const profiles = firstCategory.profiles || [];
      if (profiles.length > 0) {
        const middleIndex = Math.floor(profiles.length / 2);
        setMiddleSlideIndex(middleIndex);
      }
    }
  }, [categories]);

  // Force middle slide after loading
  useEffect(() => {
    if (categories.length > 0 && swiperRef.current) {
      setTimeout(() => {
        if (swiperRef.current && swiperRef.current.swiper) {
          swiperRef.current.swiper.slideTo(middleSlideIndex, 0);
        }
      }, 100);
    }
  }, [categories, middleSlideIndex]);

  // Fetch profiles function (SAME as UserProfileBar)
  const fetchProfilesByCategory = async () => {
    try {
      setSearchLoading(true);
      setSearchError(null);
      
      const apiUrl = `${URL}/api/profiles/category/`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter profiles based on search query if provided
      let filteredData = data;
      if (query && query.trim()) {
        filteredData = data.map(category => ({
          ...category,
          profiles: (category.profiles || []).filter(profile => {
            const searchLower = query.toLowerCase();
            return (
              (profile.first_name && profile.first_name.toLowerCase().includes(searchLower)) ||
              (profile.last_name && profile.last_name.toLowerCase().includes(searchLower)) ||
              (profile.username && profile.username.toLowerCase().includes(searchLower)) ||
              (profile.bio && profile.bio.toLowerCase().includes(searchLower)) ||
              (profile.title && profile.title.toLowerCase().includes(searchLower))
            );
          })
        })).filter(category => (category.profiles || []).length > 0);
      }
      
      setCategories(filteredData);
      
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Calculate middle index for profiles (SAME as UserProfileBar)
  const getMiddleIndex = (profiles) => {
    if (!profiles || profiles.length === 0) return 0;
    return Math.floor(profiles.length / 2);
  };

  // Swiper configuration with middle slide (SAME as UserProfileBar)
  const getSwiperConfig = (profiles) => ({
    modules: [Navigation, Pagination, EffectCoverflow],
    effect: 'coverflow',
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 'auto',
    initialSlide: getMiddleIndex(profiles),
    coverflowEffect: {
      rotate: 0,
      stretch: -40,
      depth: 80,
      modifier: 1.5,
      slideShadows: false,
    },
    pagination: { 
      clickable: true,
      dynamicBullets: true 
    },
    spaceBetween: 10,
    loopAdditionalSlides: 3,
    on: {
      init: function () {
        this.slideTo(getMiddleIndex(profiles), 0);
      },
    },
    breakpoints: {
      320: {
        slidesPerView: 'auto',
        spaceBetween: 5,
        coverflowEffect: {
          stretch: -20,
          depth: 40,
          modifier: 1.2,
        },
        navigation: false
      },
      480: {
        slidesPerView: 'auto',
        spaceBetween: 8,
        coverflowEffect: {
          stretch: -30,
          depth: 60,
          modifier: 1.3,
        },
        navigation: true
      },
      768: {
        slidesPerView: 'auto',
        spaceBetween: 10,
        coverflowEffect: {
          stretch: -40,
          depth: 80,
          modifier: 1.5,
        },
        navigation: true
      },
      1024: {
        slidesPerView: 'auto',
        spaceBetween: 12,
        coverflowEffect: {
          stretch: -50,
          depth: 100,
          modifier: 1.7,
        },
        navigation: true
      }
    }
  });

  const getInitials = (profile) => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    } else if (profile.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    } else if (profile.last_name) {
      return profile.last_name.charAt(0).toUpperCase();
    } else {
      return profile.username.substring(0, 2).toUpperCase();
    }
  };

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

  // RENDER AVATAR - SAME as UserProfileBar (using profile.image)
  const renderAvatar = (profile) => {
    if (profile.image && profile.image !== '/default-avatar.png' && !profile.image.includes('default-avatar')) {
      return (
        <img 
          src={profile.image} 
          alt={`Profile of ${profile.first_name || profile.username}`}
          className="profile-image-3d"
          onError={(e) => {
            e.target.style.display = 'none';
            const fallback = e.target.parentNode.querySelector('.profile-initials-3d.fallback');
            if (fallback) {
              fallback.style.display = 'flex';
            }
          }}
        />
      );
    }
    
    const initials = getInitials(profile);
    const backgroundColor = getAvatarColor(profile.first_name || profile.last_name || profile.username);
    
    return (
      <div 
        className="profile-initials-3d"
        style={{ backgroundColor }}
      >
        {initials}
      </div>
    );
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const decimal = rating % 1;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="star-3d full">
            ★
          </span>
        );
      } else if (i === fullStars && hasHalfStar) {
        const percentage = decimal * 100;
        stars.push(
          <span key={i} className="star-3d half" style={{'--fill-percentage': `${percentage}%`}}>
            ★
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="star-3d empty">
            ★
          </span>
        );
      }
    }

    return stars;
  };

  const handleSeeMore = (categoryId, categoryName) => {
    if (categoryId && categoryId !== 'undefined' && categoryId !== 'null') {
      window.location.href = `/profiles/category/${categoryId}`;
    } else {
      window.location.href = '/profiles';
    }
  };

  const handleProfileClick = (profileId, e) => {
    e.preventDefault();
    e.stopPropagation();
     if (!profileId) {
    console.error('No profile data');
    alert('Profile data is missing');
    return;
  }
  
    if (profileId) {
      if (onProfileClick) {
        onProfileClick(profileId);
      } else {
        window.location.href = `/profile/${profileId}`;
      }
    }
  };

  // Get all profiles for stats
  const getAllProfiles = () => {
    const allProfiles = [];
    categories.forEach(category => {
      if (category.profiles && Array.isArray(category.profiles)) {
        // Filter by selected category
        if (selectedCategory === 'all' || category.category_id === selectedCategory) {
          allProfiles.push(...category.profiles);
        }
      }
    });
    
    // Apply sorting
    let sortedProfiles = [...allProfiles];
    switch (sortOption) {
      case 'rating':
        sortedProfiles.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        break;
      case 'reviews':
        sortedProfiles.sort((a, b) => (b.feedback_count || 0) - (a.feedback_count || 0));
        break;
      case 'name':
        sortedProfiles.sort((a, b) => {
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
    }
    
    return sortedProfiles;
  };

  const clearFilters = () => {
    setSortOption('relevance');
    setSelectedCategory('all');
  };

  // Loading state
  if (searchLoading || loading) {
    return (
      <div className="user-profile-bar">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Searching profiles...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (searchError || error) {
    return (
      <div className="user-profile-bar">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Unable to load profiles</h3>
          <p className="error-message">{searchError || error}</p>
          <button 
            onClick={fetchProfilesByCategory} 
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No results state
  if (categories.length === 0) {
    return (
      <div className="user-profile-bar">
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No profiles found</h3>
          <p>
            {query 
              ? `No profiles match "${query}". Try different keywords.`
              : 'There are no profiles available at the moment.'
            }
          </p>
        </div>
      </div>
    );
  }

  // Filter categories based on selected category
  const filteredCategories = selectedCategory === 'all' 
    ? categories 
    : categories.filter(cat => cat.category_id === selectedCategory);

  return (
    <div className="user-profile-bar">
      {/* Search Header */}
      <div className="user-header">
        <div className="search-header">
          <div className="search-info">
          
            <p className="search-count">
              Found <span className="count-number">{getAllProfiles().length}</span> 
              profile{getAllProfiles().length !== 1 ? 's' : ''}
              {selectedCategory !== 'all' && categories.find(c => c.category_id === selectedCategory) && 
                ` in "${categories.find(c => c.category_id === selectedCategory).category_name}"`
              }
            </p>
          </div>
          
          {/* Filters */}
          <div className="search-filters">
<Box sx={{ 
  display: 'flex', 
  alignItems: 'center', 
  gap: 2, 
  mb: 2,
  p: 2,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 1
}}>
  {/* Bouton toggle pour catégories */}
  <Chip
    icon={<FiFilter />}
    label={showFilters ? 'Hide Categories' : 'Show Categories'}
    onClick={() => setShowFilters(!showFilters)}
    color={showFilters ? 'primary' : 'default'}
    variant={showFilters ? 'filled' : 'outlined'}
    sx={{ 
      height: 40,
      '& .MuiChip-icon': { fontSize: 16 }
    }}
  />

  {/* Sélecteur de tri Material-UI */}
  {/*
  <FormControl sx={{ minWidth: 180 }} size="small">

    {/*
    <Select
      labelId="sort-by-label"
      id="sort-by-select"
      value={sortOption}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FiBriefcase style={{ fontSize: 16 }} />
          Sort by
        </Box>
      }
      onChange={(e) => setSortOption(e.target.value)}
      sx={{
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }
      }}
    >
      <MenuItem value="relevance">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FiBriefcase style={{ fontSize: 14 }} />
          Relevance
        </Box>
      </MenuItem>
      <MenuItem value="rating">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FiStar style={{ fontSize: 14 }} />
          Highest Rating
        </Box>
      </MenuItem>
      <MenuItem value="reviews">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FiMessageSquare style={{ fontSize: 14 }} />
          Most Reviews
        </Box>
      </MenuItem>
      <MenuItem value="name">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FiUser style={{ fontSize: 14 }} />
          Name (A-Z)
        </Box>
      </MenuItem>
    </Select>
  </FormControl>
*/}

  {/* Bouton pour effacer les filtres */}
  {(sortOption !== 'relevance' || selectedCategory !== 'all') && (
    <Chip
      label="Clear Filters"
      onClick={clearFilters}
      color="default"
      variant="outlined"
      onDelete={clearFilters}
      sx={{ height: 40 }}
    />
  )}
</Box>

{/* Panneau des catégories avec Material-UI */}
{showFilters && (
  <Box 
    sx={{ 
      mt: 2, 
      p: 2, 
      bgcolor: 'background.paper', 
      borderRadius: 2,
      boxShadow: 1,
      animation: 'slideDown 0.3s ease'
    }}
  >
    <FormControl fullWidth size="small">
      <InputLabel 
        id="category-label"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <FiUser style={{ fontSize: 16 }} />
        Category
      </InputLabel>
      <Select
        labelId="category-label"
        id="category-select"
        value={selectedCategory}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FiUser style={{ fontSize: 16 }} />
            Category
          </Box>
        }
        onChange={(e) => setSelectedCategory(e.target.value)}
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }
        }}
      >
        <MenuItem value="all">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FiGrid style={{ fontSize: 14 }} />
            All Categories
          </Box>
        </MenuItem>
        {categories.map((category) => (
          <MenuItem key={category.category_id} value={category.category_id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FiBriefcase style={{ fontSize: 14 }} />
              {category.category_name}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>
)}
          </div>
        </div>
      </div>

      {/* Display categories */}
      {filteredCategories.map((category, categoryIndex) => {
        const categoryId = category.category_id || category.id;
        const categoryName = category.category_name || category.name;
        let categoryProfiles = category.profiles || [];
        
        // Apply sorting to category profiles
        if (sortOption !== 'relevance') {
          const profilesCopy = [...categoryProfiles];
          switch (sortOption) {
            case 'rating':
              profilesCopy.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
              break;
            case 'reviews':
              profilesCopy.sort((a, b) => (b.feedback_count || 0) - (a.feedback_count || 0));
              break;
            case 'name':
              profilesCopy.sort((a, b) => {
                const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
                const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
                return nameA.localeCompare(nameB);
              });
              break;
          }
          categoryProfiles = profilesCopy;
        }

        if (categoryProfiles.length === 0) return null;

        const middleIndex = getMiddleIndex(categoryProfiles);

        return (
          <section key={categoryId} className="category-section">
            <div className="category-header">
              <h2 className="category-title">
                <span className='category'>▶</span> {categoryName}
              </h2>
              <button 
                className="see-more-button"
                onClick={() => handleSeeMore(categoryId, categoryName)}
              >
                See All ({categoryProfiles.length})
              </button>
            </div>
            
            <div className="swiper-container">
              <Swiper 
                {...getSwiperConfig(categoryProfiles)}
                ref={categoryIndex === 0 ? swiperRef : null}
                className='swiper-user custom-pagination'
              >
                {categoryProfiles.map((profile, index) => (
                  <SwiperSlide key={profile.id}>
                    <article 
                      className="profile-card-3d"
                      onClick={(e) => handleProfileClick(profile.id, e)}
                      role="button"
                      tabIndex={0}
                    >
                      {profile.is_premium && (
                        <div className="premium-badge-3d">Premium</div>
                      )}
                      
                      <div className="profile-avatar-container-3d">
                        {renderAvatar(profile)}
                        {profile.image && profile.image !== '/default-avatar.png' && !profile.image.includes('default-avatar') && (
                          <div 
                            className="profile-initials-3d fallback"
                            style={{ 
                              backgroundColor: getAvatarColor(profile.first_name || profile.last_name || profile.username),
                              display: 'none'
                            }}
                          >
                            {getInitials(profile)}
                          </div>
                        )}
                      </div>
                      
                      <div className="profile-content-3d">
                        <h3 className="profile-name-3d">
                          {profile.first_name && profile.last_name 
                            ? `${profile.first_name} ${profile.last_name}`
                            : profile.username
                          }
                        </h3>
                        
                        {profile.title && (
                          <p className="profile-title-3d">
                            <FiBriefcase className="title-icon" />
                            {profile.title}
                          </p>
                        )}
                        
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
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default ProfileSearchResults;