// src/components/dashboard-admin/components/Views/ReportsView/EmailDialog.jsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, DialogContentText, TextField, Alert,
  Box, Typography, CircularProgress
} from '@mui/material';

const EmailDialog = ({
  emailDialogOpen,
  setEmailDialogOpen,
  selectedReport,
  emailSubject,
  setEmailSubject,
  emailBody,
  setEmailBody,
  sendEmail,
  isLoading
}) => {
  return (
    <Dialog
      open={emailDialogOpen}
      onClose={() => setEmailDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Send Detailed Email to {selectedReport?.content_author?.username || 'User'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Send a detailed email to the user regarding report #{selectedReport?.id}
        </DialogContentText>
        
        <TextField
          label="Email Subject"
          fullWidth
          value={emailSubject}
          onChange={(e) => setEmailSubject(e.target.value)}
          sx={{ mb: 2 }}
          disabled={isLoading}
        />
        
        <TextField
          label="Email Message"
          multiline
          rows={10}
          fullWidth
          value={emailBody}
          onChange={(e) => setEmailBody(e.target.value)}
          placeholder="Write your detailed email message here..."
          variant="outlined"
          disabled={isLoading}
        />
        
        <Alert severity="info" sx={{ mt: 2 }}>
          This email will be sent from your admin email to the user's registered email address.
          The report will be marked as resolved after sending.
        </Alert>
        
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Report Details:
          </Typography>
          <Typography variant="body2">
            • Report ID: #{selectedReport?.id}
          </Typography>
          <Typography variant="body2">
            • Type: {selectedReport?.report_type_display || selectedReport?.report_type}
          </Typography>
          <Typography variant="body2">
            • Content: {selectedReport?.content_type}
          </Typography>
          {selectedReport?.reporter?.username && (
            <Typography variant="body2">
              • Reported by: {selectedReport.reporter.username}
            </Typography>
          )}
          {selectedReport?.content_author?.username && (
            <Typography variant="body2">
              • Target User: {selectedReport.content_author.username}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEmailDialogOpen(false)} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={sendEmail}
          disabled={!emailBody.trim() || !emailSubject.trim() || isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Send Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailDialog;