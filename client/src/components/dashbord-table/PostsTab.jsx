// frontend/src/pages/dashboard/components/posts/PostsTab.jsx
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
  Avatar
} from '@mui/material';
import {
  SaveAlt,
  TableChart,
  TrendingUp,
  Comment,
  Star,
  CalendarToday
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { Pie, Doughnut } from 'react-chartjs-2';
import { downloadChartAsPNG, downloadTableAsCSV } from './analytics/downloadHelpers';

const PostsTab = ({ posts, chartRefs }) => {
  if (!posts) return null;

  const { overview, by_category, by_tag, top_posts } = posts;

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Posts',
      value: overview?.total_posts || 0,
      icon: <TrendingUp />,
      color: '#1976d2',
      bgColor: '#1976d220',
      details: `${overview?.posts_this_week || 0} this week`
    },
    {
      title: 'This Month',
      value: overview?.posts_this_month || 0,
      icon: <CalendarToday />,
      color: '#2e7d32',
      bgColor: '#2e7d3220',
      details: `${overview?.posts_this_year || 0} this year`
    },
    {
      title: 'Total Comments',
      value: top_posts?.reduce((sum, post) => sum + (post.comments_count_annotated || 0), 0) || 0,
      icon: <Comment />,
      color: '#ed6c02',
      bgColor: '#ed6c0220',
      details: `Across all posts`
    },
    {
      title: 'Total Ratings',
      value: top_posts?.reduce((sum, post) => sum + (post.ratings_count_annotated || 0), 0) || 0,
      icon: <Star />,
      color: '#9c27b0',
      bgColor: '#9c27b020',
      details: `${overview?.percentage_of_total?.toFixed(1) || 0}% of platform`
    }
  ];

  // Chart data for categories
  const categoryChartData = {
    labels: by_category?.map(c => c.category__name) || [],
    datasets: [{
      data: by_category?.map(c => c.count) || [],
      backgroundColor: ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#00796b', '#d32f2f'],
      borderWidth: 0
    }]
  };

  // Chart data for tags
  const tagChartData = {
    labels: by_tag?.map(t => t.tags__name) || [],
    datasets: [{
      data: by_tag?.map(t => t.count) || [],
      backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
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
                      <Typography variant="h4" fontWeight="bold">
                        <CountUp end={stat.value} duration={2} />
                      </Typography>
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

      {/* Posts by Category Chart */}
      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.categories}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Posts by Category
            </Typography>
            <Tooltip title="Download as PNG">
              <IconButton 
                size="small" 
                onClick={() => downloadChartAsPNG(chartRefs.categories, 'post_categories')}
              >
                <SaveAlt />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ height: 300 }}>
            {by_category && by_category.length > 0 ? (
              <Pie data={categoryChartData} options={chartOptions} />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="text.secondary">No category data available</Typography>
              </Box>
            )}
          </Box>
        </Card>
      </Grid>

      {/* Most Used Tags Chart */}
      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.tags}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Most Used Tags
            </Typography>
            <Tooltip title="Download as PNG">
              <IconButton 
                size="small" 
                onClick={() => downloadChartAsPNG(chartRefs.tags, 'post_tags')}
              >
                <SaveAlt />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ height: 300 }}>
            {by_tag && by_tag.length > 0 ? (
              <Doughnut data={tagChartData} options={chartOptions} />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="text.secondary">No tag data available</Typography>
              </Box>
            )}
          </Box>
        </Card>
      </Grid>

      {/* Top Posts Table */}
      <Grid item xs={12}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Top Performing Posts
            </Typography>
            <Tooltip title="Download as CSV">
              <IconButton 
                size="small" 
                onClick={() => downloadTableAsCSV(top_posts, 'top_posts')}
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
                  <TableCell align="center">Comments</TableCell>
                  <TableCell align="center">Ratings</TableCell>
                  <TableCell align="center">Average Rating</TableCell>
                  <TableCell align="center">Engagement Score</TableCell>
                  <TableCell align="center">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {top_posts && top_posts.length > 0 ? (
                  top_posts.map((post) => (
                    <TableRow key={post.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {post.title?.length > 50 
                            ? post.title.substring(0, 50) + '...' 
                            : post.title || 'Untitled'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={post.comments_count_annotated || 0}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={post.ratings_count_annotated || 0}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center">
                          <MuiRating 
                            value={post.avg_rating_annotated || 0} 
                            precision={0.1} 
                            readOnly 
                            size="small" 
                          />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            ({post.avg_rating_annotated?.toFixed(1) || '0.0'})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={post.engagement_score?.toFixed(0) || 0}
                          size="small"
                          color={post.engagement_score > 50 ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption">
                          {post.created_at ? format(parseISO(post.created_at), 'dd/MM/yyyy') : 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" py={3}>
                        No posts available
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

export default PostsTab;