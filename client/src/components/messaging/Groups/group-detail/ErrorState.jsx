// src/components/groups/ErrorState.jsx
import React from 'react';
import {
  Container,
  Alert,
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  Groups as GroupsIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import DashboardMain from '../../../dashboard_main';
const ErrorState = ({ error, accessDenied, navigate }) => (
  <>
  <DashboardMain />
  <Container maxWidth="lg" sx={{ py: 4 }}>
    {accessDenied ? (
      <Alert 
        severity="warning" 
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" onClick={() => navigate('/groups/explore')}>
            Browse Public Groups
          </Button>
        }
      >
        <Typography variant="body1" gutterBottom>
          This group is private or you don't have permission to view it.
        </Typography>
      </Alert>
    ) : (
      <Alert 
        severity="error" 
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" onClick={() => navigate('/groups/explore')}>
            Browse Groups
          </Button>
        }
      >
        {error || 'Group not found'}
      </Alert>
    )}
    
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <GroupsIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
      <Typography variant="h5" gutterBottom>
        {accessDenied ? 'Access Denied' : 'Group Not Available'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
        {accessDenied 
          ? 'This group may be private, or you may not have permission to view it.'
          : 'This group may have been deleted, set to private, or you may not have permission to view it.'
        }
      </Typography>
      <Button
        variant="contained"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/groups/')}
      >
        Explore Other Groups
      </Button>
    </Box>
  </Container>
  </>
);

export default ErrorState;