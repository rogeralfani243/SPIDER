
import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

const PercentilesChart = ({ percentiles }) => {
  if (!percentiles) return null;

  return (
    <Box sx={{ mt: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="body1">Posts</Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>
            {percentiles.posts}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            percentile
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentiles.posts || 0}
        sx={{ height: 10, borderRadius: 5, mb: 3 }}
      />
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="body1">Ratings</Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>
            {percentiles.rating}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            percentile
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentiles.rating || 0}
        sx={{ height: 10, borderRadius: 5, mb: 3 }}
      />
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="body1">Feedback</Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>
            {percentiles.feedback}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            percentile
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentiles.feedback || 0}
        sx={{ height: 10, borderRadius: 5, mb: 3 }}
      />
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="body1">Overall</Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>
            {percentiles.overall}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            percentile
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentiles.overall || 0}
        sx={{ height: 10, borderRadius: 5 }}
      />
    </Box>
  );
};

export default PercentilesChart;