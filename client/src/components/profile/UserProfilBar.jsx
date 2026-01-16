import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import '../../styles/userbar/user_profil_bar.css';
import URL from '../../hooks/useUrl';
import { 
  FiGlobe, 
  FiCompass, 
  FiEye, 
  FiPlusCircle,
  FiSearch
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
const UserProfileBar = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [middleSlideIndex, setMiddleSlideIndex] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true); // État pour contrôler l'affichage
  const swiperRef = useRef(null);
const navigate = useNavigate()
  // Vérifier si l'utilisateur a déjà vu le message
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenSpiderWelcome');
    if (hasSeenWelcome) {
      setShowWelcome(false);
    }
  }, []);

  // Timer pour masquer après 1 minute
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
        localStorage.setItem('hasSeenSpiderWelcome', 'true');
      }, 60000); // 60 secondes = 1 minute

      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  // Fonction pour fermer manuellement
  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenSpiderWelcome', 'true');
  };

  // Fonction pour les boutons
  const handleWeaveClick = () => {
    navigate('/create-post/')
  };

  const handleExploreClick = () => {
   navigate('/posts/')
  };

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

  const fetchProfilesByCategory = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      setCategories(data);
      
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate middle index for profiles
  const getMiddleIndex = (profiles) => {
    if (!profiles || profiles.length === 0) return 0;
    return Math.floor(profiles.length / 2);
  };

  // Swiper configuration with middle slide
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
    if (profileId) {
      window.location.href = `/profile/${profileId}`;
    }
  };

  if (loading) {
    return (
      <div className="user-profile-bar">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading professionals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-bar">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Unable to load profiles</h3>
          <p className="error-message">{error}</p>
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

  if (categories.length === 0) {
    return (
      <div className="user-profile-bar">
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No Account found</h3>
          <p>There are no Account available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-bar">
      {/* Header */}
      <div className="user-header">
        {showWelcome && (
          <div className="spider-tease">
            {/* Bouton de fermeture */}
            <button 
              className="close-welcome-btn"
              onClick={handleCloseWelcome}
              aria-label="Close welcome message"
            >
              ×
            </button>
            
            {/* Animated web background */}
            <div className="teasing-web"></div>
            
            <div className="tease-container">
              <h1 className="tease-title">
                Welcome to <span className="spider-pulse">Spider</span>
              </h1>
              
              <div className="tease-subtitle">
                <span className="tease-line">Weave your thread,</span>
                <span className="tease-highlight">see what's ahead</span>
              </div>
              
              <div className="tease-actions">
                <button 
                  className="tease-btn weave"
                  onClick={handleWeaveClick}
                >
                  <FiPlusCircle className="btn-icon" />
                  Start Weaving
                </button>
                <button 
                  className="tease-btn explore"
                  onClick={handleExploreClick}
                >
                  <FiSearch className="btn-icon" />
                  Peek Inside
                </button>
              </div>
              
              <div className="web-teasers">
                <div className="teaser-item" data-delay="0">
                  <div className="teaser-icon">
                    <FiGlobe />
                  </div>
                  <span className="teaser-text">What's hiding in your web?</span>
                </div>
                <div className="teaser-item" data-delay="1">
                  <div className="teaser-icon">
                    <FiCompass />
                  </div>
                  <span className="teaser-text">Cast your thread</span>
                </div>
                <div className="teaser-item" data-delay="2">
                  <div className="teaser-icon">
                    <FiEye />
                  </div>
                  <span className="teaser-text">See what catches</span>
                </div>
              </div>
              
              {/* Timer visuel */}
              <div className="welcome-timer">
                <div className="timer-bar"></div>
                <span className="timer-text">Disappears in 1:00</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {categories.map((category, categoryIndex) => {
        const categoryId = category.category_id || category.id;
        const categoryName = category.category_name || category.name;
        const profiles = category.profiles || [];
        
        if (profiles.length === 0) return null;

        const middleIndex = getMiddleIndex(profiles);

        return (
          <section key={categoryId} className="category-section">
            <div className="category-header">
              <h2 className="category-title"> <span className='category'>▶</span> {categoryName}</h2>
              <button 
                className="see-more-button"
                onClick={() => handleSeeMore(categoryId, categoryName)}
              >
                See All ({profiles.length})
              </button>
            </div>
            
            <div className="swiper-container">
              <Swiper 
                {...getSwiperConfig(profiles)}
                ref={categoryIndex === 0 ? swiperRef : null}
                className='swiper-user custom-pagination'
              >
                {profiles.map((profile, index) => (
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

export default UserProfileBar;