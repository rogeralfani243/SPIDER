import React from 'react';
import {
  Paper, Grid, Box, Typography, Avatar, Chip, Card,
  LinearProgress, IconButton, Tooltip, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Timeline, Person, LocationOn, GetApp, Refresh,
  EmojiEvents
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import CountUp from 'react-countup';

const ProfileHeader = ({
  profile,
  engagement,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  refreshing,
  onDownloadAll
}) => {
  if (!profile) return null;

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={3}>
          <Box display="flex" alignItems="center">
            <Avatar
              src={profile.image_url}
              sx={{ width: 80, height: 80, mr: 2 }}
            >
              {profile.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {profile.full_name || profile.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member since {format(parseISO(profile.date_joined), 'dd MMM yyyy')}
              </Typography>
              <Chip
                size="small"
                label={`${profile.account_age_days} days`}
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card elevation={0} sx={{ bgcolor: '#f5f5f5', p: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Engagement Score
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      <CountUp end={engagement?.overall_score || 0} duration={2} />
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#1976d2' }}>
                    <Timeline />
                  </Avatar>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={engagement?.overall_score || 0}
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card elevation={0} sx={{ bgcolor: '#f5f5f5', p: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Profile Completion
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      <CountUp end={profile.completion_percentage || 0} duration={2} />%
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#4caf50' }}>
                    <Person />
                  </Avatar>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={profile.completion_percentage || 0}
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card elevation={0} sx={{ bgcolor: '#f5f5f5', p: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Badges Earned
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>
                      {profile.badges?.length || 0}
                    </Typography>
                    <Box>
                      {profile.badges?.slice(0, 3).map((badge, i) => (
                        <Tooltip key={i} title={badge.name}>
                          <span style={{ fontSize: '20px', marginLeft: i > 0 ? -5 : 0 }}>
                            {badge.icon}
                          </span>
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card elevation={0} sx={{ bgcolor: '#f5f5f5', p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Location
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <LocationOn sx={{ fontSize: 20, color: '#f44336', mr: 1 }} />
                  <Typography variant="body1">
                    {profile.city || profile.country || 'Not specified'}
                  </Typography>
                </Box>
                {profile.country && (
                  <Typography variant="caption" color="text.secondary">
                    {profile.country}
                  </Typography>
                )}
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <Box display="flex" gap={1}>
          {profile.badges?.map((badge, index) => (
            <Chip
              key={index}
              icon={<span>{badge.icon}</span>}
              label={badge.name}
              size="small"
              sx={{
                bgcolor: badge.level === 'gold' ? '#ffd70020' : 
                         badge.level === 'silver' ? '#c0c0c020' : 
                         badge.level === 'bronze' ? '#cd7f3220' : '#e0e0e0',
                border: badge.level === 'gold' ? '1px solid #ffd700' :
                       badge.level === 'silver' ? '1px solid #c0c0c0' :
                       badge.level === 'bronze' ? '1px solid #cd7f32' : 'none'
              }}
            />
          ))}
        </Box>
        <Box display="flex" gap={1}>
          {onDownloadAll && (
            <Tooltip title="Download All Charts">
              <IconButton onClick={onDownloadAll} color="primary">
                <GetApp />
              </IconButton>
            </Tooltip>
          )}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={onTimeRangeChange}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={onRefresh} disabled={refreshing}>
            <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Box>
      </Box>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Paper>
  );
};

export default ProfileHeader;