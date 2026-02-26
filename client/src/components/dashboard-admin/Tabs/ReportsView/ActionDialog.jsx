// src/components/dashboard-admin/components/Views/ReportsView/ActionDialog.jsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, DialogContentText, Stack, CircularProgress
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Warning as WarnIcon,
  Email as EmailIcon,
  Send as SendIcon
} from '@mui/icons-material';

const ActionDialog = ({
  actionDialogOpen,
  setActionDialogOpen,
  selectedReport,
  executeAction,
  isLoading,
  setContactDialogOpen,
  setEmailDialogOpen
}) => {
  return (
    <Dialog
      open={actionDialogOpen}
      onClose={() => setActionDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Take Action on Report #{selectedReport?.id}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Select an action to perform on this report:
        </DialogContentText>
        
        <Stack spacing={2}>
          <Button
            variant="outlined"
            startIcon={<CheckIcon />}
            onClick={() => executeAction('resolve')}
            disabled={isLoading}
            fullWidth
          >
            Resolve Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={() => executeAction('dismiss')}
            disabled={isLoading}
            fullWidth
          >
            Dismiss Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            color="error"
            onClick={() => executeAction('delete_content')}
            disabled={isLoading}
            fullWidth
          >
            Delete Content
          </Button>
          <Button
            variant="outlined"
            startIcon={<WarnIcon />}
            onClick={() => executeAction('warn_user')}
            disabled={isLoading}
            fullWidth
          >
            Warn User
          </Button>
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={() => { setActionDialogOpen(false); setContactDialogOpen(true); }}
            disabled={isLoading}
            fullWidth
          >
            Send Warning Email
          </Button>
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
            onClick={() => { setActionDialogOpen(false); setEmailDialogOpen(true); }}
            disabled={isLoading}
            fullWidth
          >
            Send Detailed Email
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setActionDialogOpen(false)} disabled={isLoading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActionDialog;