// components/AudioRecorder.js
import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Stop as StopIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const AudioRecorder = ({
  isRecording,
  recordingTime,
  audioBlob,
  uploading,
  handleSendMessage,
  setAudioBlob,
  stopRecording,  // Add this prop
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {isRecording && (
        <Box sx={{ p: 2, bgcolor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center">
            <Box className="recording-indicator" />
            <Typography color="error.contrastText">
              Recording... {formatTime(recordingTime)}
            </Typography>
          </Box>
          <IconButton onClick={stopRecording} sx={{ color: 'error.contrastText' }}>
            <StopIcon />
          </IconButton>
        </Box>
      )}

      {audioBlob && !isRecording && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Audio recording ready to send
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <audio controls style={{ flex: 1, height: 40 }}>
              <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
            </audio>
            <IconButton onClick={handleSendMessage} color="primary" disabled={uploading}>
              {uploading ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
            <IconButton onClick={() => setAudioBlob(null)} disabled={uploading}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      )}
    </>
  );
};

export default AudioRecorder;