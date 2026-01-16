// src/components/messaging/Groups/GroupAdminPanel/components/ErrorState.jsx
import React from 'react';
import { Container, Alert, Typography, Button } from '@mui/material';

const ErrorState = ({ error, onClose }) => {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Alert 
        severity="error"
        sx={{
          borderRadius: 2,
          p: 3,
        }}
        action={
          <Button color="inherit" size="small" onClick={onClose}>
            Back
          </Button>
        }
      >
        <Typography variant="h6" gutterBottom>
          Loading Error
        </Typography>
        <Typography>{error}</Typography>
      </Alert>
    </Container>
  );
};

export default ErrorState;