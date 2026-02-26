import React from 'react';
import {
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

const CommentsTableActions = ({
  comment,
  onViewDetail,
  onTogglePin,
  onToggleHide,
  onToggleSpam,
  onDeleteClick,
  onActionMenuOpen,
  size = 'small'
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
      <Tooltip title="View details">
        <IconButton size={size} onClick={() => onViewDetail(comment.id)}>
          <OpenInNewIcon fontSize={size} />
        </IconButton>
      </Tooltip>
      
      <Tooltip title={comment.is_pinned ? "Unpin" : "Pin"}>
        <IconButton 
          size={size} 
          onClick={() => onTogglePin(comment.id)}
          color={comment.is_pinned ? "success" : "default"}
        >
          {comment.is_pinned ? <PushPinIcon fontSize={size} /> : <PushPinOutlinedIcon fontSize={size} />}
        </IconButton>
      </Tooltip>
      
      <Tooltip title={comment.is_hidden ? "Unhide" : "Hide"}>
        <IconButton 
          size={size} 
          onClick={() => onToggleHide(comment.id)}
          color={comment.is_hidden ? "warning" : "default"}
        >
          {comment.is_hidden ? <VisibilityOffIcon fontSize={size} /> : <ViewIcon fontSize={size} />}
        </IconButton>
      </Tooltip>
      
      <Tooltip title={comment.is_spam ? "Not spam" : "Mark as spam"}>
        <IconButton 
          size={size} 
          onClick={() => onToggleSpam(comment.id)}
          color={comment.is_spam ? "error" : "default"}
        >
          <WarningIcon fontSize={size} />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="More actions">
        <IconButton 
          size={size}
          onClick={(e) => onActionMenuOpen(e, comment)}
        >
          <MoreIcon fontSize={size} />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Delete">
        <IconButton 
          size={size} 
          color="error"
          onClick={() => onDeleteClick(comment)}
        >
          <DeleteIcon fontSize={size} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default CommentsTableActions;