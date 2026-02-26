// src/components/activity/ActivityHeader.jsx
import React from 'react';
import {
  Box,
  Typography,
  Button,
  alpha
} from '@mui/material';
import {
  MarkEmailRead as MarkReadIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const ActivityHeader = ({ unreadActivitiesCount, onMarkAllAsRead }) => {
  return (
    <Box 
      sx={{ 
        mb: 4,
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 2
      }}
    >
      {/* Left Section - Title & Status */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box
            sx={{
              width: 4,
              height: 24,
              background: 'linear-gradient(180deg, #e54646ff 0%, #f88181ff 100%)',
              borderRadius: 4,
            }}
          />
          <Typography 
            variant="h6" 
            fontWeight={700} 
            sx={{ 
              color: '#0F172A',
              letterSpacing: '-0.01em',
              fontSize: '1.1rem'
            }}
          >
            Activity Feed
          </Typography>
          <Box
            sx={{
              px: 1,
              py: 0.3,
              bgcolor: alpha('#e54646ff', 0.08),
              borderRadius: 1,
              color: '#e54646ff',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Live
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1,
              color: unreadActivitiesCount > 0 ? '#EF4444' : '#10B981'
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'currentColor',
                opacity: 0.8
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              {unreadActivitiesCount > 0 ? (
                <>{unreadActivitiesCount} unread {unreadActivitiesCount === 1 ? 'activity' : 'activities'}</>
              ) : (
                'All caught up'
              )}
            </Typography>
          </Box>
          
          {unreadActivitiesCount > 0 && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              • Last update {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Right Section - Actions */}
      {unreadActivitiesCount > 0 && (
        <Button
          size="small"
          startIcon={<MarkReadIcon sx={{ fontSize: 16 }} />}
          onClick={onMarkAllAsRead}
          sx={{
            color: '#e54646ff',
            fontWeight: 600,
            fontSize: '0.8rem',
            py: 0.6,
            px: 1.5,
            borderRadius: 1.5,
            bgcolor: alpha('#e54646ff', 0.04),
            border: '1px solid',
            borderColor: alpha('#e54646ff', 0.2),
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: alpha('#e54646ff', 0.08),
              borderColor: alpha('#e54646ff', 0.4),
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 10px rgba(229, 115, 70, 0.1)'
            }
          }}
        >
          Mark all read
        </Button>
      )}
    </Box>
  );
};

ActivityHeader.propTypes = {
  unreadActivitiesCount: PropTypes.number.isRequired,
  onMarkAllAsRead: PropTypes.func.isRequired
};

export default ActivityHeader;