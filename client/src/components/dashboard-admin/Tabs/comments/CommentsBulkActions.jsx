import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Close as CloseIcon,
  VisibilityOff as VisibilityOffIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

const BulkActionsBar = ({
  selectedCount,
  selectedComments,
  onClose,
  onBulkDelete,
  onBulkHide,
  onBulkUnhide,
  onBulkSpam,
  onBulkNotSpam,
  onBulkPin,
  onBulkUnpin,
  loading = false
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  if (selectedCount === 0) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'sticky',
        bottom: 20,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'primary.main',
        overflow: 'hidden'
      }}
    >
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
      
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<CheckCircleIcon />}
            label={`${selectedCount} selected`}
            color="primary"
            onDelete={onClose}
            deleteIcon={<CloseIcon />}
          />
          <Typography variant="body2" color="textSecondary">
            {selectedComments?.reduce((acc, c) => {
              if (c?.reply_count) acc += c.reply_count;
              return acc;
            }, 0) || 0} replies will be affected
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Delete all selected">
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => onBulkDelete(selectedComments.map(c => c.id))}
            >
              Delete
            </Button>
          </Tooltip>

          <Button
            variant="outlined"
            size="small"
            endIcon={<MoreIcon />}
            onClick={handleMenuOpen}
          >
            More Actions
          </Button>

          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onBulkHide(selectedComments.map(c => c.id)); handleMenuClose(); }}>
          <VisibilityOffIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
          Hide Selected
        </MenuItem>
        <MenuItem onClick={() => { onBulkUnhide(selectedComments.map(c => c.id)); handleMenuClose(); }}>
          <ViewIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
          Unhide Selected
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onBulkSpam(selectedComments.map(c => c.id)); handleMenuClose(); }}>
          <WarningIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
          Mark as Spam
        </MenuItem>
        <MenuItem onClick={() => { onBulkNotSpam(selectedComments.map(c => c.id)); handleMenuClose(); }}>
          <BlockIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
          Mark as Not Spam
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onBulkPin(selectedComments.map(c => c.id)); handleMenuClose(); }}>
          <PushPinIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
          Pin Selected
        </MenuItem>
        <MenuItem onClick={() => { onBulkUnpin(selectedComments.map(c => c.id)); handleMenuClose(); }}>
          <PushPinOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          Unpin Selected
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default BulkActionsBar;