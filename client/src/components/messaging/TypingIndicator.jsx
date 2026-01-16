// src/components/messaging/TypingIndicator.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, CircularProgress } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { userAPI } from '../../hooks/messaging/messagingApi';

const TypingIndicator = ({ userIds, conversationId }) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTypingUsers = async () => {
      if (userIds.length === 0) {
        setTypingUsers([]);
        setLoading(false);
        return;
      }

      try {
        // Pour un vrai projet, vous auriez un endpoint pour récupérer plusieurs utilisateurs
        // Ici, on simule avec les données disponibles
        const typingUserData = userIds.map(id => ({
          id,
          username: `User ${id}`, // Vous devriez récupérer le vrai username
        }));
        setTypingUsers(typingUserData);
      } catch (error) {
        console.error('Error fetching typing users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTypingUsers();
  }, [userIds]);

  if (loading || typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} est en train d'écrire...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} et ${typingUsers[1].username} sont en train d'écrire...`;
    } else {
      return `${typingUsers.length} personnes sont en train d'écrire...`;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 2,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      {/* Avatars des utilisateurs qui écrivent */}
      <Box sx={{ display: 'flex' }}>
        {typingUsers.slice(0, 3).map((typingUser, index) => (
          <Avatar
            key={typingUser.id}
            sx={{
              width: 24,
              height: 24,
              marginLeft: index > 0 ? '-8px' : 0,
              border: '2px solid white',
              zIndex: 3 - index,
            }}
          >
            {typingUser.username?.[0]?.toUpperCase() || '?'}
          </Avatar>
        ))}
      </Box>
      
      {/* Bulle avec indicateur */}
      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: '18px',
          p: '8px 16px',
          maxWidth: '300px',
          boxShadow: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Box
            sx={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'text.secondary',
              animation: 'bounce 1.4s infinite',
            }}
          />
          <Box
            sx={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'text.secondary',
              animation: 'bounce 1.4s infinite',
              animationDelay: '0.2s',
            }}
          />
          <Box
            sx={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'text.secondary',
              animation: 'bounce 1.4s infinite',
              animationDelay: '0.4s',
            }}
          />
        </Box>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: 'block',
            mt: 0.5,
            fontSize: '0.7rem',
            fontStyle: 'italic',
          }}
        >
          {getTypingText()}
        </Typography>
      </Box>

      {/* Animation CSS */}
      <style>
        {`
          @keyframes bounce {
            0%, 60%, 100% {
              transform: translateY(0);
            }
            30% {
              transform: translateY(-4px);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default TypingIndicator;