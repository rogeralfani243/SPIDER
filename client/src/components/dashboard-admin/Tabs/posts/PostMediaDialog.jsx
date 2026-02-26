// src/components/dashboard-admin/components/Views/PostMediaDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Box
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Videocam as VideoIcon,
  MusicNote as AudioIcon
} from '@mui/icons-material';

const PostMediaDialog = ({ open, post, onClose, onOpenFullscreen }) => {
  const getPostMedia = (post) => {
    const media = [];
    
    if (post.image_url) {
      media.push({
        url: post.image_url,
        type: 'image',
        title: 'Main image'
      });
    }
    
    if (post.post_images && post.post_images.length > 0) {
      post.post_images.forEach(img => {
        media.push({
          url: img.image_url,
          type: 'image',
          title: img.title || 'Image'
        });
      });
    }
    
    if (post.post_files && post.post_files.length > 0) {
      post.post_files.forEach(file => {
        const extension = file.file_url?.split('.').pop()?.toLowerCase() || '';
        let type = 'file';
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
          type = 'image';
        } else if (['mp4', 'webm', 'ogg'].includes(extension)) {
          type = 'video';
        } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
          type = 'audio';
        } else if (['pdf'].includes(extension)) {
          type = 'pdf';
        }
        
        media.push({
          url: file.file_url,
          type: type,
          title: file.title || 'File',
          extension: extension
        });
      });
    }
    
    return media;
  };

  const getMediaIcon = (type) => {
    switch(type) {
      case 'image': return <ImageIcon />;
      case 'video': return <VideoIcon />;
      case 'audio': return <AudioIcon />;
      case 'pdf': return <PdfIcon />;
      default: return <FileIcon />;
    }
  };

  const media = getPostMedia(post);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Post Media: {post.title}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {media.length > 0 ? (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              {media.length} attached file(s)
            </Alert>
            <List>
              {media.map((item, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton 
                      edge="end"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      <DownloadIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {getMediaIcon(item.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.title}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip label={item.type} size="small" variant="outlined" />
                        {item.extension && (
                          <Chip label={item.extension.toUpperCase()} size="small" />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ) : (
          <Alert severity="warning">
            No media attached to this post
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostMediaDialog;