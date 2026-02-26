import React, { useState } from 'react';
import { Grid, Card, Typography, Box, IconButton, Tooltip, Chip } from '@mui/material';
import {
  SaveAlt, PictureAsPdf, ShowChart, BarChart,
  EmojiEvents, Assessment, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import ActivityChart from './ActivityChart';
import EngagementRadar from './EngagementRadar';
import Highlights from './Highlights';
import ComparisonCards from './ComparisonCards';
import { downloadChartAsPNG, downloadChartAsPDF } from './downloadHelpers';

const OverviewTab = ({ data, chartRefs }) => {
  const [chartView, setChartView] = useState('line');
  const { posts, comments, ratings, feedback, engagement, highlights, comparative } = data;

  return (
    <Grid container spacing={3}>
      {/* Activity Chart */}
      <Grid item xs={12} lg={8}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.activity}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              30-Day Activity
            </Typography>
            <Box>
              <Tooltip title="Download as PNG">
                <IconButton size="small" onClick={() => downloadChartAsPNG(chartRefs.activity, 'activity_chart')}>
                  <SaveAlt />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download as PDF">
                <IconButton size="small" onClick={() => downloadChartAsPDF(chartRefs.activity, 'activity_chart')}>
                  <PictureAsPdf />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => setChartView('line')}>
                <ShowChart color={chartView === 'line' ? 'primary' : 'inherit'} />
              </IconButton>
              <IconButton size="small" onClick={() => setChartView('bar')}>
                <BarChart color={chartView === 'bar' ? 'primary' : 'inherit'} />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ height: 300 }}>
            <ActivityChart 
              postsData={posts?.by_day}
              commentsData={comments?.by_day}
              ratingsData={ratings?.by_day}
              chartView={chartView}
            />
          </Box>
        </Card>
      </Grid>

      {/* Engagement Radar */}
      <Grid item xs={12} lg={4}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2, height: '100%' }} ref={chartRefs.radar}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" fontWeight="bold">
              Engagement Score
            </Typography>
            <Tooltip title="Download as PNG">
              <IconButton size="small" onClick={() => downloadChartAsPNG(chartRefs.radar, 'engagement_radar')}>
                <SaveAlt />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ height: 300 }}>
            <EngagementRadar engagement={engagement} />
          </Box>
        </Card>
      </Grid>

      {/* Highlights */}
      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
            Highlights
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Highlights highlights={highlights} />
          </Box>
        </Card>
      </Grid>

      {/* Comparison */}
      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Comparison
          </Typography>
          <ComparisonCards comparative={comparative} />
        </Card>
      </Grid>
    </Grid>
  );
};

export default OverviewTab;