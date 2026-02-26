// frontend/src/pages/dashboard/components/ratings/RatingsTab.jsx
import React from 'react';
import {
  Grid,
  Card,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Rating as MuiRating,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  SaveAlt,
  TableChart,
  TrendingUp,
  TrendingDown,
  Remove,
  Star,
  StarBorder,
  ShowChart
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { Doughnut, Line } from 'react-chartjs-2';
import { downloadChartAsPNG, downloadTableAsCSV } from './analytics/downloadHelpers';

const RatingsTab = ({ ratings, chartRefs }) => {
  if (!ratings) return null;

  const { overview, distribution, top_rated_posts, trend } = ratings;

  // Stats cards
  const statsCards = [
    {
      title: 'Total Ratings',
      value: overview?.total_ratings_received || 0,
      icon: <Star />,
      color: '#ed6c02',
      bgColor: '#ed6c0220',
      details: `${overview?.unique_raters || 0} unique raters`
    },
    {
      title: 'Average Rating',
      value: overview?.average_rating || 0,
      icon: <StarBorder />,
      color: '#ffb400',
      bgColor: '#ffb40020',
      isDecimal: true,
      suffix: '/5',
      details: `Median: ${overview?.median_rating?.toFixed(1) || 0}`
    },
    {
      title: 'Mode',
      value: overview?.mode_rating || 0,
      icon: <Star />,
      color: '#4caf50',
      bgColor: '#4caf5020',
      suffix: '⭐',
      details: `Most common rating`
    },
    {
      title: 'Std Deviation',
      value: overview?.standard_deviation || 0,
      icon: <ShowChart />,
      color: '#9c27b0',
      bgColor: '#9c27b020',
      isDecimal: true,
      details: `Spread of ratings`
    }
  ];

  // Distribution chart data
  const distributionData = {
    labels: ['5 stars', '4 stars', '3 stars', '2 stars', '1 star'],
    datasets: [{
      data: [
        distribution?.['5_stars'] || 0,
        distribution?.['4_stars'] || 0,
        distribution?.['3_stars'] || 0,
        distribution?.['2_stars'] || 0,
        distribution?.['1_star'] || 0
      ],
      backgroundColor: ['#4caf50', '#8bc34a', '#ffc107', '#ff9800', '#f44336'],
      borderWidth: 0
    }]
  };

  // Trend chart data
  const trendData = {
    labels: trend?.by_week?.map(w => format(parseISO(w.week), 'dd/MM')) || [],
    datasets: [{
      label: 'Average Rating',
      data: trend?.by_week?.map(w => w.avg_rating) || [],
      borderColor: '#ed6c02',
      backgroundColor: '#ed6c0220',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#ed6c02'
    }]
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        max: 5,
        grid: { color: '#f0f0f0' }
      }
    }
  };

  const distributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      datalabels: {
        formatter: (value, ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${percentage}%`;
        }
      }
    }
  };

  // Calculate total for percentages
  const totalRatings = Object.values(distribution || {}).reduce((sum, val) => sum + (val || 0), 0);

  return (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          {statsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card sx={{ borderRadius: 3, p: 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {stat.title}
                      </Typography>
                      <Box display="flex" alignItems="baseline">
                        <Typography variant="h4" fontWeight="bold">
                          <CountUp 
                            end={stat.value} 
                            duration={2} 
                            decimals={stat.isDecimal ? 1 : 0} 
                          />
                        </Typography>
                        {stat.suffix && (
                          <Typography variant="h6" sx={{ ml: 0.5 }}>
                            {stat.suffix}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Avatar sx={{ bgcolor: stat.bgColor, color: stat.color }}>
                      {stat.icon}
                    </Avatar>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {stat.details}
                  </Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* Star Distribution Chart */}
      <Grid item xs={12} md={4}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2, height: '100%' }} ref={chartRefs.ratings}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" fontWeight="bold">
              Star Distribution
            </Typography>
            <Tooltip title="Download as PNG">
              <IconButton 
                size="small" 
                onClick={() => downloadChartAsPNG(chartRefs.ratings, 'rating_distribution')}
              >
                <SaveAlt />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ height: 250 }}>
            {totalRatings > 0 ? (
              <Doughnut data={distributionData} options={distributionOptions} />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="text.secondary">No ratings yet</Typography>
              </Box>
            )}
          </Box>
        </Card>
      </Grid>

      {/* Statistics Card */}
      <Grid item xs={12} md={4}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2, height: '100%' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Rating Statistics
          </Typography>
          <Box sx={{ mt: 2 }}>
            {/* Distribution bars */}
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution?.[`${stars}_stars`] || 0;
              const percentage = totalRatings > 0 ? (count / totalRatings * 100) : 0;
              
              return (
                <Box key={stars} sx={{ mb: 1.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {stars} ★
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({count})
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {percentage.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: stars === 5 ? '#4caf50' :
                                stars === 4 ? '#8bc34a' :
                                stars === 3 ? '#ffc107' :
                                stars === 2 ? '#ff9800' : '#f44336'
                      }
                    }}
                  />
                </Box>
              );
            })}

            <Box sx={{ mt: 3 }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Total Ratings
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {totalRatings}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Average
                </Typography>
                <Box display="flex" alignItems="center">
                  <Typography variant="body1" fontWeight="bold" sx={{ mr: 0.5 }}>
                    {overview?.average_rating?.toFixed(1)}
                  </Typography>
                  <Star sx={{ fontSize: 16, color: '#ffb400' }} />
                </Box>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Trend
                </Typography>
                <Chip
                  icon={
                    trend?.direction === 'up' ? <TrendingUp /> : 
                    trend?.direction === 'down' ? <TrendingDown /> : <Remove />
                  }
                  label={
                    trend?.direction === 'up' ? 'Up' : 
                    trend?.direction === 'down' ? 'Down' : 'Stable'
                  }
                  color={
                    trend?.direction === 'up' ? 'success' : 
                    trend?.direction === 'down' ? 'error' : 'default'
                  }
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        </Card>
      </Grid>

      {/* Trend Chart */}
      <Grid item xs={12} md={4}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2, height: '100%' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Rating Evolution
          </Typography>
          <Box sx={{ height: 250 }}>
            {trend?.by_week && trend.by_week.length > 0 ? (
              <Line data={trendData} options={trendOptions} />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="text.secondary">No trend data available</Typography>
              </Box>
            )}
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
            <Typography variant="caption" color="text.secondary">
              Weekly average • {trend?.by_week?.length || 0} weeks
            </Typography>
            <Typography variant="caption" fontWeight="bold">
              Change: {trend?.percentage?.toFixed(1) || 0}%
            </Typography>
          </Box>
        </Card>
      </Grid>

      {/* Top Rated Posts Table */}
      <Grid item xs={12}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Top Rated Posts
            </Typography>
            <Tooltip title="Download as CSV">
              <IconButton 
                size="small" 
                onClick={() => downloadTableAsCSV(top_rated_posts, 'top_rated_posts')}
              >
                <TableChart />
              </IconButton>
            </Tooltip>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell align="center">Rating</TableCell>
                  <TableCell align="center">Number of Ratings</TableCell>
                  <TableCell align="center">Performance</TableCell>
                  <TableCell align="right">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {top_rated_posts && top_rated_posts.length > 0 ? (
                  top_rated_posts.map((post) => (
                    <TableRow key={post.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {post.title?.length > 50 
                            ? post.title.substring(0, 50) + '...' 
                            : post.title || 'Untitled'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center">
                          <MuiRating 
                            value={post.avg_rating || 0} 
                            precision={0.1} 
                            readOnly 
                            size="small" 
                          />
                          <Typography 
                            variant="body2" 
                            sx={{ ml: 1, fontWeight: 'bold' }}
                          >
                            {post.avg_rating?.toFixed(1) || '0.0'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={post.rating_count || 0}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {post.avg_rating >= 4.5 ? (
                          <Chip label="Excellent" size="small" color="success" />
                        ) : post.avg_rating >= 4.0 ? (
                          <Chip label="Good" size="small" color="info" />
                        ) : post.avg_rating >= 3.0 ? (
                          <Chip label="Average" size="small" color="default" />
                        ) : (
                          <Chip label="Needs Work" size="small" color="error" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption">
                          {post.created_at ? format(parseISO(post.created_at), 'dd/MM/yyyy') : 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary" py={3}>
                        No rated posts available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  );
};

export default RatingsTab;