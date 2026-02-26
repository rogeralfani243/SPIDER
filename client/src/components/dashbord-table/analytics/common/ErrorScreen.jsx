
import React from 'react';
import { Box, Alert, Button } from '@mui/material';

const ErrorScreen = ({ error, onRetry }) => (
  <Box sx={{ p: 3 }}>
    <Alert severity="error" sx={{ mb: 2 }}>
      {error}
    </Alert>
    <Button variant="contained" onClick={onRetry}>
      Retry
    </Button>
  </Box>
);

export default ErrorScreen;