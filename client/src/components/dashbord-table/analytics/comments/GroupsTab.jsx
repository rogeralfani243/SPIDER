
import React from 'react';
import { Chip, Grid, Card, CardContent, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { SaveAlt, Groups as GroupsIcon, AdminPanelSettings, Message } from '@mui/icons-material';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { downloadChartAsPNG } from '../downloadHelpers';
// Charts
//import GroupsByWeekChart from './GroupsByWeekChart';
import GroupsByMonthChart from '../groups/GroupsByMonthChart';
//import GroupsByCountryChart from './GroupsByCountryChart';
//import GroupsByCityChart from './GroupsByCityChart';
import TopGroupsTable from '../groups/TopGroupsTable';
import GroupRoleDistribution from '../groups/GroupRoleDistribution';

const GroupsTab = ({ groups, chartRefs }) => {
  if (!groups) return null;

  const { 
    overview, 
    groups_managed, 
    groups_joined, 
    activity_by_month, 
    top_groups,
    group_feedbacks,
    role_distribution 
  } = groups;
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
                  Total Groups
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  <CountUp end={overview?.total_groups || 0} duration={2} />
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <GroupsIcon sx={{ fontSize: 16, color: 'primary.main', mr: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {overview?.groups_as_admin || 0} as admin, {overview?.groups_as_member || 0} as member
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
                  Group Messages
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  <CountUp end={overview?.user_group_messages || 0} duration={2} />
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <Message sx={{ fontSize: 16, color: 'info.main', mr: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    out of {overview?.total_group_messages || 0} total
                  </Typography>
                </Box>
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
                  Pending Requests
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  <CountUp end={overview?.pending_join_requests || 0} duration={2} />
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Awaiting your approval
                </Typography>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card sx={{ borderRadius: 3, p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Group Feedback
                </Typography>
                <Box display="flex" alignItems="baseline">
                  <Typography variant="h3" fontWeight="bold" sx={{ mr: 1 }}>
                    <CountUp end={group_feedbacks?.received?.average || 0} duration={2} decimals={1} />
                  </Typography>
                  <Typography variant="body2">/5</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  from {group_feedbacks?.received?.total || 0} reviews
                </Typography>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Grid>

      {/* Role Distribution */}
      <Grid item xs={12} md={4}>
        <Card sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.groups}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Role Distribution
            </Typography>
            <Tooltip title="Download as PNG">
         {/*
            <IconButton size="small"  onClick={() => handleDownloadChart(chartRefs.groupsByMonth, 'groups_by_month')}>
                   <SaveAlt />
              </IconButton>
         */}
            </Tooltip>
          </Box>
          <Box sx={{ height: 300 }}>
            <GroupRoleDistribution data={role_distribution} />
          </Box>
        </Card>
      </Grid>

      {/* Groups by Day/Week/Month */}
      <Grid item xs={12} md={8}>
        <Card sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.groupsByMonth}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Group Activity
            </Typography>
            <Box>
              <Tooltip title="Download as PNG">
                <IconButton size="small"  onClick={() => handleDownloadChart(chartRefs.groupsByMonth, 'groups_by_month')}>
                  <SaveAlt />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Box sx={{ height: 300 }}>
            <GroupsByMonthChart data={activity_by_month} />
          </Box>
        </Card>
      </Grid>

      {/* Top Groups Table */}
      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Most Active Groups
          </Typography>
          <TopGroupsTable data={top_groups} />
        </Card>
      </Grid>

      {/* Groups Managed */}
      {groups_managed && groups_managed.length > 0 && (
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              <AdminPanelSettings sx={{ mr: 1, verticalAlign: 'middle' }} />
              Groups You Manage
            </Typography>
            <Box sx={{ mt: 2 }}>
              {groups_managed.slice(0, 5).map((group, index) => (
                <Box
                  key={group.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderBottom: index < groups_managed.length - 1 ? '1px solid #f0f0f0' : 'none',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {group.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {group.members_count} members • {group.messages_count} messages
                    </Typography>
                  </Box>
                  <Chip
                    label={group.group_type === 'group_public' ? 'Public' : 'Private'}
                    size="small"
                    color={group.group_type === 'group_public' ? 'success' : 'default'}
                  />
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      )}

      {/* Groups Joined */}
      {groups_joined && groups_joined.length > 0 && (
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              <GroupsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Groups You Joined
            </Typography>
            <Box sx={{ mt: 2 }}>
              {groups_joined.slice(0, 5).map((group, index) => (
                <Box
                  key={group.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderBottom: index < groups_joined.length - 1 ? '1px solid #f0f0f0' : 'none',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {group.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Role: {group.user_role} • {group.members_count} members
                    </Typography>
                  </Box>
                  <Chip
                    label={group.requires_approval ? 'Approval' : 'Open'}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

export default GroupsTab;