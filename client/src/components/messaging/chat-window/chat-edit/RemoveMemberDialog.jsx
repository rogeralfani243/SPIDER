// components/ChatHeader/RemoveMemberDialog.jsx

import React, { useState, useEffect } from 'react';
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
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Snackbar,
} from '@mui/material';
import {
  PersonRemove as PersonRemoveIcon,
  Search as SearchIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const RemoveMemberDialog = ({
  open,
  onClose,
  conversation,
  conversationAPI,
  refreshConversations,
  currentUser,
  getInitials,
  onMemberRemoved, // New prop for callback
}) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [removedUser, setRemovedUser] = useState(null);
  const [members, setMembers] = useState([]);

  // Initialize members when the dialog opens
  useEffect(() => {
    if (open && conversation?.participants) {
      // Filter to exclude the current admin
      const filteredMembers = conversation.participants.filter(
        member => member.id !== currentUser?.id
      );
      setMembers(filteredMembers);
      setSelectedUser(null);
      setSearchQuery('');
      setError('');
      setSuccess('');
    }
  }, [open, conversation, currentUser]);

  // Filter members based on search
  const filteredMembers = searchQuery
    ? members.filter(member =>
        member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;

  const handleRemoveMember = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // API call to remove the member
      const response = await conversationAPI.removeMemberFromGroup(
        conversation.id, 
        selectedUser.id
      );
      
      // Update the members list locally
      setMembers(prev => prev.filter(member => member.id !== selectedUser.id));
      
      // Store the removed user for display
      setRemovedUser(selectedUser);
      
      // Show success message
      setSuccess(`${selectedUser.username} has been removed from the group`);
      setSnackbarOpen(true);
      
      // Reset selection
      setSelectedUser(null);
      
      // Refresh global data
      if (refreshConversations) {
        await refreshConversations();
      }
      
      // Notify parent that a member has been removed
      if (onMemberRemoved) {
        onMemberRemoved(selectedUser);
      }
      
      // Close automatically after 2 seconds
      setTimeout(() => {
        if (members.length <= 1) { // If only the admin remains
          onClose();
        }
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Error while removing the member');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setError('');
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleClose = () => {
    // Reset everything before closing
    setSelectedUser(null);
    setSearchQuery('');
    setError('');
    setSuccess('');
    setRemovedUser(null);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonRemoveIcon color="error" />
            <Typography variant="h6">Remove a Member</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }} 
              action={
                <IconButton size="small" onClick={() => setError('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography>{success}</Typography>
                <Button 
                  size="small" 
                  onClick={() => setSuccess('')}
                  startIcon={<CloseIcon />}
                >
                  Close
                </Button>
              </Box>
            </Alert>
          )}

          <Typography variant="body1" gutterBottom>
            Select a member to remove from the group <strong>"{conversation?.name}"</strong>
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Admin:</strong> {currentUser?.username}
              <br />
              <strong>Remaining members:</strong> {members.length}
            </Typography>
          </Alert>

          {/* Search field */}
          <TextField
            fullWidth
            placeholder="Search a member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton 
                    size="small" 
                    onClick={() => setSearchQuery('')}
                    disabled={loading}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Members list */}
          <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
            {filteredMembers.length === 0 ? (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                textAlign="center" 
                py={2}
              >
                {searchQuery 
                  ? 'No member found' 
                  : 'No other member in this group'}
              </Typography>
            ) : (
              <List>
                {filteredMembers.map((member) => (
                  <ListItem
                    key={member.id}
                    button
                    selected={selectedUser?.id === member.id}
                    onClick={() => !loading && handleUserSelect(member)}
                    disabled={loading}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      opacity: loading ? 0.7 : 1,
                      '&.Mui-selected': {
                        backgroundColor: 'error.light',
                        '&:hover': {
                          backgroundColor: 'error.light',
                        },
                      },
                      '&.Mui-disabled': {
                        pointerEvents: 'none',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={member.profile_image}
                        sx={{ width: 40, height: 40 }}
                      >
                        {getInitials(member.username)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1">
                            {member.username}
                          </Typography>
                          {member.id === conversation?.created_by?.id && (
                            <Chip label="Admin" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={member.email}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {/* Selected member */}
          {selectedUser && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Deletion Confirmation
                </Typography>
                <Typography variant="body2" paragraph>
                  Are you sure you want to remove <strong>{selectedUser.username}</strong>?
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>They will immediately lose access to the group</li>
                  <li>They will no longer be able to see messages</li>
                  <li>They can only return by invitation</li>
                  <li>This action will be announced in the chat</li>
                </Box>
              </Box>
            </Alert>
          )}

          {/* Deletion in progress status */}
          {loading && (
            <Box display="flex" alignItems="center" gap={2} mt={2}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Deletion in progress...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClose} 
            disabled={loading}
          >
            {removedUser ? 'Close' : 'Cancel'}
          </Button>
          <Button
            onClick={handleRemoveMember}
            variant="contained"
            color="error"
            disabled={loading || !selectedUser}
            startIcon={loading ? <CircularProgress size={16} /> : <PersonRemoveIcon />}
          >
            {loading ? 'Deleting...' : 'Remove Member'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for confirmation */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message={`${removedUser?.username} has been removed from the group`}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </>
  );
};

export default RemoveMemberDialog;