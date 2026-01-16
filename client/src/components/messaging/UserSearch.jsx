// src/components/messaging/UserSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  CircularProgress,
  Paper,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  OutlinedInput,
  MenuItem,
  Select,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Group as GroupIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { userAPI, conversationAPI } from '../../.../../hooks/messaging/messagingApi';
import { useAuth } from '../../hooks/useAuth';

const UserSearch = ({ onSelectUser, onCreateConversation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [creatingGroupDialog, setCreatingGroupDialog] = useState(false);
  const [groupType, setGroupType] = useState('group_private');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupPhoto, setGroupPhoto] = useState(null);
  const [groupPhotoPreview, setGroupPhotoPreview] = useState(null);
  const searchTimeoutRef = useRef(null);
  const { user } = useAuth();

  // User search functionality with debounce
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          setLoading(true);
          const response = await userAPI.searchUsers(searchQuery);
          // Filter out current user from results
          const filteredResults = response.data.results?.filter(
            u => u.id !== user?.id
          ) || [];
          setSearchResults(filteredResults);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, user]);

  // Handle user selection for private chat
  const handleUserSelect = (selectedUser) => {
    if (onSelectUser) {
      onSelectUser(selectedUser.id);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // Toggle user selection for group creation
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

  // Open modal with reset state
  const handleOpenModal = () => {
    setModalOpen(true);
    setSelectedUsers([]);
    setCreatingGroup(false);
    setGroupName('');
    setGroupType('group_private');
    setGroupDescription('');
    setGroupPhoto(null);
    setGroupPhotoPreview(null);
  };

  // Close modal and reset all states
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUsers([]);
    setCreatingGroup(false);
    setGroupName('');
    setGroupPhoto(null);
    setGroupPhotoPreview(null);
  };

  // Open advanced group creation dialog
  const handleOpenGroupDialog = () => {
    if (selectedUsers.length >= 2) {
      setCreatingGroupDialog(true);
    }
  };

  // Close group creation dialog
  const handleCloseGroupDialog = () => {
    setCreatingGroupDialog(false);
  };

  // Handle photo file selection
  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setGroupPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setGroupPhotoPreview(previewUrl);
    }
  };

  // Remove selected photo
  const handleRemovePhoto = () => {
    setGroupPhoto(null);
    if (groupPhotoPreview) {
      URL.revokeObjectURL(groupPhotoPreview);
    }
    setGroupPhotoPreview(null);
  };

  // Handle conversation creation (private or group)
  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setCreatingGroup(true);
      const participantIds = selectedUsers.map(u => u.id);
      
      // Single user: private conversation
      if (selectedUsers.length === 1) {
        if (onCreateConversation) {
          await onCreateConversation(participantIds);
        } else {
          const response = await conversationAPI.getOrCreateConversationWithUser(participantIds[0]);
          if (onSelectUser) {
            onSelectUser(response.data.id);
          }
        }
      } else {
        // Multiple users: open advanced group dialog
        handleOpenGroupDialog();
        return;
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setCreatingGroup(false);
    }
  };

  // Handle advanced group creation with all options
  const handleCreateGroup = async () => {
    if (selectedUsers.length < 2 || !groupName.trim()) return;

    try {
      setCreatingGroup(true);
      const participantIds = selectedUsers.map(u => u.id);
      
      // Prepare group data for advanced creation
      const groupData = {
        name: groupName.trim(),
        participant_ids: participantIds,
        type: groupType,
        description: groupDescription.trim(),
        photo: groupPhoto,
      };
      
      if (onCreateConversation) {
        // Pass group data to parent component
        await onCreateConversation(groupData);
      } else {
        // Use advanced group creation API
        const response = await conversationAPI.createGroup(groupData);
        
        if (onSelectUser) {
          onSelectUser(response.data.id);
        }
      }
      
      handleCloseGroupDialog();
      handleCloseModal();
    } catch (error) {
      console.error('Error creating group:', error);
      alert(`Error creating group: ${error.response?.data?.error || error.message}`);
    } finally {
      setCreatingGroup(false);
    }
  };

  // Get avatar initials
  const getAvatarText = (username) => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* Search bar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          placeholder="Search for a user..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

          <PersonAddIcon            color="primary"/>

      </Box>

      {/* Search results dropdown */}
      {searchResults.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            zIndex: 1000,
            width: '100%',
            maxWidth: 400,
            maxHeight: 300,
            overflow: 'auto',
            mt: 1,
          }}
        >
          <List dense>
            {searchResults.map((result) => (
              <ListItem
                key={result.id}
                button
                onClick={() => handleUserSelect(result)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={result.profile_image}
                    alt={result.username}
                  >
                    {getAvatarText(result.username)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2">
                      {result.username}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {result.email}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Modal for conversation creation */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {selectedUsers.length > 1 ? 'Create a group' : 'New conversation'}
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedUsers.length > 1 
              ? `Select group members (${selectedUsers.length}/100)`
              : 'Select a user for a private conversation'}
          </Typography>

          {/* Search input in modal */}
          <TextField
            fullWidth
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {/* Selected users display */}
          {selectedUsers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {selectedUsers.length > 1 ? 'Selected members' : 'Selected user'} ({selectedUsers.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedUsers.map((user) => (
                  <Paper
                    key={user.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      borderRadius: 2,
                    }}
                  >
                    <Avatar
                      src={user.profile_image}
                      sx={{ width: 24, height: 24 }}
                    >
                      {getAvatarText(user.username)}
                    </Avatar>
                    <Typography variant="caption">
                      {user.username}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => toggleUserSelection(user)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}

          {/* Search results list */}
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {searchResults.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                sx={{ p: 3 }}
              >
                {searchQuery.length >= 2
                  ? 'No users found'
                  : 'Type at least 2 characters to search'}
              </Typography>
            ) : (
              <></>)}
            </Box>
        
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseGroupDialog}>Cancel</Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={!groupName.trim() || creatingGroup}
            startIcon={creatingGroup ? <CircularProgress size={16} /> : <GroupIcon />}
          >
            {creatingGroup ? 'Creating...' : 'Create group'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserSearch;