// src/components/groups/AdminPanelDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import GroupAdminPanel from '../GroupAdminPanel';

const AdminPanelDialog = ({ 
  open, 
  onClose, 
  group, 
  isAdmin, 
  loadGroupDetails 
}) => {
  if (!isAdmin) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Group Administration
      </DialogTitle>
      <DialogContent>
        <GroupAdminPanel
          group={group}
          onClose={() => {
            onClose();
            loadGroupDetails();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AdminPanelDialog;