// src/components/dashboard-admin/components/Views/PostDetailsDialog.jsx
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
  Tabs,
  Tab,
  Grid,
  Paper,
  Avatar,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Card,
  CardContent,
  Tooltip,

  CircularProgress
} from '@mui/material';
import { useSnackbar } from '../comments/hooks/useSnackbar';

import {
  Visibility as ViewIcon,
  BarChart as ChartIcon,
  Comment as CommentIcon,
  PhotoLibrary as GalleryIcon,
  TrendingUp as TrendingIcon,
  Person as PersonIcon,
  AttachFile as AttachIcon,
  Star as StarIcon,
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Verified as VerifiedIcon,
  Bolt as BoltIcon,
  ThumbUp as ThumbUpIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  ChatBubble as ChatBubbleIcon,
  MoreVert as MoreIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  StackedLineChart as LineChartIcon,
  Equalizer as EqualizerIcon,
  Launch as LaunchIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { useCommentsData } from '../comments/hooks/useCommentsData';
import useAdminApi from '../../../../hooks/useAdminApi';
const PostDetailsDialog = ({ open, post, onClose, onDelete, onViewPost, onOpenMedia }) => {
  const [detailTab, setDetailTab] = useState(0);
 const {
  showSnackbar,
 } = useSnackbar()
  const {
    handleDeleteComment,
    localSearch,
    setLocalSearch
  } = useCommentsData({

    showSnackbar,
  });
  // Reset quand le dialog se ferme
  useEffect(() => {
    if (!open) {
      setDetailTab(0);
    }
  }, [open]);

  const getPostMedia = (post) => {
    if (!post) return [];
    const media = [];

    // Image principale du post (si disponible)
    if (post.image_url || post.image) {
      media.push({
        url: post.image_url || post.image,
        type: 'image',
        title: 'Main image'
      });
    }

    // Images/vidéos/fichiers des commentaires
    if (post.all_comment && Array.isArray(post.all_comment)) {
      post.all_comment.forEach(comment => {
        if (comment.image) {
          media.push({
            url: comment.image,
            type: 'image',
            title: `Comment image`,
            comment_id: comment.id
          });
        }
        if (comment.file) {
          media.push({
            url: comment.file,
            type: 'file',
            title: `Attachment`,
            comment_id: comment.id
          });
        }
        if (comment.video) {
          media.push({
            url: comment.video,
            type: 'video',
            title: `Video`,
            comment_id: comment.id
          });
        }
      });
    }

    return media;
  };

  const calculateEngagement = (post) => {
    if (!post) return 0;
    const comments = post.comment_count || 0;
    const views = post.view_count || 1;
    return Math.round((comments / views) * 100);
  };

  const calculateScore = (post) => {
    if (!post) return '0.0';
    const averageRating = post.average_rating || 0;
    const engagement = calculateEngagement(post) / 100;
    const recency = calculateRecencyBonus(post);
    return (averageRating * 0.6 + engagement * 0.2 + recency * 0.2).toFixed(1);
  };

  const calculateRecencyBonus = (post) => {
    if (!post || !post.created_at) return 0.2;
    const postDate = new Date(post.created_at);
    const now = new Date();
    const diffHours = (now - postDate) / (1000 * 60 * 60);

    if (diffHours < 24) return 1.0;
    if (diffHours < 168) return 0.7;
    if (diffHours < 720) return 0.4;
    return 0.2;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatCompactNumber = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleTabChange = (event, newValue) => {
    setDetailTab(newValue);
  };

  const handleClickAvatar = () => {
    if (post?.user_id) {
      window.location.href = `/admin/users/${post.user_id}/edit`;
    }
  };

  const handleViewComment = (commentId) => {
    if (commentId) {
      window.open(`/user/${post.user_id}/posts/${post.id}?comment=${commentId}`, '_blank');
    }
  };


const handleDeleteConfirm = async (commentId) => {
    if (commentId) {
      await handleDeleteComment(commentId);

    }
  };

  const MetricCard = ({ icon, value, label, sublabel, color = 'primary', trend = 0 }) => (
    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', position: 'relative' }}>
      <Box sx={{
        mb: 1,
        color: `${color}.main`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {icon}
      </Box>
      <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
        {typeof value === 'number' ? formatCompactNumber(value) : value}
      </Typography>
      <Typography variant="body2" fontWeight="medium" sx={{ mt: 0.5 }}>
        {label}
      </Typography>
      {sublabel && (
        <Typography variant="caption" color="textSecondary">
          {sublabel}
        </Typography>
      )}
    </Paper>
  );

  const StatItem = ({ label, value, progress, color = 'primary' }) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="textSecondary">{label}</Typography>
        <Typography variant="body2" fontWeight="medium">{value}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(progress, 100)}
        color={color}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  );

  // Graphiques avec données réelles
  const EngagementChart = () => {
    // Données simulées car la vue ne fournit pas de données temporelles
    const mockData = [
      { day: 'Day 1', views: Math.round((post?.view_count || 0) * 0.1), comments: Math.round((post?.comment_count || 0) * 0.1) },
      { day: 'Day 2', views: Math.round((post?.view_count || 0) * 0.15), comments: Math.round((post?.comment_count || 0) * 0.15) },
      { day: 'Day 3', views: Math.round((post?.view_count || 0) * 0.2), comments: Math.round((post?.comment_count || 0) * 0.2) },
      { day: 'Day 4', views: Math.round((post?.view_count || 0) * 0.25), comments: Math.round((post?.comment_count || 0) * 0.25) },
      { day: 'Day 5', views: Math.round((post?.view_count || 0) * 0.2), comments: Math.round((post?.comment_count || 0) * 0.2) },
      { day: 'Day 6', views: Math.round((post?.view_count || 0) * 0.1), comments: Math.round((post?.comment_count || 0) * 0.1) },
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <RechartsTooltip />
          <Legend />
          <Area type="monotone" dataKey="views" stroke="#1976d2" fill="#1976d2" fillOpacity={0.3} name="Views" />
          <Area type="monotone" dataKey="comments" stroke="#ed6c02" fill="#ed6c02" fillOpacity={0.3} name="Comments" />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const DistributionPieChart = () => {
    const commentCount = post?.comment_count || 0;
    const viewCount = post?.view_count || 1;

    const data = [
      { name: 'Comments', value: commentCount, color: '#ed6c02' },
      { name: 'Views without comments', value: Math.max(viewCount - commentCount, 0), color: '#1976d2' },
    ];

    return (
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip formatter={(value) => [value, 'Count']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const CommentItem = ({ comment }) => (
    <ListItem
      alignItems="flex-start"
      sx={{
        py: 2,
        px: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' }
      }}
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View comment">
            <IconButton 
              edge="end" 
              aria-label="view"
              onClick={() => handleViewComment(comment.id)}
              size="small"
              color="primary"
            >
              <LaunchIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        {/*
          <Tooltip title="Delete comment">
            <IconButton 
              edge="end" 
              aria-label="delete"
              onClick={(e) => handleDeleteComment(comment.id, e)}
              size="small"
              color="error"
            >
              <DeleteForeverIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        */}
        </Box>
      }
    >
      <ListItemAvatar>
        <Avatar
          src={comment.user__profile__image || ''}
          sx={{ bgcolor: 'primary.main' }}
        >
          {comment.user__username?.[0]?.toUpperCase() || 'U'}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 8 }}>
            <Typography variant="subtitle2" fontWeight="medium">
              {comment.user__username || 'Anonymous User'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatDate(comment.created_at)}
            </Typography>
          </Box>
        }
        secondary={
          <>
            <Typography variant="body2" color="text.primary" sx={{ mt: 1, mb: 1, whiteSpace: 'pre-wrap', pr: 8 }}>
              {comment.content}
            </Typography>
            {comment.image && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <img
                  src={comment.image}
                  alt="Comment attachment"
                  style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }}
                />
              </Box>
            )}
            {comment.file && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Chip
                  icon={<AttachIcon />}
                  label="Attachment"
                  component="a"
                  href={comment.file}
                  target="_blank"
                  clickable
                  size="small"
                />
              </Box>
            )}
            {comment.video && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Chip
                  icon={<AttachIcon />}
                  label="Video"
                  component="a"
                  href={comment.video}
                  target="_blank"
                  clickable
                  size="small"
                  color="secondary"
                />
              </Box>
            )}
          </>
        }
      />
    </ListItem>
  );

  // Vérifier si post est défini
  if (!post) return null;

  // Utiliser les données du post telles qu'elles viennent de la vue Django
  const postData = {
    ...post,
    comment_count: post.comment_count || 0,
    view_count: post.view_count || 0,
    average_rating: post.average_rating || 0,
    total_ratings: post.total_ratings || 0,
    is_sponsored: post.is_sponsored || false,
    is_sponsored_count: post.is_sponsored_count || 0,
    sponsored_info: post.sponsored_info || null,
    category_name: post.category_name || 'Uncategorized',
    user_username: post.user_username || 'Unknown User',
    image_profile: post.image_profile || '',
    profile_id: post.profile_id || null,
    all_comment: post.all_comment || []
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>{post.title || 'Untitled Post'}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={postData.category_name} color="primary" size="small" />
              {postData.is_sponsored && (
                <Chip
                  icon={<VerifiedIcon />}
                  label={`Sponsored ${postData.is_sponsored_count > 1 ? `(${postData.is_sponsored_count})` : ''}`}
                  color="secondary"
                  size="small"
                />
              )}
              <Chip
                icon={<CalendarIcon />}
                label={post.created_at ? new Date(post.created_at).toLocaleDateString() : 'N/A'}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            onClick={onViewPost}
            disabled={!post.id}
          >
            View Post
          </Button>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent dividers>
        <Tabs value={detailTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Information" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Statistics" icon={<ChartIcon />} iconPosition="start" />
          <Tab label="Comments" icon={<CommentIcon />} iconPosition="start" />
          <Tab label="Media" icon={<GalleryIcon />} iconPosition="start" />
          <Tab label="Analytics" icon={<EqualizerIcon />} iconPosition="start" />
        </Tabs>

        {detailTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon /> Author Information
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={postData.image_profile}
                    sx={{ width: 60, height: 60, cursor: 'pointer', bgcolor: 'primary.main' }}
                    onClick={handleClickAvatar}
                  >
                    {postData.user_username?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{postData.user_username}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      User ID: {post.user_id || 'N/A'}
                    </Typography>
                    {postData.profile_id && (
                      <Typography variant="caption" color="textSecondary">
                        Profile ID: {postData.profile_id}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachIcon /> Post Content
                </Typography>
                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {post.content || 'No content available'}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <MetricCard
                    icon={<StarIcon color="warning" />}
                    value={postData.average_rating.toFixed(1)}
                    label="Average Rating"
                    sublabel={`${postData.total_ratings} votes`}
                    color="warning"
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <MetricCard
                    icon={<CommentIcon color="info" />}
                    value={postData.comment_count}
                    label="Comments"
                    sublabel="Total"
                    color="info"
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <MetricCard
                    icon={<ViewIcon color="primary" />}
                    value={postData.view_count}
                    label="Views"
                    sublabel="Total"
                    color="primary"
                  />
                </Grid>
              </Grid>
            </Grid>

            {postData.sponsored_info && postData.sponsored_info.is_active && (
              <Grid item xs={12}>
                <Alert severity="info" icon={<VerifiedIcon />}>
                  <Typography variant="subtitle2" gutterBottom>
                    Sponsored Campaign Information
                  </Typography>
                  <Typography variant="body2">
                    Campaign ID: {postData.sponsored_info.campaign_id}<br />
                    Boost Ends: {formatDate(postData.sponsored_info.boost_end)}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        )}

        {detailTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon /> Views & Comments Over Time
                  </Typography>
                  <EngagementChart />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PieChartIcon /> Comments vs Views
                  </Typography>
                  <DistributionPieChart />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EqualizerIcon /> Detailed Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <StatItem
                        label="Engagement Rate (Comments/Views)"
                        value={`${calculateEngagement(postData)}%`}
                        progress={calculateEngagement(postData)}
                        color="success"
                      />
                      <StatItem
                        label="Average Rating"
                        value={postData.average_rating.toFixed(1)}
                        progress={(postData.average_rating / 5) * 100}
                        color="warning"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <StatItem
                        label="Comment to View Ratio"
                        value={`${Math.round(((postData.comment_count || 0) / Math.max(postData.view_count || 1, 1)) * 100)}%`}
                        progress={Math.round(((postData.comment_count || 0) / Math.max(postData.view_count || 1, 1)) * 100)}
                        color="info"
                      />
                      <StatItem
                        label="Rating Participation"
                        value={`${Math.round((postData.total_ratings / Math.max(postData.view_count || 1, 1)) * 100)}%`}
                        progress={Math.round((postData.total_ratings / Math.max(postData.view_count || 1, 1)) * 100)}
                        color="secondary"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {detailTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CommentIcon /> Comments ({postData.comment_count})
              </Typography>
            </Box>

            {postData.all_comment && postData.all_comment.length > 0 ? (
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {postData.all_comment.map((comment, index) => (
                  <CommentItem key={comment.id || index} comment={comment} />
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No comments available for this post.
              </Alert>
            )}
          </Box>
        )}

        {detailTab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Media ({getPostMedia(post).length})
            </Typography>
            {getPostMedia(post).length > 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                This post has {getPostMedia(post).length} attached file(s).
                <Button
                  size="small"
                  onClick={onOpenMedia}
                  sx={{ ml: 1 }}
                >
                  View All Media
                </Button>
              </Alert>
            ) : (
              <Alert severity="info">
                No media attached to this post
              </Alert>
            )}
          </Box>
        )}

        {detailTab === 4 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrophyIcon /> Performance Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main">
                          {postData.average_rating.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">Average Rating</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {calculateRecencyBonus(postData).toFixed(1)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">Recency Score</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {formatCompactNumber(Math.round((postData.view_count || 0) / 30))}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">Daily Avg Views</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {calculateScore(postData)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">Overall Score</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onDelete}
        >
          Delete Post
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PostDetailsDialog;