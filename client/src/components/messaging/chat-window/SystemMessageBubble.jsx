// components/chat-window/SystemMessageBubble.js
import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import {
  PersonRemove as PersonRemoveIcon,
  PhotoCamera as PhotoCameraIcon,
  PersonAdd as PersonAddIcon,
  GroupRemove as GroupRemoveIcon,
  AdminPanelSettings as AdminIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Create as CreateIcon,
} from '@mui/icons-material';

const SystemMessageBubble = ({ message }) => {
  // Détecter le type de message système
  const getSystemMessageType = () => {
    if (message?.system_message_type) {
      return message.system_message_type;
    }
    
    const content = message?.content?.toLowerCase() || '';
    
    if (content.includes('removed') || content.includes('supprimé')) {
      return 'user_removed';
    } else if (content.includes('photo') || content.includes('image')) {
      return 'group_photo_changed';
    } else if (content.includes('created the group')) {
      return 'group_created';
    } else if (content.includes('joined')) {
      return 'user_joined';
    } else if (content.includes('left')) {
      return 'user_left';
    } else if (content.includes('invited') || content.includes('added')) {
      return 'user_added';
    } else if (content.includes('changed the group name')) {
      return 'group_name_changed';
    } else if (content.includes('promoted')) {
      return 'admin_promoted';
    } else if (content.includes('demoted')) {
      return 'admin_demoted';
    } else if (content.includes('transferred')) {
      return 'ownership_transferred';
    }
    
    return 'info';
  };

  // Obtenir l'icône
  const getSystemMessageIcon = () => {
    const type = getSystemMessageType();
    
    switch(type) {
      case 'user_removed':
        return <PersonRemoveIcon fontSize="small" />;
      case 'group_photo_changed':
        return <PhotoCameraIcon fontSize="small" />;
      case 'group_created':
        return <GroupIcon fontSize="small" />;
      case 'user_joined':
        return <PersonAddIcon fontSize="small" />;
      case 'user_left':
        return <GroupRemoveIcon fontSize="small" />;
      case 'user_added':
        return <PersonAddIcon fontSize="small" />;
      case 'group_name_changed':
        return <CreateIcon fontSize="small" />;
      case 'admin_promoted':
        return <AdminIcon fontSize="small" />;
      case 'admin_demoted':
        return <SettingsIcon fontSize="small" />;
      case 'ownership_transferred':
        return <CheckCircleIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  // Obtenir la couleur
  const getSystemMessageColor = () => {
    const type = getSystemMessageType();
    
    switch(type) {
      case 'user_removed':
        return 'error';
      case 'group_photo_changed':
      case 'group_name_changed':
        return 'info';
      case 'user_joined':
      case 'user_added':
      case 'group_created':
        return 'success';
      case 'user_left':
        return 'warning';
      case 'ownership_transferred':
      case 'admin_promoted':
      case 'admin_demoted':
        return 'primary';
      default:
        return 'default';
    }
  };

  const messageType = getSystemMessageType();
  const IconComponent = getSystemMessageIcon();
  const color = getSystemMessageColor();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5, px: 2 }}>
      <Chip
        label={message?.content}
        icon={IconComponent}
        color={color}
        size="small"
        variant="outlined"
        sx={{
          maxWidth: '85%',
          bgcolor: 'background.paper',
          borderColor: 'divider',
          fontSize: '0.75rem',
          py: 0.75,
          px: 1.5,
          '& .MuiChip-icon': { 
            color: `${color}.main`,
            fontSize: '1rem'
          },
          '& .MuiChip-label': {
            px: 0.5,
            fontSize: '0.75rem',
            fontWeight: 400,
          },
        }}
      />
      <Typography
        variant="caption"
        sx={{
          color: 'text.disabled',
          fontSize: '0.7rem',
          ml: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {message?.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : ''}
      </Typography>
    </Box>
  );
};

export default SystemMessageBubble;