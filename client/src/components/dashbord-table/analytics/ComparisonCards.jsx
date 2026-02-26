import React from 'react';
import { Grid, Typography, Box, Chip } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

const ComparisonCards = ({ comparative }) => {
  if (!comparative?.vs_average) {
    return <Typography color="text.secondary">No comparison data available</Typography>;
  }

  const { vs_average } = comparative;

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Posts
        </Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="h5" fontWeight="bold" sx={{ mr: 1 }}>
            {vs_average.posts.percentage}%
          </Typography>
          {vs_average.posts.difference > 0 ? (
            <Chip size="small" icon={<ArrowUpward />} label="Above" color="success" />
          ) : (
            <Chip size="small" icon={<ArrowDownward />} label="Below" color="error" />
          )}
        </Box>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Ratings
        </Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="h5" fontWeight="bold" sx={{ mr: 1 }}>
            {vs_average.rating.percentage}%
          </Typography>
          {vs_average.rating.difference > 0 ? (
            <Chip size="small" icon={<ArrowUpward />} label="Above" color="success" />
          ) : (
            <Chip size="small" icon={<ArrowDownward />} label="Below" color="error" />
          )}
        </Box>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Comments
        </Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="h5" fontWeight="bold" sx={{ mr: 1 }}>
            {vs_average.comments.percentage}%
          </Typography>
          {vs_average.comments.difference > 0 ? (
            <Chip size="small" icon={<ArrowUpward />} label="Above" color="success" />
          ) : (
            <Chip size="small" icon={<ArrowDownward />} label="Below" color="error" />
          )}
        </Box>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Feedback
        </Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="h5" fontWeight="bold" sx={{ mr: 1 }}>
            {vs_average.feedback.percentage}%
          </Typography>
          {vs_average.feedback.difference > 0 ? (
            <Chip size="small" icon={<ArrowUpward />} label="Above" color="success" />
          ) : (
            <Chip size="small" icon={<ArrowDownward />} label="Below" color="error" />
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

export default ComparisonCards;