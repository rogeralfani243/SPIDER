// src/components/dashboard-admin/components/Views/ReportsView/ContactDialog.jsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, DialogContentText, TextField, Alert, CircularProgress
} from '@mui/material';

const ContactDialog = ({
  contactDialogOpen,
  setContactDialogOpen,
  selectedReport,
  contactMessage,
  setContactMessage,
  sendContactMessage,
  isLoading
}) => {
  return (
    <Dialog
      open={contactDialogOpen}
      onClose={() => setContactDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Send Warning Email to {selectedReport?.content_author?.username || 'User'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Send a warning email to the user regarding report #{selectedReport?.id}:
        </DialogContentText>
        
        <TextField
          autoFocus
          multiline
          rows={6}
          fullWidth
          value={contactMessage}
          onChange={(e) => setContactMessage(e.target.value)}
          placeholder="Write your warning message here..."
          variant="outlined"
          disabled={isLoading}
        />
        
        <Alert severity="info" sx={{ mt: 2 }}>
          This email will be sent from your admin email to the user's registered email address.
          The report will be marked as resolved after sending.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setContactDialogOpen(false)} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={sendContactMessage}
          disabled={!contactMessage.trim() || isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Send Warning Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactDialog;