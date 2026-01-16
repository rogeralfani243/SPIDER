import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Avatar,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

const DeleteConversationDialog = ({
  open,
  onClose,
  conversation,
  otherParticipant,
  conversationAPI,
  refreshConversations,
  currentUser,
  getInitials,
  onConversationDeleted, // Callback after successful deletion
  onDeleteSuccess, // Additional callback for complete cleanup
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleDelete = async () => {
    if (!conversation?.id) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🗑️ Deleting conversation:', conversation.id);
      
      // Call API to delete conversation
      await conversationAPI.deleteConversation(conversation.id);
      
      console.log('✅ Conversation deleted successfully');
      
      // Call parent callback if provided
      if (onConversationDeleted) {
        onConversationDeleted(conversation.id);
      }
      
      // Refresh conversations list
      if (refreshConversations) {
        console.log('🔄 Refreshing conversations...');
        await refreshConversations();
      }
      
      // Additional callback for complete cleanup
      if (onDeleteSuccess) {
        onDeleteSuccess(conversation.id);
      }
      
      // Close dialog
      onClose();
      
      // Optional: Show success message
      console.log('🎉 Conversation fully deleted and data refreshed');
      
    } catch (err) {
      console.error('❌ Error deleting conversation:', err);
      setError(err.message || 'An error occurred while deleting the conversation');
    } finally {
      setLoading(false);
    }
  };

  // Get the other participant's avatar
  const getAvatar = () => {
    return otherParticipant?.profile_image || 
           otherParticipant?.image || 
           otherParticipant?.avatar ||
           otherParticipant?.profile_picture;
  };

  const displayName = otherParticipant?.username || 'Conversation';
  const avatarUrl = getAvatar();

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        color: 'error.main',
      }}>
        <DeleteIcon color="error" />
        Delete Conversation
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar
            src={avatarUrl}
            sx={{
              width: 60,
              height: 60,
              bgcolor: 'error.light',
            }}
          >
            {!avatarUrl && getInitials ? getInitials(displayName) : '?'}
          </Avatar>
          
          <Box>
            <Typography variant="h6" fontWeight="medium">
              {displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Private Conversation
            </Typography>
          </Box>
        </Box>
        
        <DialogContentText>
          Are you sure you want to delete this conversation?
          <Typography component="span" fontWeight="bold" color="error">
            {' '}This action is irreversible.
          </Typography>
        </DialogContentText>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            This action will only delete the conversation for you.
            <strong> {otherParticipant?.username || "The other participant"}</strong> will still be able to see the messages.
          </Typography>
        </Alert>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConversationDialog;