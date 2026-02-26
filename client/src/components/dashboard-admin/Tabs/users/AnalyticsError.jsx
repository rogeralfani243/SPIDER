import React from 'react';
import {
  Box,
  Alert,
  Button
} from '@mui/material';

const AnalyticsError = ({ error, onRetry }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Alert 
        severity="error" 
        variant="filled"
        sx={{ borderRadius: 2 }}
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    </Box>
  );
};

export default AnalyticsError;