// src/components/dashboard-admin/components/Views/ReportsView/QuickActionsMenu.jsx
import React from 'react';
import {
  Menu, MenuItem, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Warning as WarnIcon,
  Email as EmailIcon,
  Send as SendIcon
} from '@mui/icons-material';

import { Fade } from '@mui/material';
const QuickActionsMenu = ({
  anchorEl,
  handleActionMenuClose,
  handleTakeAction,
  executeAction,
  handleContactUser,
  handleSendEmail,
  handleDeleteReport,
  selectedReport
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleActionMenuClose}
      TransitionComponent={Fade}
    >
      <MenuItem onClick={() => { handleActionMenuClose(); handleTakeAction(selectedReport); }}>
        <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Resolve</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { handleActionMenuClose(); executeAction('dismiss'); }}>
        <ListItemIcon><CloseIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Dismiss</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { handleActionMenuClose(); executeAction('delete_content'); }}>
        <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Delete Content</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { handleActionMenuClose(); executeAction('warn_user'); }}>
        <ListItemIcon><WarnIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Warn User</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => { handleActionMenuClose(); handleContactUser(selectedReport); }}>
        <ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Send Warning Email</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { handleActionMenuClose(); handleSendEmail(selectedReport); }}>
        <ListItemIcon><SendIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Send Detailed Email</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => { handleActionMenuClose(); handleDeleteReport(selectedReport?.id); }}>
        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
        <ListItemText sx={{ color: 'error.main' }}>Delete Report</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default QuickActionsMenu;