// components/DeleteDialog.js
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

const DeleteDialog = ({ deleteDialog, setDeleteDialog, confirmDelete }) => {
  return (
    <Dialog
      open={deleteDialog.open}
      onClose={() => setDeleteDialog({ open: false, message: null, deleteForEveryone: false })}
    >
      <DialogContent>
        <Typography variant="h6" gutterBottom>
          {deleteDialog.deleteForEveryone ? 'Delete for everyone?' : 'Delete for you?'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {deleteDialog.deleteForEveryone 
            ? 'This will delete the message for all participants. This action cannot be undone.'
            : 'This will delete the message only for you. Other participants will still see it.'}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteDialog({ open: false, message: null, deleteForEveryone: false })}>
          Cancel
        </Button>
        <Button 
          onClick={confirmDelete} 
          color="error" 
          variant="contained"
        >
          {deleteDialog.deleteForEveryone ? 'Delete for everyone' : 'Delete for me'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;