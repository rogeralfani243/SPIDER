// src/components/messaging/Groups/GroupAdminPanel/components/tabs/AnalyticsTab.jsx
import React from 'react';
import {
  Box,
  Typography,
  Grid,
  LinearProgress,
  CircularProgress,
  CardContent
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  Group as GroupIcon,
  Notifications as NotificationsIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { Fade, alpha } from '@mui/material';
import { StatCard, ModernCard } from './GroupAdminPanelStyles';

const AnalyticsTab = ({ group, dataLoading }) => {
  if (dataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Fade in={true}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <BarChartIcon sx={{ fontSize: 32, color: 'info.main', mr: 2 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Group Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Performance metrics and insights
            </Typography>
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12} md={4}>
            <StatCard>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GroupIcon sx={{ fontSize: 24, color: 'primary.main', mr: 1.5 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Members
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {group.current_members_count || group.participants?.length || 0}
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  / {group.max_participants || '∞'}
                </Typography>
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={((group.current_members_count || group.participants?.length || 0) / (group.max_participants || 100)) * 100} 
                sx={{ height: 6, borderRadius: 3, mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                {group.available_spots || '∞'} spots available
              </Typography>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <StatCard>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon sx={{ fontSize: 24, color: 'warning.main', mr: 1.5 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Pending
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {group.pending_requests_count || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Join requests awaiting approval
              </Typography>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <StatCard>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StarIcon sx={{ fontSize: 24, color: 'secondary.main', mr: 1.5 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Rating
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {group.average_rating?.toFixed(1) || '0.0'}
                </Typography>
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  / 5.0
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {group.total_reviews || 0} total reviews
              </Typography>
            </StatCard>
          </Grid>

          {/* Rating Distribution */}
          <Grid item xs={12}>
            <ModernCard>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Rating Distribution
                </Typography>
                {group.rating_distribution && Object.entries(group.rating_distribution)
                  .sort(([a], [b]) => parseInt(b) - parseInt(a))
                  .map(([stars, count]) => {
                    const percentage = (count / (group.total_reviews || 1)) * 100;
                    return (
                      <Box key={stars} sx={{ mb: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ minWidth: 60, fontWeight: 500 }}>
                            {stars} ★
                          </Typography>
                          <Box sx={{ flexGrow: 1, ml: 2, mr: 3 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={percentage} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                bgcolor: alpha('#667eea', 0.1),
                                '& .MuiLinearProgress-bar': {
                                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                  borderRadius: 4,
                                }
                              }}
                            />
                          </Box>
                          <Typography variant="body1" sx={{ minWidth: 80, textAlign: 'right', fontWeight: 600 }}>
                            {count} ({percentage.toFixed(1)}%)
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
              </CardContent>
            </ModernCard>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default AnalyticsTab;