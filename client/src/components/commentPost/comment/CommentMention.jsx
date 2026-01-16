import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import axios from 'axios';
import URL from '../../hooks/useUrl.js';

const CommentMentions = ({ commentContent, children }) => {
  const [userProfiles, setUserProfiles] = useState({});
  
  // 🔥 Récupérer les profils
  const fetchProfileIdByUsername = async (username) => {
    if (!username || userProfiles[username]) return userProfiles[username];
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${URL}/comment/users/profile/by-username/${username}/`, {
        headers: { Authorization: token ? `Token ${token}` : '' }
      });
      
      if (response.data?.id) {
        const profileInfo = {
          id: response.data.id,
          username: response.data.username,
          full_name: response.data.full_name,
          profile_picture: response.data.profile_picture
        };
        
        setUserProfiles(prev => ({ ...prev, [username]: profileInfo }));
        return profileInfo;
      }
    } catch (error) {
      console.error(`Error fetching profile for ${username}:`, error);
    }
    
    return null;
  };

  // 🔥 Fonction pour obtenir l'URL du profil
  const getProfileUrl = useMemo(() => {
    return (userInfo) => {
      if (!userInfo) return '/profile/0';
      
      if (userInfo?.profile?.id) {
        return `/profile/${userInfo.profile.id}`;
      } else if (userInfo?.id) {
        return `/profile/${userInfo.id}`;
      } else if (typeof userInfo === 'string') {
        const cachedProfile = userProfiles[userInfo];
        if (cachedProfile?.id) {
          return `/profile/${cachedProfile.id}`;
        }
      }
      
      return '/profile/0';
    };
  }, [userProfiles]);

  // 🔥 Fonction pour obtenir le nom d'affichage
  const getDisplayName = (userInfo) => {
    if (!userInfo) return 'Anonymous';
    if (typeof userInfo === 'object') return userInfo.username || userInfo.full_name || 'User';
    if (typeof userInfo === 'string') return userInfo;
    return 'User';
  };

  // 🔥 Rendu du contenu avec mentions
  const renderContentWithMentions = useMemo(() => {
    if (!commentContent) return '';
    
    return commentContent.split(/(@[a-zA-Z0-9_.-]+)/g).map((part, idx) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);
        const profileInfo = userProfiles[username];
        const profileUrl = getProfileUrl(profileInfo || username);
        
        return (
          <Link
            key={idx}
            to={profileUrl}
            className="comment-mention-link"
            title={`View ${username}'s profile`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = profileUrl;
            }}
          >
            <FaUser className="mention-icon" />
            {part}
          </Link>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  }, [commentContent, userProfiles, getProfileUrl]);

  // 🔥 Détecter et charger les mentions
  useEffect(() => {
    if (!commentContent) return;
    
    const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
    const usernames = new Set();
    let match;
    
    while ((match = mentionRegex.exec(commentContent)) !== null) {
      const username = match[1];
      if (!userProfiles[username]) {
        usernames.add(username);
      }
    }
    
    // Charger les profils manquants
    usernames.forEach(username => {
      fetchProfileIdByUsername(username);
    });
  }, [commentContent]);

  return children({
    getProfileUrl,
    getDisplayName,
    renderContentWithMentions,
    userProfiles
  });
};

export default CommentMentions;