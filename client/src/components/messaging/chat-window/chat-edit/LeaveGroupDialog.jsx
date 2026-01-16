import React, { useState } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ExitToApp as ExitToAppIcon } from '@mui/icons-material';

const LeaveGroupDialog = ({
    currentUser,
  open,
  onClose,
  conversation,
  conversationAPI,
  refreshConversations,
}) => {
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');

  const handleLeave = async () => {
    setLoadingAction(true);
    setError('');
    
    try {
      await conversationAPI.leaveGroup(conversation.id);
      
      if (refreshConversations) {
        await refreshConversations();
      }
      
      onClose();
      
    } catch (err) {
      setError(err.message || 'Error leaving group');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ExitToAppIcon color="error" />
          <Typography variant="h6">Leave Group</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Typography variant="body1" gutterBottom>
          Are you sure you want to leave "{conversation?.name || 'this group'}"?
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          • You will no longer receive messages from this group
          <br />
          • You can only rejoin if someone invites you back
          <br />
          • Your messages will remain in the group
        </Typography>
        
        {conversation?.created_by?.id === currentUser?.id && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            You are the group admin. If you leave, the group will be deleted unless you transfer ownership first.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleLeave}
          variant="contained"
          color="error"
          disabled={loadingAction}
          startIcon={loadingAction ? <CircularProgress size={16} /> : null}
        >
          {loadingAction ? 'Leaving...' : 'Leave Group'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveGroupDialog;