
import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

const LoadingScreen = () => (
  <Box sx={{ p: 3 }}>
    <LinearProgress />
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Typography variant="h6" color="text.secondary">
        Loading analytics data...
      </Typography>
    </Box>
  </Box>
);

export default LoadingScreen;