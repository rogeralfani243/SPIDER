// src/components/groups/GroupInfoSidebar.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Avatar,
  Divider,
  Link,
} from '@mui/material';
import {
  Language as WebsiteIcon,
  Rule as RuleIcon,
  CalendarToday as CalendarIcon,
  Message as MessageIcon,
} from '@mui/icons-material';

const GroupInfoSidebar = ({ group, onContactAdmin }) => {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          GROUP INFO
        </Typography>
        
        {group.website && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WebsiteIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" noWrap>
              <Link 
                href={group.website} 
                target="_blank" 
                rel="noopener noreferrer"
                color="inherit"
                underline="hover"
              >
                {group.website.replace(/^https?:\/\//, '')}
              </Link>
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <RuleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2">
            {group.requires_approval ? 'Approval required to join' : 'Open membership'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2">
            Created {new Date(group.created_at).toLocaleDateString()}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={group.created_by?.profile_image} 
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            {group.created_by?.username?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              Created by {group.created_by?.username || 'Unknown'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {group.created_by?.email || ''}
            </Typography>
          </Box>
        </Box>
        
        {/* Contact Admin Button */}
        {group.group_type === 'group_public' && group.created_by?.id && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<MessageIcon />}
            onClick={onContactAdmin}
            sx={{ mt: 2 }}
          >
            Contact Admin
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupInfoSidebar;