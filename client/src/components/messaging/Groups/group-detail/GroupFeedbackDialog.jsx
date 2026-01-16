// src/components/groups/GroupFeedbackDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import GroupFeedbackForm from '../GroupFeedbackForm';

const GroupFeedbackDialog = ({ 
  open, 
  onClose, 
  group, 
  getMyFeedback, 
  handleSubmitFeedback 
}) => (
  <Dialog 
    open={open} 
    onClose={onClose}
    maxWidth="sm"
    fullWidth
  >
    <DialogTitle>
      {getMyFeedback() ? 'Update Your Review' : 'Write a Review'}
    </DialogTitle>
    <DialogContent>
      <GroupFeedbackForm
        group={group}
        existingFeedback={getMyFeedback()}
        onSubmit={handleSubmitFeedback}
        onCancel={onClose}
      />
    </DialogContent>
  </Dialog>
);

export default GroupFeedbackDialog;