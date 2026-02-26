
import React from 'react';
import { Grid, Card, Typography, Box, Chip } from '@mui/material';
import CountUp from 'react-countup';

const ForecastCards = ({ forecast }) => {
  if (!forecast) return null;

  return (
    <Card elevation={2} sx={{ borderRadius: 3, p: 2, height: '100%' }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        30-Day Forecast
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Posts
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                <CountUp end={forecast.posts || 0} duration={2} />
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Comments
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                <CountUp end={forecast.comments || 0} duration={2} />
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Ratings
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                <CountUp end={forecast.ratings || 0} duration={2} />
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Feedback
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                <CountUp end={forecast.feedback || 0} duration={2} />
              </Typography>
            </Card>
          </Grid>
        </Grid>
        <Box mt={2}>
          <Chip
            label={`Confidence: ${forecast.confidence || 'medium'}`}
            color={forecast.confidence === 'high' ? 'success' : 
                   forecast.confidence === 'medium' ? 'warning' : 'default'}
            size="small"
          />
        </Box>
      </Box>
    </Card>
  );
};

export default ForecastCards;