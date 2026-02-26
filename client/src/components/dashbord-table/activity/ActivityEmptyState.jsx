// src/components/dashbord-table/activity/ActivityEmptyState.jsx
import React from 'react';
import {
  Box,
  Typography
} from '@mui/material';
import {
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';

const ActivityEmptyState = () => {
  return (
    <Box 
      sx={{ 
        p: 4, 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'rgba(229, 70, 70, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgb(229, 70, 70)',
          mb: 1
        }}
      >
        <NotificationsOffIcon sx={{ fontSize: 40 }} />
      </Box>
      <Typography variant="h6" fontWeight={600} color="text.primary">
        No recent activity
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
        Start posting or commenting to see your activities here!
      </Typography>
    </Box>
  );
};

export default ActivityEmptyState;