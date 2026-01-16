// src/components/messaging/UserSearchDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { userAPI } from '../../hooks/messaging/messagingApi';

const UserSearchDialog = ({ 
  open, 
  onClose, 
  onInviteUsers,
  existingMemberIds = [],
  currentUserId,
  groupName = 'Group',
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState('');

  // Fonction pour obtenir les initiales
  const getInitials = (username) => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  // Recherche d'utilisateurs
  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    
    setLoadingSearch(true);
    setError('');
    
    try {
      const response = await userAPI.searchUsers(searchQuery);
      
      // Filtrer les utilisateurs déjà membres et l'utilisateur courant
      const availableUsers = response.data.results?.filter(user => 
        !existingMemberIds.includes(user.id) && 
        user.id !== currentUserId
      ) || [];
      
      console.log('🔍 UserSearchDialog - Results:', {
        query: searchQuery,
        total: response.data.results?.length || 0,
        available: availableUsers.length
      });
      
      setSearchResults(availableUsers);
      
    } catch (err) {
      console.error('❌ UserSearchDialog - Search error:', err);
      setError('Error searching users: ' + (err.message || 'Unknown error'));
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Recherche automatique avec délai
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleInvite = () => {
    if (selectedUsers.length === 0) return;
    
    if (onInviteUsers) {
      onInviteUsers(selectedUsers);
    }
    
    // Réinitialiser après l'invitation
    setSelectedUsers([]);
    setSearchResults([]);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSearchResults([]);
    setSearchQuery('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonAddIcon />
          <Typography variant="h6">Add Members to "{groupName}"</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Search for users to invite to this group
        </Typography>

        {/* Search input */}
        <Box display="flex" gap={1} mb={2}>
          <TextField
            fullWidth
            label="Search by username, email, or name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type at least 2 characters..."
            size="small"
            autoFocus
          />
          <Button
            onClick={handleSearch}
            variant="outlined"
            disabled={searchQuery.length < 2 || loadingSearch}
          >
            {loadingSearch ? <CircularProgress size={20} /> : 'Search'}
          </Button>
        </Box>

        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected to invite ({selectedUsers.length}):
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {selectedUsers.map((user) => (
                <Chip
                  key={user.id}
                  label={user.username}
                  onDelete={() => toggleUserSelection(user)}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Search results */}
        <Box sx={{ maxHeight: 300, overflow: 'auto', minHeight: 200 }}>
          {loadingSearch ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%" p={3}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" ml={2}>
                Searching users...
              </Typography>
            </Box>
          ) : searchResults.length === 0 ? (
            <Box textAlign="center" p={3}>
              <Typography variant="body2" color="text.secondary">
                {searchQuery.length >= 2 
                  ? 'No users found. Try a different search term.' 
                  : 'Type at least 2 characters to search for users.'}
              </Typography>
            </Box>
          ) : (
            <List>
              {searchResults.map((user) => {
                const isSelected = selectedUsers.some(u => u.id === user.id);
                return (
                  <ListItem
                    key={user.id}
                    button
                    onClick={() => toggleUserSelection(user)}
                    sx={{
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: isSelected ? 'action.selected' : 'action.hover',
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={user.profile_image}
                        sx={{ width: 40, height: 40 }}
                      >
                        {getInitials(user.username)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="subtitle1">{user.username}</Typography>
                          {user.email && (
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    {isSelected && (
                      <Typography color="primary" fontWeight="bold">✓</Typography>
                    )}
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
        
        {/* Info */}
        <Box sx={{ mt: 2, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="caption" color="info.dark">
            {existingMemberIds.length} existing members • {selectedUsers.length} selected to invite
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleInvite}
          variant="contained"
          disabled={selectedUsers.length === 0 || loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Inviting...' : `Invite ${selectedUsers.length} user(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserSearchDialog;