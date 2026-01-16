// components/MediaViewer.js
import React, { useRef, useEffect,useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import {
  Download as DownloadIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { getFileType } from '../../../utils/fileUtils';

// Track the currently playing media element globally
let currentPlayingMedia = null;

const MediaViewer = ({ openMediaViewer, setOpenMediaViewer, selectedMedia, onVideoClose }) => {
  const mediaRef = useRef(null);
   const [videoState, setVideoState] = useState({
    currentTime: 0,
    isPlaying: false
  });

 const stopCurrentMedia = () => {
    if (currentPlayingMedia && !currentPlayingMedia.paused) {
      currentPlayingMedia.pause(); // Seulement pause, ne pas réinitialiser le temps
      // currentPlayingMedia.currentTime = 0; // ENLEVEZ CETTE LIGNE
    }
    currentPlayingMedia = null;
  };
  
  useEffect(() => {
    if (selectedMedia?.initialVideoState) {
      setVideoState(selectedMedia.initialVideoState);
    }
  }, [selectedMedia]);
  const handleMediaPlay = (event) => {
    // If there's already a playing media that's not this one, stop it
    if (currentPlayingMedia && currentPlayingMedia !== event.target) {
      currentPlayingMedia.pause();
      currentPlayingMedia.currentTime = 0;
    }
    // Set this as the current playing media
    currentPlayingMedia = event.target;
  };

  useEffect(() => {
    // Stop any playing media when dialog closes
    if (!openMediaViewer) {
      stopCurrentMedia();
    }

    // Clean up on component unmount
    return () => {
      if (currentPlayingMedia === mediaRef.current) {
        stopCurrentMedia();
      }
    };
  }, [openMediaViewer]);

  const renderMediaContent = () => {
    if (!selectedMedia) return null;

    if (selectedMedia.image_url) {
      return (
        <img
          src={selectedMedia.image_url}
          alt="Message"
          style={{
            maxWidth: '100%',
            maxHeight: '70vh',
            objectFit: 'contain',
          }}
        />
      );
    }

    if (selectedMedia.file_url) {
      const fileType = getFileType(selectedMedia.file, selectedMedia.file_url);
      
      switch (fileType) {
   case 'video':
    return (
      <Box sx={{ p: 2, height: 500 }}>
        <video
          controlsList="nodownload"
          ref={mediaRef}
          controls
          autoPlay={videoState.isPlaying}
          onPlay={handlePlayPause}
          onPause={handlePlayPause}
          onEnded={() => {
            setVideoState(prev => ({ ...prev, isPlaying: false }));
            if (currentPlayingMedia === mediaRef.current) {
              currentPlayingMedia = null;
            }
          }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={(e) => {
            if (selectedMedia.initialVideoState?.currentTime) {
              e.target.currentTime = selectedMedia.initialVideoState.currentTime;
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '70vh',
            backgroundColor: 'black'
          }}
          noDownloads
        >
          <source src={selectedMedia.file_url} type="video/mp4" />
          Your browser does not support video playback.
        </video>
      </Box>
    );
        
        case 'audio':
          return (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <audio
                ref={mediaRef}
                controls
                autoPlay
                onPlay={handleMediaPlay}
                onPause={() => {
                  if (currentPlayingMedia === mediaRef.current) {
                    currentPlayingMedia = null;
                  }
                }}
                onEnded={() => {
                  if (currentPlayingMedia === mediaRef.current) {
                    currentPlayingMedia = null;
                  }
                }}
                style={{ width: '100%', maxWidth: 400 }}
              >
                <source src={selectedMedia.file_url} type="audio/mp3" />
              </audio>
              <Typography variant="caption" sx={{ mt: 2 }}>
                {selectedMedia.file || 'Audio file'}
              </Typography>
            </Box>
          );
        
        case 'pdf':
          return (
            <Box sx={{ p: 2, height: 500 }}>
              <embed
                src={selectedMedia.file_url}
                type="application/pdf"
                width="100%"
                height="100%"
              />
            </Box>
          );
        
        default:
          return (
            <Box sx={{ p: 4 }}>
              <FileIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6">{selectedMedia.file || 'File'}</Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                href={selectedMedia.file_url}
                download
                sx={{ mt: 2 }}
              >
                Download
              </Button>
            </Box>
          );
      }
    }

    return null;
  };

 const handleClose = () => {
    stopCurrentMedia();
    
    // Notifier le parent de l'état final de la vidéo
    if (onVideoClose && selectedMedia && mediaRef.current) {
      onVideoClose({
        messageId: selectedMedia.id,
        currentTime: mediaRef.current.currentTime,
        isPlaying: !mediaRef.current.paused
      });
    }
    
    setOpenMediaViewer(false);
  };
  
  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setVideoState(prev => ({
        ...prev,
        currentTime: mediaRef.current.currentTime
      }));
    }
  };
  
  const handlePlayPause = (event) => {
    setVideoState(prev => ({
      ...prev,
      isPlaying: !event.target.paused
    }));
    handleMediaPlay(event);
  };

  return (
    <Dialog
      open={openMediaViewer}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogContent sx={{ p: 0, textAlign: 'center', minHeight: 400, backgroundColor: '#000000' }}>
        {renderMediaContent()}
      </DialogContent>
      <DialogActions sx={{ backgroundColor: '#000000' }}>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MediaViewer;