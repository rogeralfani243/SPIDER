// src/components/groups/LoadingState.jsx
import React from 'react';
import {
  Container,
  Box,
  Skeleton,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';

const LoadingState = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Box sx={{ mb: 3 }}>
      <Skeleton variant="text" width={200} height={40} />
    </Box>
    
    <Card sx={{ mb: 3 }}>
      <Skeleton variant="rectangular" height={300} />
      <CardContent>
        <Skeleton variant="text" height={60} />
        <Skeleton variant="text" height={20} width="80%" />
        <Skeleton variant="text" height={20} width="60%" />
      </CardContent>
    </Card>
    
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress />
    </Box>
  </Container>
);

export default LoadingState;