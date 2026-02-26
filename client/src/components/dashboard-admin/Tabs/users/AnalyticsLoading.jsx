import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Skeleton
} from '@mui/material';

const AnalyticsLoading = () => {
  return (
    <Box sx={{ width: '100%', p: 4 }}>
      <LinearProgress sx={{ mb: 4, borderRadius: 2, height: 6 }} />
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Skeleton variant="text" width="60%" height={30} />
                <Skeleton variant="text" width="40%" height={40} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 4 }}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
      </Box>
    </Box>
  );
};

export default AnalyticsLoading;