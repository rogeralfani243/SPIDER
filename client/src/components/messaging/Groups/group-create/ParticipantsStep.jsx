// src/components/groups/steps/ParticipantsStep.jsx
import React from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

/**
 * Step 4: Add Participants
 * Handles user search and selection for group members
 */
const ParticipantsStep = ({
  formData,
  userSearchQuery,
  userSearchResults,
  userSearchLoading,
  onSearchQueryChange,
  onClearSearch,
  onAddUser,
  onRemoveUser,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 3 }}>
          You can invite members now or later from the group settings.
          As the creator, you will automatically be added as the owner.
        </Alert>
      </Grid>

      <Grid item xs={12}>
        {/* Selected Users Chips */}
        {formData.selectedUsers.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Users ({formData.selectedUsers.length}/{formData.max_participants - 1})
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {formData.selectedUsers.map((user) => (
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
                  onDelete={() => onRemoveUser(user.id)}
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
          placeholder="Search users by username..."
          value={userSearchQuery}
          onChange={onSearchQueryChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: userSearchQuery && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={onClearSearch}
                  edge="end"
                >
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText={`Select up to ${formData.max_participants - 1} users to invite`}
        />

        {/* Loading indicator */}
        {userSearchLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Search Results */}
        {userSearchResults.length > 0 && !userSearchLoading && (
          <Paper
            variant="outlined"
            sx={{
              mt: 2,
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            <List dense>
              {userSearchResults.map((user) => (
                <ListItem
                  key={user.id}
                  button
                  onClick={() => onAddUser(user)}
                  disabled={formData.selectedUsers.length >= formData.max_participants - 1}
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
                    checked={false}
                    onChange={() => onAddUser(user)}
                    disabled={formData.selectedUsers.length >= formData.max_participants - 1}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {userSearchQuery && userSearchResults.length === 0 && !userSearchLoading && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
            No users found for "{userSearchQuery}"
          </Typography>
        )}

        {/* Selection Info */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {formData.selectedUsers.length === 0
            ? 'No users selected yet'
            : `${formData.selectedUsers.length} user${formData.selectedUsers.length > 1 ? 's' : ''} selected`}
          {formData.selectedUsers.length >= formData.max_participants - 1 && (
            <Typography component="span" color="error" sx={{ ml: 1 }}>
              • Maximum limit reached
            </Typography>
          )}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> 
            {formData.requires_approval 
              ? ' Invited users will need approval to join the group.' 
              : ' All invited users will automatically become members.'}
            Make sure you have their permission before adding them.
          </Typography>
        </Alert>
      </Grid>
    </Grid>
  );
};

export default ParticipantsStep;