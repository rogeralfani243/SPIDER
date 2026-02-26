import React from 'react';
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Checkbox
} from '@mui/material';
import {
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  OpenInNew as OpenInNewIcon,
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Reply as ReplyIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { formatDate } from '../../../../utils/formatters.js';

const getStatusChip = (comment) => {
  if (comment.is_spam) {
    return <Chip size="small" label="Spam" color="error" icon={<WarningIcon />} sx={{ height: 20 }} />;
  }
  if (comment.is_hidden) {
    return <Chip size="small" label="Hidden" color="default" icon={<VisibilityOffIcon />} sx={{ height: 20 }} />;
  }
  if (comment.is_pinned) {
    return <Chip size="small" label="Pinned" color="success" icon={<PushPinIcon />} sx={{ height: 20 }} />;
  }
  return null;
};

const getMediaIcon = (comment) => {
  if (comment.image_url) return <Tooltip title="Has image"><ImageIcon fontSize="small" color="primary" /></Tooltip>;
  if (comment.video_url) return <Tooltip title="Has video"><VideoIcon fontSize="small" color="secondary" /></Tooltip>;
  if (comment.file_url) return <Tooltip title="Has file"><AttachFileIcon fontSize="small" color="action" /></Tooltip>;
  return null;
};

const CommentsTableRow = ({
  comment,
  selected,
  onSelect,
  onViewDetail,
  onTogglePin,
  onToggleHide,
  onToggleSpam,
  onDeleteClick,
  onActionMenuOpen
}) => {
  return (
    <TableRow 
      hover
      sx={{ 
        bgcolor: comment.is_spam ? 'error.lighter' : 
                comment.is_hidden ? 'action.hover' : 'inherit',
        opacity: comment.is_hidden ? 0.7 : 1
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={onSelect} />
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              sx={{
                maxWidth: 300,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: comment.is_pinned ? 'bold' : 'normal'
              }}
            >
              {comment.content || <em>No content</em>}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
              {comment.depth > 0 && (
                <Chip
                  size="small"
                  icon={<ReplyIcon />}
                  label={`Reply (depth: ${comment.depth})`}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              )}
              {getMediaIcon(comment)}
              {comment.reply_count > 0 && (
                <Chip
                  size="small"
                  label={`${comment.reply_count} replies`}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              )}
              {comment.is_edited && (
                <Chip
                  size="small"
                  label="Edited"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar 
            src={comment.user?.profile_image || ''} 
            sx={{ width: 32, height: 32 }}
          >
            {comment.user?.username?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Box>
            <Typography variant="body2">
              {comment.user?.username || 'Anonymous'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              ID: {comment.user?.id || 'N/A'}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      
      <TableCell>
        <Box>
          <Typography 
            variant="body2" 
            sx={{ 
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {comment.post_title || `Post #${comment.post_id}`}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            ID: {comment.post_id}
          </Typography>
        </Box>
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ThumbUpIcon fontSize="small" color="action" sx={{ fontSize: 14 }} />
            <Typography variant="caption">{comment.likes_count || 0}</Typography>
          </Box>
          {comment.total_comments_count > 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CommentIcon fontSize="small" color="action" sx={{ fontSize: 14 }} />
              <Typography variant="caption">{comment.total_comments_count} total</Typography>
            </Box>
          )}
        </Box>
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {getStatusChip(comment)}
          {comment.parent_comment && (
            <Tooltip title={`Parent: ${comment.parent_comment.content}`}>
              <Chip
                size="small"
                label="Has parent"
                icon={<ReplyIcon />}
                variant="outlined"
                sx={{ height: 20, fontSize: '0.6rem' }}
              />
            </Tooltip>
          )}
        </Box>
      </TableCell>
      
      <TableCell>
        <Tooltip title={formatDate(comment.created_at)}>
          <Box>
            <Typography variant="caption" display="block">
              {new Date(comment.created_at).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {new Date(comment.created_at).toLocaleTimeString()}
            </Typography>
          </Box>
        </Tooltip>
      </TableCell>
      
      <TableCell align="right">
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="View details">
            <IconButton size="small" onClick={onViewDetail}>
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={comment.is_pinned ? "Unpin" : "Pin"}>
            <IconButton 
              size="small" 
              onClick={onTogglePin}
              color={comment.is_pinned ? "success" : "default"}
            >
              {comment.is_pinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title={comment.is_hidden ? "Unhide" : "Hide"}>
            <IconButton 
              size="small" 
              onClick={onToggleHide}
              color={comment.is_hidden ? "warning" : "default"}
            >
              {comment.is_hidden ? <VisibilityOffIcon fontSize="small" /> : <ViewIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title={comment.is_spam ? "Not spam" : "Mark as spam"}>
            <IconButton 
              size="small" 
              onClick={onToggleSpam}
              color={comment.is_spam ? "error" : "default"}
            >
              <WarningIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <IconButton 
            size="small"
            onClick={onActionMenuOpen}
          >
            <MoreIcon fontSize="small" />
          </IconButton>
          
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              color="error"
              onClick={onDeleteClick}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default CommentsTableRow;