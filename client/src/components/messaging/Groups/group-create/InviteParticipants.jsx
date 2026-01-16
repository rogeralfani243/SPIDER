// src/components/groups/InviteParticipantsStep.jsx
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Alert,
  Typography,
  Box,
  Paper,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { userAPI } from '../../../../hooks/messaging/messagingApi';

const InviteParticipantsStep = ({
  selectedUsers = [],
  onSelectedUsersChange,
  excludeUsers = [],
  maxParticipants = 100,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Search users with debounce
  const searchUsers = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);

    try {
      const response = await userAPI.searchUsersForMessaging(query);
      
      let users = [];
      if (response.data && Array.isArray(response.data)) {
        users = response.data;
      } else if (response.data?.results) {
        users = response.data.results;
      } else if (response.data?.users) {
        users = response.data.users;
      }

      // Filter out already selected and excluded users
      const selectedIds = selectedUsers.map(user => user.id);
      const excludedIds = excludeUsers.map(user => user.id || user);
      
      const filteredUsers = users.filter(user => 
        !selectedIds.includes(user.id) && 
        !excludedIds.includes(user.id)
      );

      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      searchUsers(value);
    }, 300);

    setDebounceTimer(timer);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  };

  // Add user to selected list
  const handleAddUser = (user) => {
    if (maxParticipants && selectedUsers.length >= maxParticipants) return;
    
    const newSelectedUsers = [...selectedUsers, user];
    if (onSelectedUsersChange) {
      onSelectedUsersChange(newSelectedUsers);
    }
    
    // Remove from search results
    setSearchResults(prev => prev.filter(u => u.id !== user.id));
  };

  // Remove user from selected list
  const handleRemoveUser = (userId) => {
    const newSelectedUsers = selectedUsers.filter(user => user.id !== userId);
    if (onSelectedUsersChange) {
      onSelectedUsersChange(newSelectedUsers);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                Selected Users ({selectedUsers.length}/{maxParticipants})
              </Typography>
              <Button
                size="small"
                onClick={() => onSelectedUsersChange([])}
                disabled={selectedUsers.length === 0}
              >
                Clear All
              </Button>
            </Box>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                maxHeight: 150,
                overflowY: 'auto',
              }}
            >
              {selectedUsers.map((user) => (
                <Chip
                  key={user.id}
                  avatar={
                    <Avatar
                      src={user.profile_image}
                      alt={user.username}
                      sx={{ width: 24, height: 24 }}
                    >
                      {!user.profile_image && <PersonIcon fontSize="small" />}
                    </Avatar>
                  }
                  label={user.username}
                  onDelete={() => handleRemoveUser(user.id)}
                  color="primary"
                  variant="outlined"
                  size="medium"
                />
              ))}
            </Paper>
          </Box>
        )}

        {/* Search Input */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users by username, name, or email..."
          value={searchQuery}
          onChange={handleSearchChange}
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
                  onClick={handleClearSearch}
                  edge="end"
                >
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText="Start typing to search for users to invite"
        />

        {/* Loading indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && !loading && (
          <Paper
            variant="outlined"
            sx={{
              mt: 2,
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            <List dense>
              {searchResults.map((user) => (
                <ListItem
                  key={user.id}
                  button
                  onClick={() => handleAddUser(user)}
                  disabled={maxParticipants && selectedUsers.length >= maxParticipants}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={user.profile_image}
                      alt={user.username}
                    >
                      {!user.profile_image && <PersonIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.username}
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {user.first_name} {user.last_name}
                        </Typography>
                        {user.email && ` • ${user.email}`}
                      </React.Fragment>
                    }
                  />
                  <Checkbox
                    edge="end"
                    checked={selectedUsers.some(u => u.id === user.id)}
                    onChange={() => handleAddUser(user)}
                    disabled={maxParticipants && selectedUsers.length >= maxParticipants}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {searchQuery && searchResults.length === 0 && !loading && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
            No users found for "{searchQuery}"
          </Typography>
        )}

        {/* Selection Info */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {selectedUsers.length === 0
            ? 'No users selected yet'
            : `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} selected`}
          {maxParticipants && selectedUsers.length >= maxParticipants && (
            <Typography component="span" color="error" sx={{ ml: 1 }}>
              • Maximum limit reached
            </Typography>
          )}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default InviteParticipantsStep;