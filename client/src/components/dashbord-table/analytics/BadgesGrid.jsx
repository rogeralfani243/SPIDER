
import React from 'react';
import { Grid, Card, Typography, Box } from '@mui/material';

const BadgesGrid = ({ badges }) => {
  if (!badges || badges.length === 0) {
    return <Typography color="text.secondary">No badges earned yet</Typography>;
  }

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {badges.map((badge, index) => (
        <Grid item xs={12} sm={6} key={index}>
          <Card
            variant="outlined"
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              borderLeft: `4px solid ${
                badge.level === 'gold' ? '#ffd700' :
                badge.level === 'silver' ? '#c0c0c0' :
                badge.level === 'bronze' ? '#cd7f32' : '#2196f3'
              }`
            }}
          >
            <Typography variant="h3" sx={{ mr: 2 }}>
              {badge.icon}
            </Typography>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {badge.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Level {badge.level}
              </Typography>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default BadgesGrid;