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
  Chip,
} from '@mui/material';
import { Info as InfoIcon, Email as EmailIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ContactInfoDialog = ({
  open,
  onClose,
  otherParticipant,
  currentUser,
  getInitials,
  conversation,
}) => {
    const getProfileId=  () => {
         if (!otherParticipant) return null;
    return otherParticipant.profile_id
    }
    const profile_id = getProfileId()
  const getProfileImage = () => {
    if (!otherParticipant) return null;
    return otherParticipant.profile_image || 
           otherParticipant?.image || 
           otherParticipant?.avatar || 
           otherParticipant?.profile?.image;
  };
  const navigate = useNavigate()
const handleClickProfile = () => {
    window.location.href = (`/profile/${profile_id}/`)
}
  const profileImage = getProfileImage();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <InfoIcon />
          <Typography variant="h6">Contact Information</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} mb={3}>
          <Avatar
            src={profileImage}
            sx={{
                cursor:'pointer',
              width: 120,
              height: 120,
              fontSize: '2.5rem',
              bgcolor: profileImage ? undefined : 'primary.main',
            }}
            onClick = {handleClickProfile}
          >
            {!profileImage && getInitials(otherParticipant?.username)}
          </Avatar>
          
          <Typography variant="h5" textAlign="center">
            {otherParticipant?.username || 'Unknown User'}
          </Typography>
          
          {otherParticipant?.email && (
            <Box display="flex" alignItems="center" gap={1}>
              <EmailIcon fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {otherParticipant.email}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Contact Details:
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Username:</strong> {otherParticipant?.username || 'Unknown'}
          </Typography>
          
          {otherParticipant?.first_name && (
            <Typography variant="body2" color="text.secondary">
              <strong>First Name:</strong> {otherParticipant.first_name}
            </Typography>
          )}
          
          {otherParticipant?.last_name && (
            <Typography variant="body2" color="text.secondary">
              <strong>Last Name:</strong> {otherParticipant.last_name}
            </Typography>
          )}
          
          {conversation?.created_at && (
            <Typography variant="body2" color="text.secondary">
              <strong>Conversation started:</strong> {new Date(conversation.created_at).toLocaleDateString()}
            </Typography>
          )}
        </Box>

        {/* Conversation stats */}
        {conversation?.message_count && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Conversation Statistics:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip 
                label={`${conversation.message_count} messages`} 
                size="small" 
                variant="outlined" 
              />
              {conversation.unread_count > 0 && (
                <Chip 
                  label={`${conversation.unread_count} unread`} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              )}
            </Box>
          </>
        )}

        {/* Shared groups if any */}
        {otherParticipant?.shared_groups && otherParticipant.shared_groups.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Shared Groups ({otherParticipant.shared_groups.length}):
            </Typography>
            <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
              {otherParticipant.shared_groups.map((group) => (
                <ListItem key={group.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {getInitials(group.name)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={group.name}
                    secondary={`${group.member_count} members`}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactInfoDialog;