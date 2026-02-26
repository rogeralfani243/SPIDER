import React from 'react';
import { Menu, MenuItem, Divider } from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const ActionMenu = ({
  anchorEl,
  open,
  onClose,
  comment,
  onTogglePin,
  onToggleHide,
  onToggleSpam,
  onDeleteClick,
  onViewInContext
}) => {
  if (!comment) return null;

  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItem onClick={onViewInContext}>
        <OpenInNewIcon fontSize="small" sx={{ mr: 1 }} /> View in context
      </MenuItem>
      <MenuItem onClick={() => { onTogglePin(comment.id); onClose(); }}>
        {comment.is_pinned ? (
          <><PushPinOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Unpin</>
        ) : (
          <><PushPinIcon fontSize="small" sx={{ mr: 1 }} /> Pin</>
        )}
      </MenuItem>
      <MenuItem onClick={() => { onToggleHide(comment.id); onClose(); }}>
        {comment.is_hidden ? (
          <><ViewIcon fontSize="small" sx={{ mr: 1 }} /> Unhide</>
        ) : (
          <><VisibilityOffIcon fontSize="small" sx={{ mr: 1 }} /> Hide</>
        )}
      </MenuItem>
      <MenuItem onClick={() => { onToggleSpam(comment.id); onClose(); }}>
        {comment.is_spam ? (
          <><BlockIcon fontSize="small" sx={{ mr: 1 }} /> Not spam</>
        ) : (
          <><WarningIcon fontSize="small" sx={{ mr: 1 }} /> Mark as spam</>
        )}
      </MenuItem>
      <Divider />
      <MenuItem 
        onClick={() => { onDeleteClick(comment); onClose(); }}
        sx={{ color: 'error.main' }}
      >
        <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
      </MenuItem>
    </Menu>
  );
};

export default ActionMenu;