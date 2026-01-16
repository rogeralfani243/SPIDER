import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/profil_detail.css';
import URL from '../../hooks/useUrl';
import ErrorPopup from './../profil_details/ErrorPopUp';
import ProfileHeader from './../profil_details/ProfileHeader';
import ProfileAvatar from './../profil_details/ProfileAvatar';
import ProfileInfo from './../profil_details/ProfileInfo';
import FeedbacksSection from './../feedback/FeedbacksSection';
import LoadingState from './../profil_details/LoadingState';
import ErrorState from './../profil_details/ErrorState';
import DashboardMain from './../dashboard_main';
import ProfilePosts from './../profil_details/ProfilePosts';
import { useLocation } from 'react-router-dom';
import BlockedProfileView from '../profil_details/BlockedProfileView.jsx'; // Créez ce composant

const ProfileDetail = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTop100, setIsTop100] = useState(false);
  const [top100Rank, setTop100Rank] = useState(null);
  const [mapCoordinates, setMapCoordinates] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [postsError, setPostsError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: '', type: 'error' });
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockData, setBlockData] = useState(null);
  const [profileAccessible, setProfileAccessible] = useState(true);
  const location = useLocation();

  // Fonction pour vérifier si le profil est accessible
  const checkProfileAccess = useCallback(async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Si l'utilisateur n'est pas connecté, l'accès est toujours autorisé
        setProfileAccessible(true);
        return;
      }

      // Vérifier le statut de blocage depuis le backend
      const response = await fetch(`${URL}/api/profile/${profileId}/check-access/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const accessData = await response.json();
        console.log('🔒 [DEBUG] Access check result:', accessData);
        
        if (!accessData.has_access) {
          setIsBlocked(true);
          setBlockData({
            user_blocked_profile: accessData.user_has_blocked,
            profile_blocked_user: accessData.is_blocked_by_user,
            block_type: accessData.block_type || 'both',
            message: accessData.message
          });
          setProfileAccessible(false);
        } else {
          setProfileAccessible(true);
          setIsBlocked(false);
        }
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error checking profile access:', error);
      // En cas d'erreur, on suppose que l'accès est autorisé
      setProfileAccessible(true);
    }
  }, [profileId]);

  // ✅ DEBUG COMPLET: Fonction pour charger les feedbacks
  const fetchFeedbacks = useCallback(async () => {
    try {
      console.log('🔄 [DEBUG] Fetching feedbacks for profile:', profileId);
      
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      
      const response = await fetch(`${URL}/feedback/list/${profileId}/`, {
        method: 'GET',
        headers: headers,
      });
      
      if (response.ok) {
        const feedbacksData = await response.json();
        console.log('✅ [DEBUG] Feedbacks loaded successfully:', {
          count: feedbacksData.length,
          data: feedbacksData
        });
        setFeedbacks(feedbacksData);
      } else {
        console.error('❌ [DEBUG] Failed to load feedbacks, status:', response.status);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error loading feedbacks:', error);
    }
  }, [profileId]);

  // ✅ CORRECTION: Fonction pour recharger les feedbacks après ajout
  const handleFeedbackAdded = useCallback(async (newFeedback) => {
    console.log('🔄 [DEBUG] handleFeedbackAdded called with:', newFeedback);
    
    setFeedbacks(prev => [newFeedback, ...prev]);
    
    setTimeout(async () => {
      console.log('🔄 [DEBUG] Refreshing feedbacks from API after delay');
      await fetchFeedbacks();
    }, 1000);
    
  }, [fetchFeedbacks]);

  // Fonctions pour les mises à jour et suppressions
  const handleFeedbackUpdate = useCallback((updatedFeedback) => {
    console.log('🔄 [DEBUG] handleFeedbackUpdate called with:', updatedFeedback);
    setFeedbacks(prev => 
      prev.map(fb => 
        fb.id === updatedFeedback.id ? { ...fb, ...updatedFeedback } : fb
      )
    );
    showSuccess('Review updated successfully');
  }, []);

  const handleFeedbackDelete = useCallback(async (feedbackId) => {
    try {
      console.log('🗑️ [DEBUG] Deleting feedback:', feedbackId);
      const token = localStorage.getItem('token');
      const response = await fetch(`${URL}/feedback/${feedbackId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
          'X-CSRFToken': getCsrfToken(),
        },
      });

      if (response.ok) {
        console.log('✅ [DEBUG] Feedback deleted successfully');
        await fetchFeedbacks();
        showSuccess('Review deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('❌ [DEBUG] Delete failed:', errorData);
        throw new Error(errorData.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error deleting feedback:', error);
      showError(error.message || 'Error deleting review');
      throw error;
    }
  }, [fetchFeedbacks]);

  // Fonction pour obtenir le token CSRF
  const getCsrfToken = () => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return cookieValue || '';
  };

  // Fonction pour charger les posts
  const fetchUserPosts = useCallback(async (userId) => {
    try {
      setPostsLoading(true);
      console.log('🔄 [DEBUG] Fetching posts for user_id:', userId);
      
      const response = await fetch(`${URL}/post/posts/user/${userId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [DEBUG] Posts loaded:', {
          user: data.user_info.username,
          userId: data.user_info.id,
          postsCount: data.posts.length
        });
        setPosts(data.posts);
      } else {
        const errorText = await response.text();
        console.error('❌ [DEBUG] Failed to load posts:', errorText);
        setPostsError('Failed to load posts');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error loading posts:', error);
      setPostsError(error.message);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  // Fonction pour charger le profil
const fetchProfileDetail = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    setIsBlocked(false);
    // NE PAS modifier profileAccessible ici initialement
    
    console.log('🔄 [DEBUG] Loading profile details for:', profileId);
    
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    
    const response = await fetch(`${URL}/api/profile/${profileId}/`, {
      method: 'GET',
      headers: headers,
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.limited_info) {
          setProfile(errorData);
          setIsBlocked(true);
          setBlockData({
            user_blocked_profile: errorData.user_blocked_profile,
            profile_blocked_user: errorData.profile_blocked_user,
            block_type: errorData.block_type || 'both',
            message: errorData.message || 'Access denied due to blocking restrictions'
          });
          setProfileAccessible(false); // Modification ici
          setLoading(false);
          return;
        }
        throw new Error(errorData.message || 'Access denied');
      }
      // ... autres erreurs
    }

    const data = await response.json();
    console.log('✅ [DEBUG] Profile data received:', data);
    
    if (data.block_status && data.block_status.is_blocked) {
      setIsBlocked(true);
      setBlockData(data.block_status);
      setProfileAccessible(data.block_status.can_interact); // Modification ici
      
      if (data.block_status.block_type === 'both' || data.block_status.block_type === 'profile') {
        setProfileAccessible(false); // Modification ici
      }
    } else {
      setProfileAccessible(true); // Modification ici
    }
    
    setProfile(data);
    
    // Charger les données seulement si accessible
    if (data.block_status?.can_interact !== false) {
      await fetchFeedbacks();
      if (data.user_id) {
        await fetchUserPosts(data.user_id);
      }
    }
    
    checkTop100Status(data);
    
  } catch (err) {
    console.error('❌ [DEBUG] Error fetching profile:', err);
    setError(err.message);
    showError(err.message);
  } finally {
    setLoading(false);
  }
}, [profileId, fetchFeedbacks, fetchUserPosts]); // RETIREZ profileAccessible !

  useEffect(() => {
    if (!location.hash) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(
        location.hash.replace("#", "")
      );
      el?.scrollIntoView({ behavior: "smooth" });
    }, 300);

    return () => clearTimeout(timer);
  }, [location]);

  // Récupération de l'utilisateur connecté
  useEffect(() => {
    const getCurrentUser = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        console.log('🔍 [DEBUG] Auth check:', {
          hasToken: !!token,
          hasUserData: !!userData,
          profileId: profileId
        });

        if (userData) {
          const user = JSON.parse(userData);
          console.log('✅ [DEBUG] Current user found:', user);
          setCurrentUser(user);
        } else {
          console.log('❌ [DEBUG] No user data found');
        }
      } catch (error) {
        console.error('❌ [DEBUG] Error getting current user:', error);
      }
    };

    getCurrentUser();
  }, [profileId]);

  // Effet pour charger les données du profil
  useEffect(() => {
    console.log('🎯 [DEBUG] ProfileDetail mounted, profileId:', profileId);
    fetchProfileDetail();
  }, [fetchProfileDetail, profileId]);

  // Debug quand les feedbacks changent
  useEffect(() => {
    console.log('📊 [DEBUG] Feedbacks state updated:', {
      profileId: profileId,
      feedbacksCount: feedbacks.length,
      profileAccessible: profileAccessible
    });
  }, [feedbacks, profileId, profileAccessible]);

  // Fonctions pour les popups
  const showError = (message) => {
    console.log('❌ [DEBUG] Showing error:', message);
    setPopup({ show: true, message, type: 'error' });
  };

  const showSuccess = (message) => {
    console.log('✅ [DEBUG] Showing success:', message);
    setPopup({ show: true, message, type: 'success' });
  };

  const closePopup = () => {
    setPopup({ show: false, message: '', type: 'error' });
  };

  const handleProfileUpdate = (updateData) => {
    setProfile(prev => ({
      ...prev,
      followers_count: updateData.followers_count,
      following_count: updateData.following_count
    }));
  };

  const checkTop100Status = async (profileData) => {
    try {
      const response = await fetch('/api/top-profiles/');
      if (response.ok) {
        const topProfiles = await response.json();
        const rank = topProfiles.findIndex(p => p.id === profileData.id) + 1;
        if (rank > 0 && rank <= 100) {
          setIsTop100(true);
          setTop100Rank(rank);
        }
      }
    } catch (err) {
      console.error('Error checking top 100 status:', err);
    }
  };

  // Fonction pour gérer l'unblock
  const handleUnblock = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('You must be logged in to unblock');
        return;
      }

      const response = await fetch(`${URL}/api/blocks/unblock/${profile.user_id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
      });

      if (response.ok) {
        showSuccess('User unblocked successfully');
        // Recharger le profil
        setTimeout(() => {
          fetchProfileDetail();
        }, 1000);
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Failed to unblock user');
      }
    } catch (error) {
      showError('Error unblocking user');
    }
  };

  // États de chargement et d'erreur
  if (loading) {
    return <LoadingState />;
  }

  if (error && !isBlocked) {
    return <ErrorState error={error} onRetry={fetchProfileDetail} navigate={navigate} />;
  }

  // Vue pour profil bloqué
  if (isBlocked && !profileAccessible) {
    return (
      <div className="profile-detail-page">
        {/* Popup pour les erreurs et succès */}
        {popup.show && (
          <ErrorPopup 
            message={popup.message} 
            type={popup.type}
            onClose={closePopup} 
          />
        )}

        <ProfileHeader navigate={navigate} />
        
        {/* Vue bloquée personnalisée */}
        <BlockedProfileView 
          profile={profile}
          blockData={blockData}
          currentUser={currentUser}
          onUnblock={handleUnblock}
          onNavigateHome={() => navigate('/')}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <ErrorState 
        error="Profile not found" 
        onRetry={fetchProfileDetail} 
        navigate={navigate} 
      />
    );
  }

  console.log('🔍 [DEBUG] ProfileDetail - Final render state:', {
    currentUserId: currentUser?.id,
    profileId: profileId,
    feedbacksCount: feedbacks.length,
    profileUserId: profile?.user_id,
    profileUsername: profile?.username,
    isBlocked: isBlocked,
    profileAccessible: profileAccessible
  });

  return (
    <div className="profile-detail-page">
      {/* Popup pour les erreurs et succès */}
      {popup.show && (
        <ErrorPopup 
          message={popup.message} 
          type={popup.type}
          onClose={closePopup} 
        />
      )}

      <ProfileHeader navigate={navigate} />

      <div className="profile-main-section">
        <ProfileAvatar 
          profile={profile} 
          isTop100={isTop100} 
          top100Rank={top100Rank} 
        />
        
        <ProfileInfo 
          profile={profile}
          mapCoordinates={mapCoordinates}
          mapLoading={mapLoading}
          mapError={mapError}
          onRetryGeocoding={() => {}}
          currentUserId={currentUser?.id}
          isBlocked={isBlocked}
          blockData={blockData}
          onProfileUpdate={handleProfileUpdate} 
        />
      </div>

      {profileAccessible && (
        <>
          <FeedbacksSection 
            feedbacks={feedbacks}
            profileId={profileId}
            currentUserId={currentUser?.id}
            onFeedbackAdded={handleFeedbackAdded}
            onFeedbackUpdate={handleFeedbackUpdate}
            onFeedbackDelete={handleFeedbackDelete}
            showError={showError}
            showSuccess={showSuccess}
            isBlocked={isBlocked}
          /> 
          
          <div id="profilePost">
            <ProfilePosts 
              profileId={profileId} 
              userId={profile?.user_id} 
              currentUser={currentUser?.id}
              isBlocked={isBlocked}
            />
          </div>
        </>
      )}
      
      {/* Afficher un message si le profil est partiellement bloqué */}
      {isBlocked && profileAccessible && (
        <div className="blocked-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-text">
            <h3>Limited Access</h3>
            <p>Some features may be restricted due to blocking settings.</p>
            {blockData?.block_type === 'user' && (
              <p>This is a user-level block. Profile viewing is allowed.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDetail;