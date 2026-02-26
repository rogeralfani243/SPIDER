// frontend/src/pages/dashboard/components/comments/CommentsTab.jsx
import React from 'react';
import { Grid, Card, CardContent, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { SaveAlt, TrendingUp, TrendingDown } from '@mui/icons-material';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

// Charts
import CommentsByDayChart from './CommentsByDayChart';
import CommentsByWeekChart from './CommentsByWeekChart';
import CommentsByMonthChart from './CommentsByMonthChart';
import CommentsByCountryChart from './CommentsByCountryChart';
import CommentsByCityChart from './CommentsByCityChart';
import CommentsSentimentChart from './CommentsSentimentChart';
import TopCommentersTable from './TopCommentersTable';
import { downloadChartAsPNG } from '../downloadHelpers';
const CommentsTab = ({ comments, chartRefs }) => {
  if (!comments) return null;

  const { 
    overview, 
    by_day, 
    by_week, 
    by_month, 
    by_country, 
    by_city, 
    top_commenters,
    sentiment_analysis 
  } = comments;

  const handleDownloadChart = async (chartRef, filename) => {
    try {
      await downloadChartAsPNG(chartRef, filename);
    } catch (error) {
      console.error('Error downloading chart:', error);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card sx={{ borderRadius: 3, p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Comments Received
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  <CountUp end={overview?.total_comments_received || 0} duration={2} />
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                  <Typography variant="body2" color="success.main">
                    {overview?.comments_this_month || 0} this month
                  </Typography>
                </Box>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card sx={{ borderRadius: 3, p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Unique Commenters
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  <CountUp end={overview?.unique_commenters || 0} duration={2} />
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Avg {overview?.avg_comments_per_post?.toFixed(1)} per post
                </Typography>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card sx={{ borderRadius: 3, p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Sentiment Score
                </Typography>
                <Box display="flex" alignItems="baseline">
                  <Typography variant="h3" fontWeight="bold" sx={{ mr: 1 }}>
                    <CountUp end={sentiment_analysis?.sentiment_score || 0} duration={2} />
                  </Typography>
                  <Typography variant="body2">/100</Typography>
                </Box>
                <Box display="flex" alignItems="center" mt={1}>
                  {sentiment_analysis?.sentiment_score > 50 ? (
                    <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {sentiment_analysis?.positive_percentage || 0}% positive
                  </Typography>
                </Box>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3} sx={{display:'none'}}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card sx={{ borderRadius: 3, p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Comments Distribution
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      👍 {sentiment_analysis?.positive || 0}
                    </Typography>
                    <Typography variant="caption">Positive</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="warning.main">
                      😐 {sentiment_analysis?.neutral || 0}
                    </Typography>
                    <Typography variant="caption">Neutral</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="error.main">
                      👎 {sentiment_analysis?.negative || 0}
                    </Typography>
                    <Typography variant="caption">Negative</Typography>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Grid>

      {/* Comments by Day Chart */}
      <Grid item xs={12} lg={6}>
        <Card sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.commentsByDay}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Comments by Day (30 days)
            </Typography>
            <Tooltip title="Download as PNG">
              <IconButton size="small" onClick={() => handleDownloadChart(chartRefs.commentsByDay, 'comments_by_day')}>
                <SaveAlt />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ height: 300 }}>
            <CommentsByDayChart data={by_day} />
          </Box>
        </Card>
      </Grid>

      {/* Comments by Week Chart */}
      <Grid item xs={12} lg={6}>
        <Card sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.commentsByWeek}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Comments by Week (12 weeks)
            </Typography>
            <Tooltip title="Download as PNG">
              <IconButton size="small" onClick={() => handleDownloadChart(chartRefs.commentsByWeek, 'comments_by_week')}>
                <SaveAlt />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ height: 300 }}>
            <CommentsByWeekChart data={by_week} />
          </Box>
        </Card>
      </Grid>

      {/* Comments by Month Chart */}
      <Grid item xs={12} lg={6}>
        <Card sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.commentsByMonth}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Comments by Month
            </Typography>
            <Tooltip title="Download as PNG">
              <IconButton size="small" onClick={() => handleDownloadChart(chartRefs.commentsByMonth, 'comments_by_month')}>
                <SaveAlt />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ height: 300 }}>
            <CommentsByMonthChart data={by_month} />
          </Box>
        </Card>
      </Grid>

      {/* Comments Sentiment Chart */}
      <Grid item xs={12} lg={6}>
        <Card sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.comments}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Comment Sentiment Analysis
            </Typography>
            <Tooltip title="Download as PNG">
              <IconButton size="small" onClick={() => handleDownloadChart(chartRefs.comments, 'comments_sentiment_analysis')}>
                <SaveAlt />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ height: 300 }}>
            <CommentsSentimentChart data={sentiment_analysis} />
          </Box>
        </Card>
      </Grid>

      {/* Comments by Country Chart */}
      <Grid item xs={12} lg={6}>
        <Card sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.commentsByCountry}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold" >
              Comments by Country
            </Typography>
            <Tooltip title="Download as PNG">
              <IconButton size="small" onClick={() => handleDownloadChart(chartRefs.commentsByCountry, 'comments_by_country')}>
                <SaveAlt />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ height: 300 }}>
            <CommentsByCountryChart data={by_country} />
          </Box>
        </Card>
      </Grid>

      {/* Comments by City Chart */}
      <Grid item xs={12} lg={6}>
        <Card sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.commentsByCity}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Comments by City
            </Typography>
            <Tooltip title="Download as PNG">
              <IconButton size="small" onClick={() => handleDownloadChart(chartRefs.commentsByCity, 'comments_by_city')}>
                <SaveAlt />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ height: 300 }}>
            <CommentsByCityChart data={by_city} />
          </Box>
        </Card>
      </Grid>

      {/* Top Commenters Table */}
      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Top Commenters
          </Typography>
          <TopCommentersTable data={top_commenters} />
        </Card>
      </Grid>
    </Grid>
  );
};

export default CommentsTab;