// src/components/dashboard-admin/Tabs/comments/CommentsDialogs/CommentDetailDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  Grid,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tab,
  Tabs
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  ThumbUp as ThumbUpIcon,
  Reply as ReplyIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Warning as WarningIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AttachFile as AttachFileIcon,
  CalendarToday as CalendarIcon,
  OpenInNew as OpenInNewIcon,
  AccessTime as AccessTimeIcon,
  Report as ReportIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import useAdminApi from '../../../../../hooks/useAdminApi';
import { formatDate } from '../../../../../utils/formatters';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
);

const CommentDetailDialog = ({ open, onClose, commentId, onCommentUpdated }) => {
  const api = useAdminApi();
  
  const [comment, setComment] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (open && commentId) {
      loadCommentDetail();
      loadCommentReplies();
    }
  }, [open, commentId]);

  const loadCommentDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getCommentDetail(commentId);
      if (response?.status === 'success') {
        setComment(response.data);
      }
    } catch (err) {
      setError(err.message || 'Error loading comment details');
    } finally {
      setLoading(false);
    }
  };

  const loadCommentReplies = async () => {
    setRepliesLoading(true);
    try {
      const response = await api.getCommentReplies(commentId);
      if (response?.status === 'success') {
        setReplies(response.data || []);
      }
    } catch (err) {
      console.error('Error loading replies:', err);
    } finally {
      setRepliesLoading(false);
    }
  };

  const handleAction = async (action, callback) => {
    setActionLoading(true);
    try {
      await callback();
      loadCommentDetail();
      loadCommentReplies();
      if (onCommentUpdated) onCommentUpdated();
    } catch (err) {
      console.error(`Error ${action}:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleHide = () => handleAction('toggle hide', () => api.toggleHideComment(commentId));
  const handleToggleSpam = () => handleAction('toggle spam', () => api.toggleSpamComment(commentId));
  const handleTogglePin = () => handleAction('toggle pin', () => api.togglePinComment(commentId));
  
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      handleAction('delete', () => api.deleteComment(commentId)).then(() => {
        onClose();
      });
    }
  };

  const handleViewInContext = () => {
    if (comment?.post?.id) {
      window.open(`/posts/${comment.post.id}#comment-${comment.id}`, '_blank');
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CommentIcon color="primary" />
            <Typography variant="h6">Comment Details</Typography>
            {comment?.is_pinned && (
              <Chip
                size="small"
                icon={<PushPinIcon />}
                label="Pinned"
                color="success"
                sx={{ ml: 1 }}
              />
            )}
            {comment?.is_hidden && (
              <Chip
                size="small"
                icon={<VisibilityOffIcon />}
                label="Hidden"
                color="default"
              />
            )}
            {comment?.is_spam && (
              <Chip
                size="small"
                icon={<WarningIcon />}
                label="Spam"
                color="error"
              />
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : comment ? (
          <>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                <Tab label="Overview" />
                <Tab label="Replies" badgeContent={replies.length} color="primary" />
                <Tab label="Raw Data" />
              </Tabs>
            </Box>

            {/* Overview Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                {/* Author Info */}
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="primary" /> Author Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        src={comment.user?.profile_image} 
                        sx={{ width: 50, height: 50, bgcolor: 'primary.main' }}
                      >
                        {comment.user?.username?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">{comment.user?.username}</Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          ID: {comment.user?.id}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Email: {comment.user?.email || 'N/A'}
                        </Typography>
                        {comment.user?.is_staff && (
                          <Chip size="small" label="Staff" color="info" sx={{ mt: 0.5, height: 20 }} />
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Post Info */}
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CommentIcon fontSize="small" color="primary" /> Post Information
                    </Typography>
                    <Box>
                      <Typography variant="body2">
                        <strong>Title:</strong> {comment.post?.title || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Post ID:</strong> {comment.post?.id}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Author:</strong> {comment.post?.user__username || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Category:</strong> {comment.post?.category__name || 'Uncategorized'}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        href={`/admin/posts/${comment.post?.id}`}
                        target="_blank"
                        sx={{ mt: 1 }}
                      >
                        View Full Post
                      </Button>
                    </Box>
                  </Paper>
                </Grid>

                {/* Comment Content */}
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Comment Content
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        whiteSpace: 'pre-wrap', 
                        bgcolor: 'action.hover', 
                        p: 2, 
                        borderRadius: 1,
                        fontStyle: comment.content ? 'normal' : 'italic',
                        color: comment.content ? 'text.primary' : 'text.secondary'
                      }}
                    >
                      {comment.content || 'No content'}
                    </Typography>
                    
                    {/* Media Attachments */}
                    {(comment.image_url || comment.video_url || comment.file_url) && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                          Attachments:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {comment.image_url && (
                            <Chip
                              icon={<ImageIcon />}
                              label="Image"
                              component="a"
                              href={comment.image_url}
                              target="_blank"
                              clickable
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {comment.video_url && (
                            <Chip
                              icon={<VideoIcon />}
                              label="Video"
                              component="a"
                              href={comment.video_url}
                              target="_blank"
                              clickable
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                          {comment.file_url && (
                            <Chip
                              icon={<AttachFileIcon />}
                              label="File"
                              component="a"
                              href={comment.file_url}
                              target="_blank"
                              clickable
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Status & Stats */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FlagIcon fontSize="small" color="primary" /> Status
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Pinned:</Typography>
                        <Chip
                          label={comment.is_pinned ? 'Yes' : 'No'}
                          icon={comment.is_pinned ? <CheckCircleIcon /> : <BlockIcon />}
                          color={comment.is_pinned ? 'success' : 'default'}
                          size="small"
                          sx={{ height: 24 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Hidden:</Typography>
                        <Chip
                          label={comment.is_hidden ? 'Yes' : 'No'}
                          icon={comment.is_hidden ? <VisibilityOffIcon /> : <ViewIcon />}
                          color={comment.is_hidden ? 'warning' : 'default'}
                          size="small"
                          sx={{ height: 24 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Spam:</Typography>
                        <Chip
                          label={comment.is_spam ? 'Yes' : 'No'}
                          icon={comment.is_spam ? <WarningIcon /> : <CheckCircleIcon />}
                          color={comment.is_spam ? 'error' : 'default'}
                          size="small"
                          sx={{ height: 24 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Edited:</Typography>
                        <Chip
                          label={comment.is_edited ? 'Yes' : 'No'}
                          variant="outlined"
                          size="small"
                          sx={{ height: 24 }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ThumbUpIcon fontSize="small" color="primary" /> Statistics
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Likes:</Typography>
                        <Typography variant="h6" color="primary.main">
                          {comment.likes_count || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Replies:</Typography>
                        <Typography variant="h6" color="secondary.main">
                          {comment.reply_count || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Total Comments Thread:</Typography>
                        <Typography variant="h6" color="info.main">
                          {comment.total_comments_count || 1}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Depth:</Typography>
                        <Typography variant="body1">
                          {comment.depth || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Parent Comment */}
                {comment.parent_comment && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReplyIcon fontSize="small" color="primary" /> Parent Comment
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar src={comment.parent_comment.user__profile_image} sx={{ width: 40, height: 40 }}>
                          {comment.parent_comment.user__username?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2">
                              {comment.parent_comment.user__username}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(comment.parent_comment.created_at)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {comment.parent_comment.content}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<OpenInNewIcon />}
                            onClick={() => window.open(`/admin/comments/${comment.parent_comment.id}`, '_blank')}
                            sx={{ mt: 1 }}
                          >
                            View Parent
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                )}

                {/* Metadata */}
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" color="primary" /> Metadata
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Created
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(comment.created_at)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Updated
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(comment.updated_at)}
                        </Typography>
                      </Grid>
                      {comment.edited_at && (
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="textSecondary" display="block">
                            Edited
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(comment.edited_at)}
                          </Typography>
                        </Grid>
                      )}
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Path
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {comment.path || 'N/A'}
                        </Typography>
                      </Grid>
                      {comment.ip_address && (
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="textSecondary" display="block">
                            IP Address
                          </Typography>
                          <Typography variant="body2">
                            {comment.ip_address}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Replies Tab */}
            <TabPanel value={tabValue} index={1}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Replies ({replies.length})
                </Typography>
                {repliesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : replies.length === 0 ? (
                  <Alert severity="info">No replies found for this comment.</Alert>
                ) : (
                  <List sx={{ width: '100%' }}>
                    {replies.map((reply) => (
                      <ListItem
                        key={reply.id}
                        alignItems="flex-start"
                        sx={{
                          px: 0,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar src={reply.user?.profile_image} sx={{ width: 40, height: 40 }}>
                            {reply.user?.username?.[0]?.toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle2">
                                {reply.user?.username}
                                {reply.is_hidden && (
                                  <Chip
                                    size="small"
                                    label="Hidden"
                                    icon={<VisibilityOffIcon />}
                                    sx={{ ml: 1, height: 18, fontSize: '0.6rem' }}
                                  />
                                )}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {formatDate(reply.created_at)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                {reply.content}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <ThumbUpIcon fontSize="small" sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="caption">{reply.likes_count || 0}</Typography>
                                </Box>
                                <Button
                                  size="small"
                                  startIcon={<OpenInNewIcon />}
                                  onClick={() => window.open(`/admin/comments/${reply.id}`, '_blank')}
                                  sx={{ fontSize: '0.7rem' }}
                                >
                                  View
                                </Button>
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </TabPanel>

            {/* Raw Data Tab */}
            <TabPanel value={tabValue} index={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Raw Comment Data
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'grey.900',
                    color: 'common.white',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 400
                  }}
                >
                  <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                    {JSON.stringify(comment, null, 2)}
                  </pre>
                </Box>
              </Paper>
            </TabPanel>
          </>
        ) : null}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<OpenInNewIcon />}
          onClick={handleViewInContext}
          disabled={actionLoading}
        >
          View in Context
        </Button>
        <Button
          variant="outlined"
          color={comment?.is_pinned ? 'success' : 'inherit'}
          startIcon={comment?.is_pinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
          onClick={handleTogglePin}
          disabled={actionLoading}
        >
          {comment?.is_pinned ? 'Unpin' : 'Pin'}
        </Button>
        <Button
          variant="outlined"
          color={comment?.is_hidden ? 'warning' : 'inherit'}
          startIcon={comment?.is_hidden ? <VisibilityOffIcon /> : <ViewIcon />}
          onClick={handleToggleHide}
          disabled={actionLoading}
        >
          {comment?.is_hidden ? 'Unhide' : 'Hide'}
        </Button>
        <Button
          variant="outlined"
          color={comment?.is_spam ? 'error' : 'inherit'}
          startIcon={<WarningIcon />}
          onClick={handleToggleSpam}
          disabled={actionLoading}
        >
          {comment?.is_spam ? 'Not Spam' : 'Mark as Spam'}
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDelete}
          disabled={actionLoading}
        >
          Delete
        </Button>
        <Button onClick={onClose} disabled={actionLoading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentDetailDialog;