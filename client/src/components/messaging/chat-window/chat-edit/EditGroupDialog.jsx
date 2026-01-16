import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';

const EditGroupDialog = ({
  open,
  onClose,
  conversation,
  currentUser,
  conversationAPI,
  refreshConversations,
  getGroupPhotoUrl,
  getGroupAvatarText,
}) => {
  const [editedGroupData, setEditedGroupData] = useState({
    name: conversation?.name || '',
    description: conversation?.description || '',
  });
  const [newGroupPhoto, setNewGroupPhoto] = useState(null);
  const [groupPhotoPreview, setGroupPhotoPreview] = useState(getGroupPhotoUrl());
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const currentGroupPhoto = getGroupPhotoUrl();

  const handlePhotoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must not exceed 5MB');
        return;
      }
      setNewGroupPhoto(file);
      setGroupPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!editedGroupData.name.trim() && conversation?.group_type === 'group_public') {
      setError('Name is required for public groups');
      return;
    }
    
    setLoadingAction(true);
    setError('');
    
    try {
      const updateData = {
        ...editedGroupData,
        group_photo: newGroupPhoto,
      };
      
      await conversationAPI.updateGroup(conversation.id, updateData);
      
      if (refreshConversations) {
        await refreshConversations();
      }
      
      onClose();
      
    } catch (err) {
      setError(err.message || 'Error updating group');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <EditIcon />
          <Typography variant="h6">Edit Group</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {/* Group photo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />
          
          <Avatar
            src={groupPhotoPreview || currentGroupPhoto}
            sx={{
              width: 120,
              height: 120,
              mb: 2,
              cursor: 'pointer',
              fontSize: '2.5rem',
              bgcolor: (groupPhotoPreview || currentGroupPhoto) ? undefined : 'primary.main',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {!(groupPhotoPreview || currentGroupPhoto) && getGroupAvatarText()}
          </Avatar>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outlined"
            size="small"
          >
            {groupPhotoPreview ? 'Change Photo' : currentGroupPhoto ? 'Change Photo' : 'Add Group Photo'}
          </Button>
        </Box>
        
        {/* Group name */}
        <TextField
          fullWidth
          label="Group Name"
          value={editedGroupData.name}
          onChange={(e) => setEditedGroupData(prev => ({ ...prev, name: e.target.value }))}
          sx={{ mb: 2 }}
          required={conversation?.group_type === 'group_public'}
        />
        
        {/* Group description */}
        <TextField
          fullWidth
          label="Description"
          value={editedGroupData.description}
          onChange={(e) => setEditedGroupData(prev => ({ ...prev, description: e.target.value }))}
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />
        
        {/* Group settings */}
        <FormControlLabel
          control={
            <Switch
              checked={conversation?.can_anyone_invite || false}
              disabled
            />
          }
          label="Anyone can invite members"
        />
        
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Note: Some settings can only be changed by the group admin
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loadingAction}
          startIcon={loadingAction ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          {loadingAction ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditGroupDialog;