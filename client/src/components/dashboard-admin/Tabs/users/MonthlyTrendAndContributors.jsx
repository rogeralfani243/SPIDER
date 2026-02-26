import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Chip,
  alpha
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  PostAdd as PostIcon
} from '@mui/icons-material';
import { COLORS } from './UserGraphiq';
import MonthlyChart from './MonthlyChart';
import TopUsersTable from './TopUsersTable';

const MonthlyTrendAndContributors = ({ 
  monthlyData, 
  topUsers, 
  activeMetric, 
  onMetricChange,
  monthlyChartRef 
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={6}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: 'divider',
            height: '100%'
          }}
          ref={monthlyChartRef}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CalendarIcon sx={{ color: COLORS.primary }} /> Monthly Registration Trend
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <MonthlyChart data={monthlyData} />
        </Paper>
      </Grid>

      <Grid item xs={12} lg={6}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: 'divider',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PostIcon sx={{ color: COLORS.amber }} /> Top Contributors
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <ToggleButtonGroup
            value={activeMetric}
            exclusive
            onChange={onMetricChange}
            size="small"
            sx={{ mb: 3, alignSelf: 'center' }}
          >
            <ToggleButton value="posts">Posts</ToggleButton>
           
{/* <ToggleButton value="comments">Comments</ToggleButton> */}

            <ToggleButton value="reports">Reports</ToggleButton>
          </ToggleButtonGroup>

          <TopUsersTable 
            users={
              activeMetric === 'posts' ? topUsers.by_posts :
              activeMetric === 'comments' ? topUsers.by_comments :
              topUsers.by_reports
            }
            metric={activeMetric}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default MonthlyTrendAndContributors;