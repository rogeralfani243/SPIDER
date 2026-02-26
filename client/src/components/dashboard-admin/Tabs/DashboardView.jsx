import React from 'react';
import {
  Box, Grid, Paper, Typography,
  Card, CardContent
} from '@mui/material';
import {
  People as PeopleIcon,
  Article as ArticleIcon,
  Report as ReportIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  ChatBubbleOutline as ChatBubbleIcon
} from '@mui/icons-material';
import StatCard from './StatCard';
import UserRegistrationsChart from '../charts/UserRegistrationsChart.jsx';
import RevenueChart from '../charts/RevenueChart.jsx';
import ReportTypesChart from '../charts/ReportTypesChart.jsx';


const DashboardView = ({ stats }) => {
  const chartData = {
    dailyRegistrations: stats?.charts_data?.daily_registrations || [],
    monthlyPosts: stats?.charts_data?.monthly_posts || [],
    reportTypes: stats?.charts_data?.report_types || [],
    topCategories: stats?.charts_data?.top_categories || [],
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.overview?.total_users || 0}
            icon={<PeopleIcon />}
            color="#2196f3"
            trend={stats?.growth_metrics?.user_growth_rate || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Posts"
            value={stats?.overview?.total_posts || 0}
            icon={<ArticleIcon />}
            color="#4caf50"
            trend={stats?.growth_metrics?.post_growth_rate || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Reports"
            value={stats?.reports_summary?.pending || 0}
            icon={<ReportIcon />}
            color="#f44336"
            trend={-5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`$${(stats?.overview?.total_revenue || 0).toFixed(2)}`}
            icon={<PaymentIcon />}
            color="#ff9800"
            trend={15.5}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              User Activity Overview
            </Typography>
            <UserRegistrationsChart data={chartData.dailyRegistrations} />
          </Paper>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Report Types Distribution
            </Typography>
            <ReportTypesChart data={chartData.reportTypes} />
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Charts */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Trends
            </Typography>
            <RevenueChart data={chartData.monthlyPosts} />
          </Paper>
        </Grid>
        
      <Grid item xs={12} md={6}>
  <Paper sx={{ p: 3, height: 350 }}>
    <Typography variant="h6" gutterBottom fontWeight={600}>
      Platform Metrics
    </Typography>

    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      
      <MetricItem
        label="Average Rating"
        value={(stats?.growth_metrics?.avg_rating || 0).toFixed(1)}
        icon={<StarIcon fontSize="small" color="warning" />}
      />

      <MetricItem
        label="User Growth Rate"
        value={`${(stats?.growth_metrics?.user_growth_rate || 0).toFixed(1)}%`}
        icon={
          stats?.growth_metrics?.user_growth_rate > 0
            ? <TrendingUpIcon fontSize="small" color="success" />
            : <TrendingDownIcon fontSize="small" color="error" />
        }
      />

      <MetricItem
        label="Post Growth Rate"
        value={`${(stats?.growth_metrics?.post_growth_rate || 0).toFixed(1)}%`}
        icon={
          stats?.growth_metrics?.post_growth_rate > 0
            ? <TrendingUpIcon fontSize="small" color="success" />
            : <TrendingDownIcon fontSize="small" color="error" />
        }
      />

      <MetricItem
        label="Engagement Score"
        value={(stats?.growth_metrics?.avg_comments_per_post || 0).toFixed(1)}
        icon={<ChatBubbleIcon fontSize="small" color="primary" />}
      />

    </Box>
  </Paper>
</Grid>
      </Grid>
    </>
  );
};

const MetricItem = ({ label, value, icon }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="h5">{icon}</Typography>
      <Typography variant="body1">{label}</Typography>
    </Box>
    <Typography variant="h6" fontWeight="bold">
      {value}
    </Typography>
  </Box>
);

export default DashboardView;