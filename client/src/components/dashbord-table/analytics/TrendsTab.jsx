
import React from 'react';
import { Grid, Card, Typography, Box, IconButton, Tooltip, Chip } from '@mui/material';
import { SaveAlt, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import TrendChart from './TrendChart';
import ForecastCards from './ForecastCards';

const TrendsTab = ({ trends, chartRefs }) => {
  if (!trends) return null;

  const { 
    posts_trend, 
    comments_trend, 
    ratings_trend, 
    feedback_trend, 
    messages_trend, 
    forecast_next_30_days 
  } = trends;

  return (
    <Grid container spacing={3}>
      {/* Posts Trend */}
      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.trends}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" fontWeight="bold">
              Posts Trend
            </Typography>
            <Tooltip title="Download as PNG">
              <IconButton size="small">
                <SaveAlt />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ height: 250 }}>
            <TrendChart 
              data={posts_trend?.by_month} 
              dataKey="count" 
              color="#1976d2" 
              label="Posts" 
            />
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Typography variant="body2" color="text.secondary">
              Trend: {posts_trend?.direction === 'up' ? '📈' : '📉'} {posts_trend?.percentage}%
            </Typography>
            <Chip
              icon={posts_trend?.direction === 'up' ? <ArrowUpward /> : <ArrowDownward />}
              label={posts_trend?.direction === 'up' ? 'Up' : 'Down'}
              color={posts_trend?.direction === 'up' ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </Card>
      </Grid>

      {/* Comments Trend */}
      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Comments Trend
          </Typography>
          <Box sx={{ height: 250 }}>
            <TrendChart 
              data={comments_trend?.by_month} 
              dataKey="count" 
              color="#2e7d32" 
              label="Comments" 
            />
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Typography variant="body2" color="text.secondary">
              Trend: {comments_trend?.direction === 'up' ? '📈' : '📉'} {comments_trend?.percentage}%
            </Typography>
            <Chip
              icon={comments_trend?.direction === 'up' ? <ArrowUpward /> : <ArrowDownward />}
              label={comments_trend?.direction === 'up' ? 'Up' : 'Down'}
              color={comments_trend?.direction === 'up' ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </Card>
      </Grid>

      {/* Ratings Trend */}
      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Ratings Trend
          </Typography>
          <Box sx={{ height: 250 }}>
            <TrendChart 
              data={ratings_trend?.by_month} 
              dataKey="avg_rating" 
              color="#ed6c02" 
              label="Average Rating" 
              yMax={5}
            />
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Typography variant="body2" color="text.secondary">
              Trend: {ratings_trend?.direction === 'up' ? '📈' : '📉'} {ratings_trend?.percentage}%
            </Typography>
            <Chip
              icon={ratings_trend?.direction === 'up' ? <ArrowUpward /> : <ArrowDownward />}
              label={ratings_trend?.direction === 'up' ? 'Up' : 'Down'}
              color={ratings_trend?.direction === 'up' ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </Card>
      </Grid>

      {/* 30-Day Forecast */}
      <Grid item xs={12} md={6}>
        <ForecastCards forecast={forecast_next_30_days} />
      </Grid>
    </Grid>
  );
};

export default TrendsTab;