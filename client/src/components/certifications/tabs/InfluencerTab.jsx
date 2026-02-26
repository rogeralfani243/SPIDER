// components/InfluencerTab.jsx
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Paper,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  TrendingUp as InfluencerIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { certificationService } from '../../services/certificationService';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
  },
}));

const InfluencerTab = ({ userStats, loading, setLoading, showMessage }) => {
  const handleCheckInfluencerEligibility = async () => {
    setLoading(true);
    try {
      const response = await certificationService.checkInfluencerEligibility();
      if (response.data.eligible) {
        showMessage('success', '🎉 Congratulations! Influencer badge granted!');
      } else {
        const missing = response.data.missing || [];
        showMessage('info', `Missing requirements: ${missing.join(', ')}`);
      }
    } catch (error) {
      showMessage('error', 'Error: ' + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestInfluencerBadge = async () => {
    setLoading(true);
    try {
      const response = await certificationService.requestInfluencerBadge();
      showMessage('info', response.data.message);
    } catch (error) {
      showMessage('error', 'Error: ' + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledCard>
      <CardHeader
        avatar={
          <Box sx={{ bgcolor: 'purple', color: '#fff', p: 2, borderRadius: 2 }}>
            <InfluencerIcon />
          </Box>
        }
        title={<Typography variant="h5" fontWeight="bold">Influencer Badge</Typography>}
        subheader="Recognition for influential community members"
      />
      <CardContent>
        {userStats && (
          <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Your Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {userStats.posts_count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Posts
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {userStats.comments_count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comments
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="secondary.main" fontWeight="bold">
                    {userStats.feedbacks_given}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Feedbacks Given
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {userStats.engagement_score}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Engagement Score
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Requirements
        </Typography>
        
        <List sx={{ mb: 4 }}>
          {[
            { req: 'Minimum 100 feedbacks given', met: userStats?.feedbacks_given >= 100 },
            { req: 'Minimum 100 feedbacks received', met: userStats?.feedbacks_received >= 100 },
            { req: 'Minimum 30 days account age', met: userStats?.account_age_days >= 30 },
            { req: 'Minimum 20 posts', met: userStats?.posts_count >= 20 },
            { req: 'Minimum 80 engagement score', met: userStats?.engagement_score >= 80 }
          ].map((item, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                {item.met ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />}
              </ListItemIcon>
              <ListItemText 
                primary={item.req}
                primaryTypographyProps={{ color: item.met ? 'success.main' : 'text.primary' }}
              />
            </ListItem>
          ))}
        </List>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleCheckInfluencerEligibility}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              sx={{ py: 1.5 }}
            >
              Check Eligibility
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleRequestInfluencerBadge}
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              Request Manual Review
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </StyledCard>
  );
};

export default InfluencerTab;