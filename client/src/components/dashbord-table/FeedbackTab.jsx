
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
  ThumbUp,
  ThumbDown,
  SentimentSatisfied,
  SentimentDissatisfied,
  SentimentVerySatisfied,
  Person
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { PolarArea } from 'react-chartjs-2';
import { downloadChartAsPNG, downloadTableAsCSV } from './analytics/downloadHelpers'

const FeedbackTab = ({ feedback, chartRefs }) => {
  if (!feedback) return null;

  const { overview, distribution, common_keywords, recent_feedback } = feedback;

  // Stats cards
  const statsCards = [
    {
      title: 'Total Feedback',
      value: overview?.total_feedback_received || 0,
      icon: <SentimentSatisfied />,
      color: '#9c27b0',
      bgColor: '#9c27b020',
      details: `${overview?.unique_feedback_givers || 0} unique givers`
    },
    {
      title: 'Average Rating',
      value: overview?.average_rating || 0,
      icon: <ThumbUp />,
      color: '#4caf50',
      bgColor: '#4caf5020',
      isDecimal: true,
      suffix: '/5',
      details: `This month: ${overview?.average_rating_this_month?.toFixed(1) || 0}`
    },
    {
      title: 'Positive Rate',
      value: overview?.positive_percentage || 0,
      icon: <SentimentVerySatisfied />,
      color: '#2e7d32',
      bgColor: '#2e7d3220',
      suffix: '%',
      details: `${overview?.positive_feedback || 0} positive reviews`
    },
    {
      title: 'Negative',
      value: overview?.negative_feedback || 0,
      icon: <SentimentDissatisfied />,
      color: '#d32f2f',
      bgColor: '#d32f2f20',
      details: `${overview?.neutral_feedback || 0} neutral`
    }
  ];

  // Distribution chart data
  const distributionData = {
    labels: ['5 ⭐', '4 ⭐', '3 ⭐', '2 ⭐', '1 ⭐'],
    datasets: [{
      data: [
        distribution?.['5_stars'] || 0,
        distribution?.['4_stars'] || 0,
        distribution?.['3_stars'] || 0,
        distribution?.['2_stars'] || 0,
        distribution?.['1_star'] || 0
      ],
      backgroundColor: [
        'rgba(76, 175, 80, 0.7)',
        'rgba(139, 195, 74, 0.7)',
        'rgba(255, 193, 7, 0.7)',
        'rgba(255, 152, 0, 0.7)',
        'rgba(244, 67, 54, 0.7)'
      ],
      borderWidth: 1,
      borderColor: [
        'rgba(76, 175, 80, 1)',
        'rgba(139, 195, 74, 1)',
        'rgba(255, 193, 7, 1)',
        'rgba(255, 152, 0, 1)',
        'rgba(244, 67, 54, 1)'
      ]
    }]
  };

  const distributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      datalabels: {
        display: true,
        formatter: (value) => value > 0 ? value : ''
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          display: false
        }
      }
    }
  };

  // Calculate totals
  const totalFeedback = Object.values(distribution || {}).reduce((sum, val) => sum + (val || 0), 0);
  const positiveTotal = (distribution?.['5_stars'] || 0) + (distribution?.['4_stars'] || 0);
  const positivePercentage = totalFeedback > 0 ? (positiveTotal / totalFeedback * 100) : 0;

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

      {/* Feedback Distribution Chart */}
      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.feedback}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" fontWeight="bold">
              Feedback Distribution
            </Typography>
            <Tooltip title="Download as PNG">
              <IconButton 
                size="small" 
                onClick={() => downloadChartAsPNG(chartRefs.feedback, 'feedback_distribution')}
              >
                <SaveAlt />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ height: 300 }}>
            {totalFeedback > 0 ? (
              <PolarArea data={distributionData} options={distributionOptions} />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="text.secondary">No feedback yet</Typography>
              </Box>
            )}
          </Box>
        </Card>
      </Grid>

      {/* Feedback Statistics */}
      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2, height: '100%' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Feedback Overview
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            {/* Sentiment Gauge */}
            <Box sx={{ mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Overall Sentiment
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {positivePercentage.toFixed(1)}% Positive
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={positivePercentage}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  bgcolor: '#ffcdd2',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#4caf50',
                    borderRadius: 6
                  }
                }}
              />
              <Box display="flex" justifyContent="space-between" mt={0.5}>
                <Typography variant="caption" color="error.main">
                  Negative
                </Typography>
                <Typography variant="caption" color="success.main">
                  Positive
                </Typography>
              </Box>
            </Box>

            {/* Rating Breakdown */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
              Rating Breakdown
            </Typography>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution?.[`${stars}_stars`] || 0;
              const percentage = totalFeedback > 0 ? (count / totalFeedback * 100) : 0;
              
              return (
                <Box key={stars} sx={{ mb: 1.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {stars} ★
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({count} reviews)
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
                      height: 6,
                      borderRadius: 3,
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
          </Box>
        </Card>
      </Grid>

      {/* Frequent Keywords */}
      <Grid item xs={12}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Frequent Keywords
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            mt: 2, 
            maxHeight: 200, 
            overflow: 'auto',
            p: 1
          }}>
            {common_keywords && common_keywords.length > 0 ? (
              common_keywords.map(([word, count], index) => {
                // Calculate size based on frequency
                const maxCount = Math.max(...common_keywords.map(([, c]) => c));
                const minSize = 0.8;
                const maxSize = 2.2;
                const size = minSize + (count / maxCount) * (maxSize - minSize);
                
                return (
                  <Chip
                    key={index}
                    label={`${word} (${count})`}
                    size="small"
                    sx={{
                      bgcolor: `rgba(156, 39, 176, ${Math.min(0.1 + count * 0.03, 0.4)})`,
                      color: '#9c27b0',
                      fontWeight: 'medium',
                      fontSize: `${size * 0.75}rem`,
                      height: 'auto',
                      '& .MuiChip-label': {
                        py: 0.8,
                        px: 1.2
                      }
                    }}
                  />
                );
              })
            ) : (
              <Typography color="text.secondary">No keywords available</Typography>
            )}
          </Box>
        </Card>
      </Grid>

      {/* Recent Feedback Table */}
      <Grid item xs={12}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Recent Feedback
            </Typography>
            <Tooltip title="Download as CSV">
              <IconButton 
                size="small" 
                onClick={() => downloadTableAsCSV(recent_feedback, 'recent_feedback')}
              >
                <TableChart />
              </IconButton>
            </Tooltip>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell align="center">Rating</TableCell>
                  <TableCell>Comment</TableCell>
                  <TableCell align="center">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recent_feedback && recent_feedback.length > 0 ? (
                  recent_feedback.map((fb) => (
                    <TableRow key={fb.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: '#9c27b0' }}>
                            {fb.user__username?.charAt(0).toUpperCase() || <Person />}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {fb.user__username || 'Anonymous'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center">
                          <MuiRating value={fb.rating} readOnly size="small" />
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            ({fb.rating})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ 
                          maxWidth: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {fb.comment || 'No comment provided'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption">
                          {fb.created_at ? format(parseISO(fb.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary" py={3}>
                        No recent feedback
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

export default FeedbackTab;