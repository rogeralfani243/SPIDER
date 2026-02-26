import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import { formatCompactNumber } from '../../../../utils/formatters.js';

const CommentsStatsCards = ({ stats }) => {
  if (!stats) return null;

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Total Comments
            </Typography>
            <Typography variant="h4">
              {formatCompactNumber(stats.total?.comments || 0)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatCompactNumber(stats.total?.root_comments || 0)} root • 
              {formatCompactNumber(stats.total?.replies || 0)} replies
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Today
            </Typography>
            <Typography variant="h4">
              {formatCompactNumber(stats.today || 0)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              new comments
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Hidden/Spam
            </Typography>
            <Typography variant="h4">
              {formatCompactNumber(stats.status?.hidden || 0)} / {formatCompactNumber(stats.status?.spam || 0)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatCompactNumber(stats.status?.pinned || 0)} pinned
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Media
            </Typography>
            <Typography variant="h4">
              {formatCompactNumber(stats.media?.images || 0)} / {formatCompactNumber(stats.media?.videos || 0)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatCompactNumber(stats.media?.files || 0)} files
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default CommentsStatsCards;