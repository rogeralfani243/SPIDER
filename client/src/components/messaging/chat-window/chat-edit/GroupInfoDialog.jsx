import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import { Info as InfoIcon, People as PeopleIcon, Edit as EditIcon } from '@mui/icons-material';

const GroupInfoDialog = ({
  open,
  onClose,
  conversation,
  currentUser,
  onEditGroup,
  getGroupPhotoUrl,
  getGroupAvatarText,
  getInitials,
}) => {
  const groupPhoto = getGroupPhotoUrl();


  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <InfoIcon />
          <Typography variant="h6">Group Information</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} mb={3}>
          <Avatar
            src={groupPhoto}
            sx={{
              width: 120,
              height: 120,
              fontSize: '2.5rem',
              bgcolor: groupPhoto ? undefined : 'primary.main',
            }}
          >
            {!groupPhoto && getGroupAvatarText()}
          </Avatar>
          
          <Typography variant="h5" textAlign="center">
            {conversation?.name || 'Group'}
          </Typography>
          
          {conversation?.description && (
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {conversation.description}
            </Typography>
          )}
          
          <Box display="flex" alignItems="center" gap={1}>
            <PeopleIcon fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              {conversation?.participants?.length || 0} members
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Group Details:
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Type:</strong> {conversation?.group_type === 'group_public' ? 'Public Group' : 'Private Group'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Created:</strong> {conversation?.created_at ? new Date(conversation.created_at).toLocaleDateString() : 'Unknown'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Created by:</strong> {conversation?.created_by?.username || 'Unknown'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Anyone can invite:</strong> {conversation?.can_anyone_invite ? 'Yes' : 'No'}
          </Typography>
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Members ({conversation?.participants?.length || 0}):
        </Typography>
        
        <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
          {conversation?.participants?.map((participant) => (
            <ListItem key={participant.id}>
              <ListItemAvatar>
                <Avatar
                  src={participant.profile_image}
                  sx={{ width: 32, height: 32, cursor:'pointer' }}
              onClick={() => {window.location.href=`/profile/${participant.profile_id}`}}
              >
                  {getInitials(participant.username)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={participant.username}
                secondary={participant.id === currentUser?.id ? 'You' : participant.email}
              />
              {participant.id === conversation?.created_by?.id && (
                <Typography variant="caption" color="primary">
                  Admin
                </Typography>
              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        {conversation?.created_by?.id === currentUser?.id && (
          <Button onClick={onEditGroup} startIcon={<EditIcon />}>
            Edit Group
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupInfoDialog;