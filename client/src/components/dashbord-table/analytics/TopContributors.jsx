
import React from 'react';
import { Box, Typography, Avatar, Chip } from '@mui/material';

const TopContributors = ({ worldMapData }) => {
  if (!worldMapData || worldMapData.length === 0) {
    return <Typography color="text.secondary">No data available</Typography>;
  }

  return (
    <Box sx={{ mt: 2, flex: 1, overflow: 'auto' }}>
      {worldMapData.slice(0, 15).map((country, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            borderBottom: '1px solid #f0f0f0',
            '&:hover': { bgcolor: '#f5f5f5' }
          }}
        >
          <Box display="flex" alignItems="center">
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2', mr: 1.5 }}>
              {country.country?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {country.country}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {country.details.comments} comments, {country.details.ratings} ratings
              </Typography>
            </Box>
          </Box>
          <Chip label={country.value} size="small" color="primary" />
        </Box>
      ))}
    </Box>
  );
};

export default TopContributors;