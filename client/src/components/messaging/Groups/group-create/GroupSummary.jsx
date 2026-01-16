import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Group as GroupIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

/**
 * Group Summary Component
 * Displays a preview of the group being created
 */
const GroupSummary = ({
  formData,
  categories,
  photoPreview,
}) => {
  return (
    <Card variant="outlined" sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Group Preview
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={photoPreview}
            sx={{ width: 60, height: 60, mr: 2 }}
          >
            <GroupIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1">
              {formData.name || 'Unnamed Group'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formData.group_type === 'group_public' ? 'Public Group' : 'Private Group'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {formData.category_id && (
            <Chip
              label={categories.find(c => c.id === formData.category_id)?.name || 'Category'}
              size="small"
              icon={<CategoryIcon />}
            />
          )}
          
          <Chip
            label={`${formData.max_participants} max members`}
            size="small"
            icon={<PeopleIcon />}
          />
          
          {formData.requires_approval && (
            <Chip
              label="Approval required"
              size="small"
              color="warning"
            />
          )}
        </Box>
        
        {formData.description && (
          <Typography variant="body2" color="text.secondary">
            {formData.description.substring(0, 150)}
            {formData.description.length > 150 ? '...' : ''}
          </Typography>
        )}
        
        {/* Display selected users in summary */}
        {formData.selectedUsers.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Members ({formData.selectedUsers.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.selectedUsers.slice(0, 5).map((user) => (
                <Chip
                  key={user.id}
                  label={user.username}
                  size="small"
                  avatar={
                    <Avatar
                      src={user.profile_image}
                      sx={{ width: 20, height: 20 }}
                    >
                      {!user.profile_image && <PersonIcon fontSize="small" />}
                    </Avatar>
                  }
                />
              ))}
              {formData.selectedUsers.length > 5 && (
                <Chip
                  label={`+${formData.selectedUsers.length - 5} more`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupSummary;