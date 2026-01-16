// src/components/messaging/MessageBubble.jsx
import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MessageBubble = ({ message, isOwn, onMenuOpen }) => {
  const isImage = message.image;
  const isFile = message.file;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      {!isOwn && (
        <Avatar
          src={message.sender?.profile_picture}
          sx={{ width: 32, height: 32, mr: 1 }}
        >
          {message.sender?.username?.[0]?.toUpperCase()}
        </Avatar>
      )}
      
      <Box sx={{ maxWidth: '70%' }}>
        {!isOwn && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {message.sender?.username}
          </Typography>
        )}
        
        <Box display="flex" alignItems="flex-end">
          <Paper
            elevation={1}
            sx={{
              p: isImage || isFile ? 0 : 1.5,
              backgroundColor: isOwn ? 'primary.main' : 'grey.100',
              color: isOwn ? 'white' : 'text.primary',
              borderRadius: 2,
              borderTopRightRadius: isOwn ? 0 : 2,
              borderTopLeftRadius: isOwn ? 2 : 0,
            }}
          >
            {isImage ? (
              <Box
                component="img"
                src={message.image}
                alt="Image"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 1,
                  display: 'block',
                }}
              />
            ) : isFile ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  📎 Fichier joint
                </Typography>
                <Typography variant="caption">
                  {message.file.split('/').pop()}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                {message.content}
              </Typography>
            )}
          </Paper>
          
          <Tooltip
            title={format(new Date(message.timestamp), 'PPpp', { locale: fr })}
          >
            <Typography
              variant="caption"
              sx={{
                ml: 1,
                mr: 1,
                color: 'text.secondary',
                whiteSpace: 'nowrap',
              }}
            >
              {format(new Date(message.timestamp), 'HH:mm')}
            </Typography>
          </Tooltip>
          
          <IconButton
            size="small"
            onClick={onMenuOpen}
            sx={{
              visibility: 'hidden',
              '&:hover': { visibility: 'visible' },
              'div:hover &': { visibility: 'visible' },
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
        
        {message.is_edited && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            (modifié)
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default MessageBubble;