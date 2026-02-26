// frontend/src/pages/dashboard/components/StatsCards.jsx
import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Avatar, Chip } from '@mui/material';
import {
  TrendingUp, TrendingDown, PostAdd, Comment, Star,
  Feedback, Groups, Chat, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const StatsCards = ({ posts, comments, ratings, feedback, groups, messaging, reports }) => {
  const stats = [
    {
      title: 'Posts',
      value: posts?.overview?.total_posts || 0,
      change: posts?.overview?.posts_this_month || 0,
      icon: <PostAdd />,
      color: '#1976d2',
      bgColor: '#1976d220',
      details: `${posts?.overview?.posts_this_week || 0} this week`
    },
    {
      title: 'Comments Received',
      value: comments?.overview?.total_comments_received || 0,
      change: comments?.overview?.comments_this_month || 0,
      icon: <Comment />,
      color: '#2e7d32',
      bgColor: '#2e7d3220',
      details: `${comments?.overview?.unique_commenters || 0} commenters`
    },
    {
      title: 'Ratings',
      value: ratings?.overview?.total_ratings_received || 0,
      change: ratings?.overview?.average_rating || 0,
      icon: <Star />,
      color: '#ed6c02',
      bgColor: '#ed6c0220',
      details: `${ratings?.overview?.unique_raters || 0} raters`,
      isRating: true
    },
    {
      title: 'Feedback',
      value: feedback?.overview?.total_feedback_received || 0,
      change: feedback?.overview?.positive_percentage || 0,
      icon: <Feedback />,
      color: '#9c27b0',
      bgColor: '#9c27b020',
      details: `${feedback?.overview?.positive_feedback || 0} positive`,
      isPercentage: true
    },
    {
      title: 'Groups',
      value: groups?.overview?.total_groups || 0,
      change: groups?.overview?.groups_as_admin || 0,
      icon: <Groups />,
      color: '#00796b',
      bgColor: '#00796b20',
      details: `${groups?.overview?.groups_as_admin || 0} as admin`
    },
    {
      title: 'Messages',
      value: messaging?.overview?.total_messages_sent || 0,
      change: messaging?.overview?.messages_this_month || 0,
      icon: <Chat />,
      color: '#d32f2f',
      bgColor: '#d32f2f20',
      details: `${messaging?.overview?.unread_messages || 0} unread`
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Avatar sx={{ bgcolor: stat.bgColor, color: stat.color }}>
                    {stat.icon}
                  </Avatar>
                  <Chip
                    size="small"
                    icon={stat.change > 0 ? <ArrowUpward /> : <ArrowDownward />}
                    label={stat.isRating ? stat.change.toFixed(1) : 
                           stat.isPercentage ? `${stat.change}%` : 
                           `+${stat.change}`}
                    color={stat.change > 0 ? 'success' : 'error'}
                    sx={{ height: 24 }}
                  />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {stat.isRating ? (
                    <Box display="flex" alignItems="center">
                      <CountUp end={stat.value} duration={2} decimals={1} />
                      <Star sx={{ fontSize: 20, ml: 0.5, color: '#ffb400' }} />
                    </Box>
                  ) : (
                    <CountUp end={stat.value} duration={2} />
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {stat.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.details}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsCards;