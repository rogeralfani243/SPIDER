// ProfileSocialStats.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/profiles/profile_social.css';
import URL from '../../hooks/useUrl';
import FollowButton from './FollowButton.jsx';
import LogoutButton from './LogoutButton.jsx';
import SocialStats from './SocialStats';
import UserListPopup from './UserListPopup.jsx';
import { Button, IconButton, Tooltip, Box, CircularProgress } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import { conversationAPI } from '../../hooks/messaging/messagingApi';
import { useAuth } from '../../hooks/useAuth'; // Si vous avez un hook d'auth
import ReportButton from '../reports/ReportButton';
import BlockButton from '../blockage/blockButton';
const ProfileSocialStats = ({ profile, currentUserId, onFollowUpdate, handleClickProfile }) => {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowersPopup, setShowFollowersPopup] = useState(false);
  const [showFollowingPopup, setShowFollowingPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messagingLoading, setMessagingLoading] = useState(false);
  
  // États locaux pour les compteurs
  const [localFollowersCount, setLocalFollowersCount] = useState(profile?.followers_count || 0);
  const [localFollowingCount, setLocalFollowingCount] = useState(profile?.following_count || 0);
  
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // Si vous utilisez useAuth

  // Mettre à jour les compteurs locaux quand le profil change
  useEffect(() => {
    if (profile) {
      setLocalFollowersCount(profile.followers_count || 0);
      setLocalFollowingCount(profile.following_count || 0);
    }
  }, [profile]);

  // Check follow status on component mount
  useEffect(() => {
    if (profile?.id && currentUserId) {
      console.log('🔄 Checking follow status...');
      checkFollowStatus();
      fetchFollowers();
      fetchFollowing();
    }
  }, [profile?.id, currentUserId]);

  const checkFollowStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found');
        return;
      }

      const response = await fetch(`${URL}/api/profile/${profile.id}/follow-status/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Follow status:', data);
        setIsFollowing(data.is_following);
        
        // Mettre à jour les compteurs depuis l'API
        if (data.followers_count !== undefined) {
          setLocalFollowersCount(data.followers_count);
        }
        if (data.following_count !== undefined) {
          setLocalFollowingCount(data.following_count);
        }
      } else {
        console.error('❌ Failed to check follow status');
      }
    } catch (error) {
      console.error('❌ Error checking follow status:', error);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await fetch(`${URL}/api/profile/${profile.id}/followers/`);
      if (response.ok) {
        const data = await response.json();
        setFollowers(data.followers || []);
        setLocalFollowersCount(data.followers?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const response = await fetch(`${URL}/api/profile/${profile.id}/following/`);
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following || []);
        setLocalFollowingCount(data.following?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const handleFollowToggle = async () => {
    console.log('🎯 Follow toggle clicked');
    
    if (!currentUserId) {
      console.log('❌ No current user ID, redirecting to login');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${URL}/api/profile/${profile.id}/follow/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Follow toggle success:', data);
        setIsFollowing(data.is_following);
        
        // Mise à jour immédiate des compteurs
        if (data.followers_count !== undefined) {
          setLocalFollowersCount(data.followers_count);
        }
        if (data.following_count !== undefined) {
          setLocalFollowingCount(data.following_count);
        }
        
        // Notifier le parent du changement
        if (onFollowUpdate) {
          onFollowUpdate(data);
        }
        
        // Rafraîchir les listes locales
        fetchFollowers();
        fetchFollowing();
        
      } else {
        console.error('❌ Follow toggle failed');
      }
    } catch (error) {
      console.error('❌ Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  // NOUVELLE VERSION AMÉLIORÉE
  const handleMessageClick = async () => {
    console.log('💬 Message button clicked for user ID:', profile?.user_id);
    
    // Vérifier l'authentification (utilisez votre méthode préférée)
    if (!isAuthenticated) {
      // Ou vérifier localStorage token
      // const token = localStorage.getItem('token');
      // if (!token) {
      navigate('/login', { state: { from: `/profile/${profile?.id}` } });
      return;
    }
    
    // Empêcher de s'envoyer un message à soi-même
    if (currentUserId === profile?.user_id) {
      console.log('❌ Cannot message yourself');
      alert("You cannot message yourself.");
      return;
    }
    
    if (!profile?.user_id) {
      console.error('❌ No user ID available for messaging');
      alert("User information is not available.");
      return;
    }
    
    setMessagingLoading(true);
    
    try {
      console.log(`🔄 Getting or creating conversation with user: ${profile.user_id}`);
      
      // Utiliser l'API de conversation
      const response = await conversationAPI.getOrCreateConversationWithUser(profile.user_id);
      
      console.log('✅ Conversation API response:', response.data);
      
      // Vérifier la structure de la réponse
      let conversationId;
      
      if (response.data?.id) {
        conversationId = response.data.id;
      } else if (response.data?.conversation_id) {
        conversationId = response.data.conversation_id;
      } else if (response.data?.conversation?.id) {
        conversationId = response.data.conversation.id;
      }
      
      if (conversationId) {
        // Option 1: Rediriger vers la page de messagerie avec l'ID de conversation
        navigate(`/message?conversation_id=${conversationId}`);
        
        // Option 2: Si vous voulez passer plus de données
        // navigate(`/message`, {
        //   state: {
        //     conversationId: conversationId,
        //     targetUserId: profile.user_id,
        //     targetUserName: profile.username || profile.name
        //   }
        // });
      } else {
        console.warn('⚠️ No conversation ID found in response, using fallback');
        // Fallback : rediriger avec user_id
        navigate(`/message?user_id=${profile.user_id}`);
      }
      
    } catch (error) {
      console.error('❌ Error in handleMessageClick:', error);
      
      // Gestion d'erreurs spécifiques
      let errorMessage = 'Failed to start conversation. Please try again.';
      
      if (error.response?.status === 404) {
        errorMessage = 'User not found or cannot be messaged.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to message this user.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.detail || 
                      error.response?.data?.error || 
                      'Cannot create conversation.';
      }
      
      alert(errorMessage);
      
      // Fallback : rediriger quand même vers la messagerie
      navigate(`/message?user_id=${profile.user_id}`);
      
    } finally {
      setMessagingLoading(false);
    }
  };

  // Version alternative avec fetch direct (si conversationAPI ne fonctionne pas)
  const handleMessageClickAlternative = async () => {
    if (!currentUserId) {
      navigate('/login');
      return;
    }
    
    if (currentUserId === profile?.user_id) {
      alert("You cannot message yourself.");
      return;
    }
    
    setMessagingLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Essayer de récupérer une conversation existante
      const getResponse = await fetch(
        `${URL}/msg/conversations/with-user/?user_id=${profile.user_id}`, 
        {
          headers: {
            'Authorization': `Token ${token}`,
          }
        }
      );
      
      if (getResponse.ok) {
        const conversation = await getResponse.json();
        navigate(`/message?conversation_id=${conversation.id || conversation.conversation_id}`);
      } else {
        // Créer une nouvelle conversation
        const createResponse = await fetch(`${URL}/msg/conversations/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            participant_ids: [profile.user_id]
          })
        });
        
        if (createResponse.ok) {
          const newConversation = await createResponse.json();
          navigate(`/message?conversation_id=${newConversation.id}`);
        } else {
          throw new Error('Failed to create conversation');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to start conversation. Please try again.');
      navigate(`/message?user_id=${profile.user_id}`);
    } finally {
      setMessagingLoading(false);
    }
  };

  const shouldShowFollowButton = currentUserId && profile?.user_id && currentUserId !== profile.user_id;
  const shouldShowMessageButton = currentUserId && profile?.user_id && currentUserId !== profile.user_id;

  return (
    <div className="profile-social-stats">
      {/* Boutons d'action */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {/* Follow/Unfollow Button */}
        {shouldShowFollowButton && (
          <FollowButton
            isFollowing={isFollowing}
            loading={loading}
            onFollowToggle={handleFollowToggle}
            
          />
        )}

        {/* Message Button */}
        {shouldShowMessageButton && (
          <Tooltip title="Send message">
            <IconButton
              color="primary"
              onClick={handleMessageClick}
              disabled={messagingLoading || !profile?.user_id}
              sx={{
                border: '1px solid',
                borderColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                },
                '&:disabled': {
                  opacity: 0.5,
                }
              }}
            >
              {messagingLoading ? (
                <CircularProgress size={24} />
              ) : (
                <MessageIcon />
              )}
            </IconButton>
          </Tooltip>
        )}
     <ReportButton
            contentType="profile"
            contentId={profile?.id}
            contentAuthorId={profile?.user?.id}
            contentObject={profile}
            buttonVariant="text"
            showIcon={true}
            showText={true}
            className="feedback-report-button"
    
          >
  
          </ReportButton>  
        {/* Logout Button for current user */}
        {currentUserId && profile?.user_id === currentUserId && (
          <LogoutButton />
        )}
          <BlockButton 
                targetUser={profile}
                onBlockChange={(isBlocked) => {
                    console.log(`Utilisateur ${isBlocked ? 'bloqué' : 'débloqué'}`);
                }}
            />
      </Box>

      {/* Social Stats */}
      <SocialStats
        followersCount={localFollowersCount}
        followingCount={localFollowingCount}
        onShowFollowers={() => setShowFollowersPopup(true)}
        onShowFollowing={() => setShowFollowingPopup(true)}
      />

      {/* Popups */}
      {showFollowersPopup && (
        <UserListPopup
          users={followers}
          title="Followers"
          onClose={() => setShowFollowersPopup(false)}
          handleClickProfile={handleClickProfile}
        />
      )}

      {showFollowingPopup && (
        <UserListPopup
          users={following}
          title="Following"
          onClose={() => setShowFollowingPopup(false)}
          handleClickProfile={handleClickProfile}
        />
      )}
    </div>
  );
};

export default ProfileSocialStats;