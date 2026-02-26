
import React from 'react';
import { Grid, Card, Typography, Box, LinearProgress } from '@mui/material';
import BadgesGrid from './BadgesGrid';
import PercentilesChart from './PercentilesChart';

const AchievementsTab = ({ profile, engagement }) => {
  if (!profile) return null;

  const { badges } = profile;
  const { percentiles } = engagement || {};

  return (
    <Grid container spacing={3}>
      {/* Badges Grid */}
      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Badges Earned
          </Typography>
          <BadgesGrid badges={badges} />
        </Card>
      </Grid>

      {/* Percentiles */}
      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Ranking
          </Typography>
          <PercentilesChart percentiles={percentiles} />
        </Card>
      </Grid>
    </Grid>
  );
};

export default AchievementsTab;