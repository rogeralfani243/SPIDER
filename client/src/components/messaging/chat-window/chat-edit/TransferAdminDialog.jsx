import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Cancel as CancelIcon,
  SwapHoriz as TransferIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const TransferAdminDialog = ({
  open,
  onClose,
  conversation,
  currentUser,
  conversationAPI,
  refreshConversations,
  getInitials,
}) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adminInfo, setAdminInfo] = useState(null);
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  // Charger les informations d'administration quand le dialog s'ouvre
  useEffect(() => {
    if (open && conversation?.id) {
      loadAdminInfo();
    }
  }, [open, conversation]);

  const loadAdminInfo = async () => {
    setLoadingInfo(true);
    setError('');
    try {
      const info = await conversationAPI.getGroupAdminInfo(conversation.id);
      
      console.log('Admin Info Response:', info); // Debug
      
      if (info.success) {
        setAdminInfo(info);
      } else {
        setError(info.error || 'Failed to load group information');
      }
    } catch (err) {
      console.error('Error loading admin info:', err);
      setError('Unable to load group information');
    } finally {
      setLoadingInfo(false);
    }
  };

  // Filtrer les membres selon la recherche
  const getFilteredMembers = () => {
    if (!adminInfo || !adminInfo.members) return [];
    
    let members = adminInfo.members.filter(member => 
      member.id !== currentUser?.id && // Exclude current user
      member.id !== conversation?.created_by?.id // Exclude current owner
    );
    
    if (searchQuery) {
      members = members.filter(member =>
        member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (member.first_name && member.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (member.last_name && member.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return members;
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setTransferConfirmed(false);
    setConfirmationText('');
    setError('');
  };

  const handleTransferOwnership = async () => {
    if (!selectedUser || !transferConfirmed || confirmationText !== 'TRANSFER') {
      setError('Please confirm the transfer by typing "TRANSFER"');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await conversationAPI.transferGroupOwnership(
        conversation.id,
        selectedUser.id
      );

      if (response.success) {
        setSuccess(`Ownership has been transferred to ${selectedUser.username}`);
        
        // Refresh data
        if (refreshConversations) {
          await refreshConversations();
        }
        
        // Reload admin info
        await loadAdminInfo();
        
        // Reset
        setSelectedUser(null);
        setTransferConfirmed(false);
        setConfirmationText('');
        
        // Close automatically after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(response.error || 'Error during transfer');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error during transfer');
      console.error('Transfer error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset everything
    setSelectedUser(null);
    setSearchQuery('');
    setError('');
    setSuccess('');
    setTransferConfirmed(false);
    setConfirmationText('');
    setAdminInfo(null);
    onClose();
  };

  const filteredMembers = getFilteredMembers();
  
  // Get total members from adminInfo or conversation
  const totalMembers = adminInfo?.members?.length || conversation?.participants?.length || 0;
  
  // Get current owner from adminInfo or conversation
  const currentOwner = adminInfo?.group?.owner || conversation?.created_by;
  const currentOwnerUsername = currentOwner?.username || 'Unknown';

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <TransferIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Transfer Group Ownership
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Status messages */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }} 
            icon={<ErrorIcon />}
            action={
              <IconButton size="small" onClick={() => setError('')}>
                <CancelIcon fontSize="small" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            icon={<CheckCircleIcon />}
          >
            {success}
          </Alert>
        )}

        {/* Loading */}
        {loadingInfo ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : adminInfo ? (
          <>
            {/* Informative header */}
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>⚠️ Important Warning:</strong> By transferring ownership, you will lose all your administrator privileges. The new owner will be able to modify settings, remove members, and even remove you from the group.
              </Typography>
            </Alert>

            {/* Group information */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Group to transfer:
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  src={conversation?.group_photo_url}
                  sx={{ width: 48, height: 48 }}
                >
                  {getInitials(conversation?.name)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {conversation?.name || 'Unnamed Group'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {totalMembers} members • 
                    Current owner: {currentOwnerUsername}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Member search */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Select New Owner
              </Typography>
              <TextField
                fullWidth
                placeholder="Search for a member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading || success}
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
            </Box>

            {/* List of eligible members */}
            <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 3 }}>
              {filteredMembers.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery 
                      ? 'No members found' 
                      : 'No eligible members for transfer'}
                  </Typography>
                </Box>
              ) : (
                <List>
                  {filteredMembers.map((member) => (
                    <ListItem
                      key={member.id}
                      button
                      selected={selectedUser?.id === member.id}
                      onClick={() => !loading && handleUserSelect(member)}
                      disabled={loading || success}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        border: '1px solid',
                        borderColor: selectedUser?.id === member.id ? 'primary.main' : 'divider',
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          },
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={member.profile_image}
                          sx={{ width: 44, height: 44 }}
                        >
                          {getInitials(member.username)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1" fontWeight="medium">
                              {member.username}
                            </Typography>
                            {member.is_online && (
                              <Chip 
                                label="Online" 
                                size="small" 
                                color="success" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {member.email || 'No email'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Last activity: {member.formatted_last_seen || 'Unknown'}
                            </Typography>
                          </Box>
                        }
                      />
                      {selectedUser?.id === member.id && (
                        <CheckCircleIcon color="primary" />
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            {/* Transfer confirmation */}
            {selectedUser && !success && (
              <>
                <Divider sx={{ my: 2 }} />
                
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Confirmation Required
                  </Typography>
                  <Typography variant="body2" paragraph>
                    You are about to transfer ownership of <strong>"{conversation?.name}"</strong> to <strong>{selectedUser.username}</strong>.
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0, mb: 2 }}>
                    <li>You will lose all administrator rights</li>
                    <li>{selectedUser.username} will be able to modify all settings</li>
                    <li>They will be able to remove you from the group</li>
                    <li>This action is irreversible</li>
                  </Box>
                </Alert>

                {/* Text confirmation */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    To confirm, type <strong>"TRANSFER"</strong> in the field below:
                  </Typography>
                  <TextField
                    fullWidth
                    value={confirmationText}
                    onChange={(e) => {
                      setConfirmationText(e.target.value);
                      setTransferConfirmed(e.target.value === 'TRANSFER');
                    }}
                    placeholder="TRANSFER"
                    error={confirmationText !== '' && !transferConfirmed}
                    helperText={confirmationText !== '' && !transferConfirmed ? 'Text must be exactly "TRANSFER"' : ''}
                    disabled={loading}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: transferConfirmed ? 'success.light' : 'background.paper',
                      }
                    }}
                  />
                </Box>

                {/* Transfer summary */}
                <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 2, mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Transfer Summary:
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Current Owner
                      </Typography>
                      <Typography variant="body2">
                        {currentUser?.username}
                      </Typography>
                    </Box>
                    <TransferIcon sx={{ color: 'warning.main' }} />
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary">
                        New Owner
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedUser.username}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </>
            )}
          </>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              Unable to load group information
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          variant="outlined"
        >
          {success ? 'Close' : 'Cancel'}
        </Button>
        
        {!success && selectedUser && (
          <Button
            onClick={handleTransferOwnership}
            variant="contained"
            color="warning"
            disabled={!transferConfirmed || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <TransferIcon />}
            sx={{
              backgroundColor: 'warning.main',
              '&:hover': {
                backgroundColor: 'warning.dark',
              },
            }}
          >
            {loading ? 'Transferring...' : 'Confirm Transfer'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TransferAdminDialog;