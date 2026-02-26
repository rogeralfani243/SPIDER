// components/certifications/tabs/FireTab.jsx
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
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Whatshot as FireIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
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

const FireTab = ({ 
  fireEligibility, 
  loading, 
  setLoading, 
  showMessage,
  updateFireEligibility 
}) => {
  const handleCheckFireEligibility = async () => {
    setLoading(true);
    try {
      const response = await certificationService.checkFireEligibility();
      updateFireEligibility(response.data);
      
      if (response.data.status === 'success') {
        showMessage('success', '🎉 Congratulations! You earned the Fire certification!');
      } else {
        showMessage('info', `Current score: ${response.data.score}. Keep going!`);
      }
    } catch (error) {
      showMessage('error', 'Error checking eligibility: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <StyledCard>
      <CardHeader
        avatar={
          <Box sx={{ bgcolor: 'error.main', color: '#fff', p: 2, borderRadius: 2 }}>
            <FireIcon />
          </Box>
        }
        title={<Typography variant="h5" fontWeight="bold">Fire Certification</Typography>}
        subheader="For highly active and engaged users"
      />
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Requirements (Last 7 Days)
        </Typography>
        
        <List sx={{ mb: 4 }}>
          {[
            'Publish at least 3 posts',
            'Make at least 10 comments',
            'Achieve minimum activity score of 100'
          ].map((req, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <CheckCircleIcon color="warning" />
              </ListItemIcon>
              <ListItemText primary={req} />
            </ListItem>
          ))}
        </List>

        {fireEligibility && (
          <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Your Activity Score
            </Typography>
            
            {/* Progress Bars */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2">Posts</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {fireEligibility.posts || 0}/3
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateProgress(fireEligibility.posts || 0, 3)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2">Comments</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {fireEligibility.comments || 0}/10
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateProgress(fireEligibility.comments || 0, 10)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2">Activity Score</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {fireEligibility.score || 0}/100
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateProgress(fireEligibility.score || 0, 100)}
                  color="error"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {fireEligibility.posts || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Posts
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {fireEligibility.comments || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comments
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box textAlign="center" sx={{ mt: 2 }}>
                  <Typography variant="h2" fontWeight="bold" color="error">
                    {fireEligibility.score || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Activity Score
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Button
          fullWidth
          variant="contained"
          onClick={handleCheckFireEligibility}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          sx={{
            py: 1.5,
            mb: 3,
            background: 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)',
            },
          }}
        >
          Check Fire Eligibility
        </Button>

        <Alert severity="info" icon={<InfoIcon />}>
          <Typography variant="body2">
            Your activity from the last 7 days is automatically calculated. Posts count for 10 points,
            comments for 5 points, and average rating for 20 points each.
          </Typography>
        </Alert>
      </CardContent>
    </StyledCard>
  );
};

export default FireTab;