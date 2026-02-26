import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  alpha
} from '@mui/material';
import {
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material';
import { COLORS } from './UserGraphiq';
const KPICards = ({ summary }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(COLORS.primary, 0.2) }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography color="text.secondary" variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                  Total Users
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: COLORS.primary, lineHeight: 1.2 }}>
                  {summary.total_users?.toLocaleString() || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Chip 
                    size="small" 
                    icon={summary.trend?.direction === 'up' ? <TrendingUpIcon /> : 
                          summary.trend?.direction === 'down' ? <TrendingDownIcon /> : <TrendingFlatIcon />}
                    label={`${Math.abs(summary.trend?.percentage || 0)}% vs last month`}
                    color={summary.trend?.direction === 'up' ? 'success' : 
                          summary.trend?.direction === 'down' ? 'error' : 'default'}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
              <Avatar sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, width: 56, height: 56 }}>
                <GroupIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(COLORS.success, 0.2) }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography color="text.secondary" variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                  Active Users
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: COLORS.success, lineHeight: 1.2 }}>
                  {summary.active_users?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {summary.activity_rate || 0}% activity rate
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha(COLORS.success, 0.1), color: COLORS.success, width: 56, height: 56 }}>
                <PersonAddIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(COLORS.warning, 0.2) }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography color="text.secondary" variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                  Staff Members
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: COLORS.warning, lineHeight: 1.2 }}>
                  {summary.staff_users?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {summary.superuser_users || 0} super admins
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha(COLORS.warning, 0.1), color: COLORS.warning, width: 56, height: 56 }}>
                <AdminIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(COLORS.teal, 0.2) }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography color="text.secondary" variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                  Retention Rate
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: COLORS.teal, lineHeight: 1.2 }}>
                  {summary.retention_rate || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Last 30 days
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha(COLORS.teal, 0.1), color: COLORS.teal, width: 56, height: 56 }}>
                <AssessmentIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default KPICards;