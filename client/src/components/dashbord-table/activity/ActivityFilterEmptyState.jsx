// src/components/activity/ActivityFilterEmptyState.jsx
import React from 'react';
import {
  Box,
  Typography,
  Button
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const ActivityFilterEmptyState = ({ 
  filter, 
  handleFilterChange, 
  getActivityLabel,
  handleClickFeedbacksViewOnProfile 
}) => {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        No {getActivityLabel(filter).toLowerCase()} found
      </Typography>
      
      {filter === 'feedback_received' && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="text.primary" gutterBottom>
            Want to see feedback on your profile?
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Feedback received will appear on your feedback's section in your profile.
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<ViewIcon />}
            onClick={handleClickFeedbacksViewOnProfile}
            sx={{ mt: 1 }}
          >
            View all feedback on your profile
          </Button>
        </Box>
      )}
      
      <Button 
        variant="text" 
        size="small" 
        startIcon={<FilterIcon />}
        onClick={() => handleFilterChange('all')}
        sx={{ mt: 2 }}
      >
        Show all activities
      </Button>
    </Box>
  );
};

ActivityFilterEmptyState.propTypes = {
  filter: PropTypes.string.isRequired,
  handleFilterChange: PropTypes.func.isRequired,
  getActivityLabel: PropTypes.func.isRequired,
  handleClickFeedbacksViewOnProfile: PropTypes.func
};

export default ActivityFilterEmptyState;