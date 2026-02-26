// src/components/dashboard-admin/components/Views/DeletePostDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

const DeletePostDialog = ({ open, post, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        Confirm Deletion
      </DialogTitle>
      <DialogContent>
        {post && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Are you sure you want to delete the post <strong>"{post.title}"</strong>?
          </Alert>
        )}
        <Typography variant="body2" color="textSecondary" paragraph>
          This action is irreversible. The following will also be deleted:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="All associated comments" />
          </ListItem>
          <ListItem>
            <ListItemText primary="All ratings and likes" />
          </ListItem>
          <ListItem>
            <ListItemText primary="All recorded views" />
          </ListItem>
          <ListItem>
            <ListItemText primary="All media files" />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          startIcon={<DeleteIcon />}
        >
          Delete Permanently
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeletePostDialog;