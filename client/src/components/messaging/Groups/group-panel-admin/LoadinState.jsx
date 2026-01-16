// src/components/messaging/Groups/GroupAdminPanel/components/LoadingState.jsx
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingState = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" sx={{ mt: 3, fontWeight: 500, color: 'text.secondary' }}>
        Loading administration panel...
      </Typography>
    </Box>
  );
};

export default LoadingState;