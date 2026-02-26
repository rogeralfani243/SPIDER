import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Avatar, Chip, Grid, Paper,
  Divider, Button, IconButton, Stack, alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Group as GroupIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Message as MessageIcon
} from '@mui/icons-material';

const GroupDetailsDialog = ({ open, group, onClose, onEdit }) => {
  if (!group) return null;

  const getGroupTypeIcon = (type) => {
    switch (type) {
      case 'group_public': return <PublicIcon />;
      case 'group_private': return <LockIcon />;
      default: return <GroupIcon />;
    }
  };

  const getGroupTypeColor = (type) => {
    switch (type) {
      case 'group_public': return '#10B981';
      case 'group_private': return '#4F46E5';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'warning';
  };

  const getStatusLabel = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
        <Avatar 
          sx={{ 
            bgcolor: alpha(getGroupTypeColor(group.group_type), 0.2),
            color: getGroupTypeColor(group.group_type),
            width: 48, 
            height: 48 
          }}
        >
          {getGroupTypeIcon(group.group_type)}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {group.name || `Group ${group.id}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {group.id} • Created {new Date(group.created_at).toLocaleDateString()}
          </Typography>
        </Box>
        <IconButton sx={{ ml: 'auto' }} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              Group Information
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body2" fontWeight={600}>{group.name || 'Unnamed'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Chip
                    icon={getGroupTypeIcon(group.group_type)}
                    label={group.group_type === 'group_public' ? 'Public' : 'Private'}
                    size="small"
                    sx={{
                      bgcolor: alpha(getGroupTypeColor(group.group_type), 0.1),
                      color: getGroupTypeColor(group.group_type),
                      fontWeight: 600
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    label={getStatusLabel(group.is_active)}
                    color={getStatusColor(group.is_active)}
                    size="small"
                    sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Max Members</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {group.max_participants || 'Unlimited'}
                  </Typography>
                </Box>
                {group.description && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ bgcolor: '#F9FAFB', p: 1.5, borderRadius: 1 }}>
                      {group.description}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              Group Statistics
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Members</Typography>
                  <Typography variant="h6" sx={{ color: '#4F46E5', fontWeight: 700 }}>
                    {group.member_count || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Admins</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {group.admin_count || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Messages</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {group.message_count || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Last Activity</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {group.last_message_at ? new Date(group.last_message_at).toLocaleDateString() : 'No activity'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Creator Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              Created By
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar 
                  src={group.created_by?.avatar || ''}
                  sx={{ width: 56, height: 56 }}
                >
                  {group.created_by?.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{group.created_by?.username || 'Unknown'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {group.created_by?.email || 'No email'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {group.created_by?.id || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Location */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              Location
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={2}>
                {group.location ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {group.location}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center">
                    No location data available
                  </Typography>
                )}
                {group.website && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">Website:</Typography>
                    <Typography variant="body2" component="a" href={group.website} target="_blank">
                      {group.website}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                Tags
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {group.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{ bgcolor: '#EEF2FF', color: '#4F46E5' }}
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Join Settings */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              Join Settings
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">Requires Approval:</Typography>
                    <Chip 
                      label={group.requires_approval ? 'Yes' : 'No'}
                      size="small"
                      color={group.requires_approval ? 'warning' : 'success'}
                      sx={{ height: 24 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">Anyone Can Invite:</Typography>
                    <Chip 
                      label={group.can_anyone_invite ? 'Yes' : 'No'}
                      size="small"
                      color={group.can_anyone_invite ? 'success' : 'default'}
                      sx={{ height: 24 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button 
          variant="contained"
          onClick={() => {
            onClose();
            onEdit(group);
          }}
          sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
        >
          Edit Group
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupDetailsDialog;