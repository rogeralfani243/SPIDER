import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Alert
} from '@mui/material';

const DeleteCommentDialog = ({ open, onClose, onConfirm, comment }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Comment</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete this comment?
        </Typography>
        {comment && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Comment:</strong> {comment.content?.substring(0, 100)}...
            </Typography>
            <Typography variant="body2">
              <strong>Author:</strong> {comment.user?.username}
            </Typography>
            {comment.reply_count > 0 && (
              <Typography variant="body2" color="error">
                This comment has {comment.reply_count} replies that will also be deleted.
              </Typography>
            )}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          color="error" 
          onClick={onConfirm}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteCommentDialog;