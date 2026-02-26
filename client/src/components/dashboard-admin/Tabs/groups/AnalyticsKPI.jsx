import React from 'react';
import { Grid } from '@mui/material';
import {
  Group as GroupIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  CheckCircle as ActiveIcon
} from '@mui/icons-material';
import StatCard from './StatCard';

const AnalyticsKPI = ({ summary }) => {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Groups"
          value={formatNumber(summary?.total_groups)}
          subtitle={`${summary?.active_groups || 0} active`}
          icon={<GroupIcon />}
          color="#4F46E5"
          trend={summary?.group_growth_rate > 0 ? 'up' : 'down'}
          trendValue={`${summary?.group_growth_rate || 0}%`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Members"
          value={formatNumber(summary?.total_members)}
          subtitle={`${summary?.avg_members_per_group || 0} avg per group`}
          icon={<PeopleIcon />}
          color="#10B981"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Messages"
          value={formatNumber(summary?.total_messages)}
          subtitle={`${summary?.avg_messages_per_group || 0} avg per group`}
          icon={<MessageIcon />}
          color="#F59E0B"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Active Rate"
          value={`${summary?.active_rate || 0}%`}
          subtitle={`${summary?.active_groups || 0} active groups`}
          icon={<ActiveIcon />}
          color="#8B5CF6"
        />
      </Grid>
    </Grid>
  );
};

export default AnalyticsKPI;