// components/MessageList.js
import React from 'react';
import {
  Box,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';

const MessageList = ({ 
  messages, 
  loadingMessages, 
  error, 
  micPermissionError, 
  currentUser, 
  renderMediaDirectly, 
  handleContextMenu, 
  editingMessage, 
  editContent, 
  setEditContent, 
  saveEditMessage, 
  cancelEdit, 
  renderMessages, 
  messagesEndRef,
  setError,           // Add this prop
  setMicPermissionError, // Add this prop
}) => {
  if (loadingMessages) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#f0f0f0' }}>
      
      
      {micPermissionError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setMicPermissionError(false)}>
          Microphone not available. Check your browser permissions.
        </Alert>
      )}

      {messages.length === 0 ? (
        <Box textAlign="center" p={3} >
          <Typography color="text.secondary">
            No messages. Send the first one!
          </Typography>
        </Box>
      ) : (
        <>
          {renderMessages()}
          <div ref={messagesEndRef} />
          {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
        </>
      )}
    </Box>
  );
};

export default MessageList;