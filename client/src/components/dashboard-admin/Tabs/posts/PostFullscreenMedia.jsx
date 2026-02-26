// src/components/dashboard-admin/components/Views/PostFullscreenMedia.jsx
import React from 'react';
import { Modal, Fade, Box, IconButton, Typography, Button } from '@mui/material';
import { Close as CloseIcon, Download as DownloadIcon } from '@mui/icons-material';

const PostFullscreenMedia = ({ open, post, mediaIndex, onClose }) => {
  const getPostMedia = (post) => {
    if (!post) return [];
    const media = [];
    if (post.image_url) media.push({ url: post.image_url, type: 'image' });
    if (post.post_images) media.push(...post.post_images.map(img => ({ ...img, type: 'image' })));
    return media;
  };

  const media = getPostMedia(post);
  const currentMedia = media[mediaIndex];

  if (!currentMedia) return null;

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition>
      <Fade in={open}>
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '90%',
          height: '90%',
          bgcolor: 'background.paper',
          boxShadow: 24, // CHANGÉ: boxShadow au lieu de elevation
          p: 4,
          outline: 'none',
          borderRadius: 1,
          overflow: 'hidden'
        }}>
          <IconButton
            sx={{ 
              position: 'absolute', 
              top: 16, 
              right: 16, 
              zIndex: 1,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
            }}
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ 
            width: '100%', 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {currentMedia.type === 'image' ? (
              <img
                src={currentMedia.url}
                alt="Media"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  {currentMedia.title || 'File'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => window.open(currentMedia.url, '_blank')}
                >
                  Download
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default PostFullscreenMedia;