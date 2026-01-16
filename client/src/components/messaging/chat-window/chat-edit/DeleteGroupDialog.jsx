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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  Message as MessageIcon,
} from '@mui/icons-material';

const DeleteGroupDialog = ({
  open,
  onClose,
  conversation,
  conversationAPI,
  refreshConversations,
  currentUser,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const handleDeleteGroup = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await conversationAPI.deleteGroup(conversation.id);
      
      if (refreshConversations) {
        await refreshConversations();
      }
      
      onClose();
      
    } catch (err) {
      setError(err.message || 'Error while deleting the group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <DeleteIcon color="error" />
          <Typography variant="h6">Delete Group</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            ⚠️ This action is irreversible!
          </Typography>
          <Typography variant="body2">
            The group and all its messages will be permanently deleted.
          </Typography>
        </Alert>

        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete the group <strong>"{conversation?.name}"</strong>?
        </Typography>

        <Box sx={{ my: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Details of the group to delete:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <PeopleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={`${conversation?.participants?.length || 0} members`}
              />
            </ListItem>
            {conversation?.messages?.length > 0 && (
              <ListItem>
                <ListItemIcon>
                  <MessageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={`${conversation.messages.length} messages`}
                />
              </ListItem>
            )}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Alert severity="error" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              Consequences of deletion:
            </Typography>
            <Typography variant="body2">
              • All members will lose access to the group
              <br />
              • All messages will be deleted
              <br />
              • This action cannot be undone
              <br />
              • No member will be able to recover the data
            </Typography>
          </Box>
        </Alert>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" gutterBottom>
            To confirm, type <strong>DELETE</strong> in the field below:
          </Typography>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ff6b6b',
              borderRadius: '4px',
              fontSize: '16px',
              marginTop: '8px',
              backgroundColor: confirmText === 'DELETE' ? '#ffeaea' : '#fff'
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleDeleteGroup}
          variant="contained"
          color="error"
          disabled={loading || confirmText !== 'DELETE'}
          startIcon={loading ? <CircularProgress size={16} /> : <DeleteIcon />}
        >
          {loading ? 'Deleting...' : 'Delete Permanently'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteGroupDialog;