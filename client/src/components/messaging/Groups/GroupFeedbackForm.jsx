// src/components/groups/GroupFeedbackForm.jsx
import React, { useState } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Rating,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';

const GroupFeedbackForm = ({ group, existingFeedback, onSubmit, onCancel }) => {
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [comment, setComment] = useState(existingFeedback?.comment || '');
  const [hover, setHover] = useState(-1);

  const labels = {
    1: 'Very Poor',
    2: 'Poor',
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
  };

  const handleSubmit = () => {
    onSubmit(rating, comment);
  };

  return (
    <>
      <DialogTitle>
        {existingFeedback ? 'Update Your Review' : 'Write a Review'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {group.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
            <Rating
              name="group-rating"
              value={rating}
              onChange={(event, newValue) => setRating(newValue)}
              onChangeActive={(event, newHover) => setHover(newHover)}
              size="large"
              icon={<StarIcon fontSize="inherit" />}
              emptyIcon={<StarIcon fontSize="inherit" style={{ opacity: 0.55 }} />}
            />
          </Box>
          
          <Typography color="text.secondary">
            {labels[hover !== -1 ? hover : rating] || 'Select a rating'}
          </Typography>
        </Box>
        
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={4}
          label="Your Review (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this group..."
          sx={{ mb: 2 }}
        />
        
        <Typography variant="body2" color="text.secondary">
          Your review will be visible to all group members and visitors.
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!rating}
        >
          {existingFeedback ? 'Update Review' : 'Submit Review'}
        </Button>
      </DialogActions>
    </>
  );
};

export default GroupFeedbackForm;