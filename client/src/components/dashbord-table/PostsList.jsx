// src/components/PostsList.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Avatar,
  IconButton,
  Stack,
  Divider,
  Tabs,
  Tab,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  InputAdornment,
  CircularProgress,
  Tooltip,
  LinearProgress,
  Badge,
  Fade,
  CardMedia
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ThumbUp as ThumbUpIcon,
  ChatBubble as ChatBubbleIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  PostAdd as PostAddIcon,
  Comment as CommentIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  BarChart as BarChartIcon,
  Favorite as FavoriteIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import { dashboardAPI } from '../services/api';

const PostsContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh',
  padding: theme.spacing(3),
}));

const StatsCard = styled(Card)(({ theme, color }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  borderLeft: `4px solid ${color}`,
  transition: 'transform 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const ContentCard = styled(Card)(({ theme, type }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.3s',
  cursor: 'pointer',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)',
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 500,
    minHeight: 48,
    fontSize: '0.95rem',
  },
  '& .Mui-selected': {
    fontWeight: 600,
  },
}));

const EngagementBadge = styled(Chip)(({ theme, type }) => ({
  backgroundColor: 
    type === 'high' ? '#10B98120' :
    type === 'medium' ? '#F59E0B20' :
    '#6B728020',
  color: 
    type === 'high' ? '#10B981' :
    type === 'medium' ? '#F59E0B' :
    '#6B7280',
  fontWeight: 500,
  fontSize: '0.75rem',
}));

const PostsList = () => {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0,
    avgCommentsPerPost: 0,
    avgLikesPerPost: 0,
    totalEngagement: 0
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    type: null,
    title: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsRes, commentsRes] = await Promise.all([
        dashboardAPI.getPosts(),
        dashboardAPI.getComments()
      ]);

      // Demo data
      const demoPosts = [
        {
          id: 1,
          title: 'Introduction to React Hooks',
          content: 'React Hooks are an amazing feature that revolutionized functional components in React. They allow you to use state and other React features without writing a class.',
          author: { username: 'you', avatar: 'Y' },
          created_at: '2024-01-15T10:30:00Z',
          likes_count: 24,
          comments_count: 8,
          group: { name: 'Web Developers', id: 1 },
          tags: ['react', 'hooks', 'frontend'],
          engagement: 'high',
          views: 1245
        },
        {
          id: 2,
          title: 'Best Practices in UI/UX Design',
          content: 'Here are some tips to improve your designs: focus on user needs, maintain consistency, ensure accessibility, and test regularly with real users.',
          author: { username: 'you', avatar: 'Y' },
          created_at: '2024-01-14T14:20:00Z',
          likes_count: 18,
          comments_count: 12,
          group: { name: 'Design UX/UI', id: 2 },
          tags: ['design', 'uiux', 'best-practices'],
          engagement: 'high',
          views: 987
        },
        {
          id: 3,
          title: 'How to Start a Startup?',
          content: 'Based on personal experience: start with solving a real problem, validate your idea, build an MVP, and focus on customer acquisition from day one.',
          author: { username: 'you', avatar: 'Y' },
          created_at: '2024-01-13T09:15:00Z',
          likes_count: 45,
          comments_count: 22,
          group: { name: 'Startup Entrepreneurs', id: 3 },
          tags: ['startup', 'entrepreneurship', 'business'],
          engagement: 'very-high',
          views: 2456
        },
        {
          id: 4,
          title: 'Machine Learning for Beginners',
          content: 'A complete guide to start with ML: understand the basics, learn Python and libraries like scikit-learn, work on real projects, and keep learning.',
          author: { username: 'you', avatar: 'Y' },
          created_at: '2024-01-12T16:45:00Z',
          likes_count: 32,
          comments_count: 15,
          group: null,
          tags: ['ml', 'ai', 'datascience'],
          engagement: 'medium',
          views: 876
        },
        {
          id: 5,
          title: 'Modern Web Development Trends 2024',
          content: 'Explore the latest trends including serverless architecture, edge computing, WebAssembly, and AI-powered development tools.',
          author: { username: 'you', avatar: 'Y' },
          created_at: '2024-01-10T11:20:00Z',
          likes_count: 28,
          comments_count: 9,
          group: { name: 'Web Developers', id: 1 },
          tags: ['webdev', 'trends', '2024'],
          engagement: 'medium',
          views: 1123
        }
      ];

      const demoComments = [
        {
          id: 1,
          content: 'Excellent article! Very useful for beginners. The explanations are clear and the examples are practical.',
          author: { username: 'you', avatar: 'Y' },
          post: { title: 'Introduction to React Hooks', id: 1 },
          post_id: 1,
          created_at: '2024-01-15T11:30:00Z',
          likes_count: 5,
          replies_count: 2,
          is_edited: false
        },
        {
          id: 2,
          content: 'I disagree with point 3 about color schemes. In my experience, minimal color palettes work better for enterprise applications.',
          author: { username: 'you', avatar: 'Y' },
          post: { title: 'Best Practices in UI/UX Design', id: 2 },
          post_id: 2,
          created_at: '2024-01-14T15:20:00Z',
          likes_count: 2,
          replies_count: 0,
          is_edited: true
        },
        {
          id: 3,
          content: 'Thanks for these valuable tips! Especially the part about customer validation - that saved me months of work.',
          author: { username: 'you', avatar: 'Y' },
          post: { title: 'How to Start a Startup?', id: 3 },
          post_id: 3,
          created_at: '2024-01-13T10:15:00Z',
          likes_count: 8,
          replies_count: 1,
          is_edited: false
        },
        {
          id: 4,
          content: 'Could you elaborate more on custom hooks? Specifically about creating reusable hook patterns across large applications.',
          author: { username: 'you', avatar: 'Y' },
          post: { title: 'Introduction to React Hooks', id: 1 },
          post_id: 1,
          created_at: '2024-01-15T12:45:00Z',
          likes_count: 3,
          replies_count: 0,
          is_edited: false
        },
        {
          id: 5,
          content: 'Great overview! I would add that understanding linear algebra fundamentals is crucial before diving deep into ML algorithms.',
          author: { username: 'you', avatar: 'Y' },
          post: { title: 'Machine Learning for Beginners', id: 4 },
          post_id: 4,
          created_at: '2024-01-12T17:45:00Z',
          likes_count: 4,
          replies_count: 0,
          is_edited: false
        }
      ];

      const finalPosts = postsRes.data?.length > 0 ? postsRes.data : demoPosts;
      const finalComments = commentsRes.data?.length > 0 ? commentsRes.data : demoComments;

      setPosts(finalPosts);
      setComments(finalComments);

      // Calculate statistics
      const totalPosts = finalPosts.length;
      const totalComments = finalPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
      const totalLikes = finalPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const avgCommentsPerPost = totalPosts > 0 ? (totalComments / totalPosts).toFixed(1) : 0;
      const avgLikesPerPost = totalPosts > 0 ? (totalLikes / totalPosts).toFixed(1) : 0;
      const totalEngagement = finalPosts.reduce((sum, post) => {
        const engagement = (post.likes_count || 0) + (post.comments_count || 0);
        return sum + engagement;
      }, 0);

      setStats({
        totalPosts,
        totalComments,
        totalLikes,
        avgCommentsPerPost,
        avgLikesPerPost,
        totalEngagement
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load posts and comments',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    const data = activeTab === 0 ? posts : comments;
    
    if (!searchTerm.trim()) return data;
    
    const term = searchTerm.toLowerCase();
    if (activeTab === 0) {
      return data.filter(post => 
        post.title.toLowerCase().includes(term) ||
        post.content.toLowerCase().includes(term) ||
        (post.tags?.some(tag => tag.toLowerCase().includes(term))) ||
        (post.group?.name?.toLowerCase().includes(term))
      );
    } else {
      return data.filter(comment => 
        comment.content.toLowerCase().includes(term) ||
        comment.post?.title?.toLowerCase().includes(term)
      );
    }
  };

  const getEngagementLevel = (post) => {
    const engagementScore = (post.likes_count || 0) + (post.comments_count || 0);
    if (engagementScore > 50) return { level: 'very-high', label: 'Very High' };
    if (engagementScore > 30) return { level: 'high', label: 'High' };
    if (engagementScore > 15) return { level: 'medium', label: 'Medium' };
    return { level: 'low', label: 'Low' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleDelete = (id, type, title) => {
    setDeleteDialog({
      open: true,
      id,
      type,
      title
    });
  };

  const confirmDelete = () => {
    try {
      if (deleteDialog.type === 'post') {
        setPosts(posts.filter(post => post.id !== deleteDialog.id));
        setSnackbar({
          open: true,
          message: 'Post deleted successfully',
          severity: 'success'
        });
      } else {
        setComments(comments.filter(comment => comment.id !== deleteDialog.id));
        setSnackbar({
          open: true,
          message: 'Comment deleted successfully',
          severity: 'success'
        });
      }
      setDeleteDialog({ open: false, id: null, type: null, title: '' });
    } catch (error) {
      console.error('Error deleting:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete',
        severity: 'error'
      });
    }
  };

  const handleEdit = (id, type) => {
    console.log(`Editing ${type} ${id}`);
    // Implement edit logic
    setSnackbar({
      open: true,
      message: `Edit ${type} functionality coming soon`,
      severity: 'info'
    });
  };

  const handleShare = (id, type) => {
    console.log(`Sharing ${type} ${id}`);
    // Implement share logic
    setSnackbar({
      open: true,
      message: `Share ${type} functionality coming soon`,
      severity: 'info'
    });
  };

  const statsCards = [
    {
      title: 'Total Posts',
      value: stats.totalPosts,
      icon: <PostAddIcon />,
      color: '#6366F1',
      trend: '+15%',
      description: 'Posts created'
    },
    {
      title: 'Total Comments',
      value: stats.totalComments,
      icon: <CommentIcon />,
      color: '#10B981',
      trend: '+22%',
      description: 'Comments received'
    },
    {
      title: 'Total Likes',
      value: stats.totalLikes,
      icon: <FavoriteIcon />,
      color: '#EC4899',
      trend: '+18%',
      description: 'Likes received'
    },
    {
      title: 'Avg Comments/Post',
      value: stats.avgCommentsPerPost,
      icon: <ChatBubbleIcon />,
      color: '#F59E0B',
      trend: '+8%',
      description: 'Average engagement'
    },
    {
      title: 'Avg Likes/Post',
      value: stats.avgLikesPerPost,
      icon: <ThumbUpIcon />,
      color: '#8B5CF6',
      trend: '+12%',
      description: 'Average popularity'
    },
    {
      title: 'Total Engagement',
      value: stats.totalEngagement,
      icon: <BarChartIcon />,
      color: '#3B82F6',
      trend: '+20%',
      description: 'Total interactions'
    }
  ];

  const tabLabels = [
    { label: 'My Posts', count: posts.length, icon: <PostAddIcon /> },
    { label: 'My Comments', count: comments.length, icon: <CommentIcon /> }
  ];

  const filteredData = getFilteredData();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Loading Posts & Comments...
        </Typography>
      </Box>
    );
  }

  return (
    <PostsContainer>
      <Container maxWidth="xl">
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="600">
              Posts & Comments
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage your posts and comments across the platform
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
            >
              Refresh
            </Button>
            {activeTab === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => console.log('Create new post')}
              >
                New Post
              </Button>
            )}
          </Stack>
        </Box>

        {/* Search and Filter */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder={`Search ${activeTab === 0 ? 'posts' : 'comments'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2} alignItems="center">
                <FilterIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  Sort by:
                </Typography>
                <TextField
                  select
                  size="small"
                  defaultValue="newest"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="newest">Newest</MenuItem>
                  <MenuItem value="oldest">Oldest</MenuItem>
                  <MenuItem value="popular">Most Popular</MenuItem>
                  <MenuItem value="engagement">Engagement</MenuItem>
                </TextField>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          {statsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <StatsCard color={stat.color}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Avatar
                        sx={{
                          backgroundColor: `${stat.color}20`,
                          color: stat.color,
                          width: 48,
                          height: 48,
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                      <Chip
                        label={stat.trend}
                        size="small"
                        sx={{
                          backgroundColor: stat.trend.startsWith('+') ? '#10B98120' : '#EF444420',
                          color: stat.trend.startsWith('+') ? '#10B981' : '#EF4444',
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="h3" fontWeight="700">
                        {typeof stat.value === 'number' && stat.value % 1 !== 0 
                          ? parseFloat(stat.value).toFixed(1)
                          : stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {stat.title}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {stat.description}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </StatsCard>
            </Grid>
          ))}
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 4, borderRadius: 2 }}>
          <StyledTabs
            value={activeTab}
            onChange={(e, value) => setActiveTab(value)}
            variant="fullWidth"
          >
            {tabLabels.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                iconPosition="start"
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {tab.label}
                    <Chip
                      label={tab.count}
                      size="small"
                      sx={{ height: 20, fontSize: '0.75rem' }}
                    />
                  </Box>
                }
              />
            ))}
          </StyledTabs>
        </Paper>

        {/* Content List */}
        {filteredData.length > 0 ? (
          <Grid container spacing={3}>
            {filteredData.map((item) => (
              <Grid item xs={12} key={item.id}>
                {activeTab === 0 ? (
                  <PostCard 
                    post={item}
                    onEdit={() => handleEdit(item.id, 'post')}
                    onDelete={() => handleDelete(item.id, 'post', item.title)}
                    onShare={() => handleShare(item.id, 'post')}
                    getEngagementLevel={getEngagementLevel}
                    formatDate={formatDate}
                    truncateText={truncateText}
                  />
                ) : (
                  <CommentCard 
                    comment={item}
                    onEdit={() => handleEdit(item.id, 'comment')}
                    onDelete={() => handleDelete(item.id, 'comment', 'comment')}
                    onShare={() => handleShare(item.id, 'comment')}
                    formatDate={formatDate}
                    truncateText={truncateText}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper
            sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 2,
            }}
          >
            {activeTab === 0 ? (
              <PostAddIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            ) : (
              <CommentIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            )}
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No {activeTab === 0 ? 'Posts' : 'Comments'} Found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {searchTerm 
                ? `No ${activeTab === 0 ? 'posts' : 'comments'} match your search criteria`
                : activeTab === 0
                  ? 'You haven\'t created any posts yet'
                  : 'You haven\'t posted any comments yet'}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </Button>
              {activeTab === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => console.log('Create new post')}
                >
                  Create Your First Post
                </Button>
              )}
            </Stack>
          </Paper>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, id: null, type: null, title: '' })}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this {deleteDialog.type}?
              {deleteDialog.type === 'post' && (
                <Typography component="span" fontWeight="600" sx={{ ml: 1 }}>
                  "{deleteDialog.title}"
                </Typography>
              )}
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialog({ open: false, id: null, type: null, title: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </PostsContainer>
  );
};

// Post Card Component
const PostCard = ({ post, onEdit, onDelete, onShare, getEngagementLevel, formatDate, truncateText }) => {
  const engagement = getEngagementLevel(post);
  
  return (
    <ContentCard type="post" elevation={2}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                {post.title}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  icon={<PersonIcon sx={{ fontSize: 14 }} />}
                  label={post.author?.username || 'You'}
                  size="small"
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary">
                  <ScheduleIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                  {formatDate(post.created_at)}
                </Typography>
                {post.group && (
                  <Chip
                    icon={<GroupIcon sx={{ fontSize: 14 }} />}
                    label={post.group.name}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
                <EngagementBadge
                  label={`Engagement: ${engagement.label}`}
                  type={engagement.level}
                  size="small"
                />
              </Stack>
            </Box>
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </Box>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {post.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  sx={{
                    backgroundColor: 'primary.50',
                    color: 'primary.main',
                    fontSize: '0.75rem',
                  }}
                />
              ))}
            </Stack>
          )}

          {/* Content */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              maxHeight: 120,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {truncateText(post.content)}
            </Typography>
            {post.content.length > 150 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 40,
                  background: 'linear-gradient(transparent, #f8f9fa)',
                }}
              />
            )}
          </Paper>

          {/* Stats and Actions */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={3}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <ThumbUpIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight="500">
                  {post.likes_count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Likes
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <ChatBubbleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                <Typography variant="body2" fontWeight="500">
                  {post.comments_count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Comments
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <VisibilityIcon sx={{ fontSize: 18, color: 'info.main' }} />
                <Typography variant="body2" fontWeight="500">
                  {post.views || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Views
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Edit post">
                <IconButton size="small" onClick={onEdit} color="primary">
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share post">
                <IconButton size="small" onClick={onShare} color="info">
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete post">
                <IconButton size="small" onClick={onDelete} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </ContentCard>
  );
};

// Comment Card Component
const CommentCard = ({ comment, onEdit, onDelete, onShare, formatDate, truncateText }) => {
  return (
    <ContentCard type="comment" elevation={1}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                Comment on: {comment.post?.title}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  icon={<PersonIcon sx={{ fontSize: 14 }} />}
                  label={comment.author?.username || 'You'}
                  size="small"
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary">
                  <ScheduleIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                  {formatDate(comment.created_at)}
                </Typography>
                {comment.is_edited && (
                  <Chip
                    label="Edited"
                    size="small"
                    variant="outlined"
                    color="warning"
                  />
                )}
              </Stack>
            </Box>
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </Box>

          {/* Content */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              borderLeft: '3px solid',
              borderLeftColor: 'primary.main',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {truncateText(comment.content, 200)}
            </Typography>
          </Paper>

          {/* Stats and Actions */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={3}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <ThumbUpIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight="500">
                  {comment.likes_count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Likes
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <ChatBubbleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                <Typography variant="body2" fontWeight="500">
                  {comment.replies_count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Replies
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Edit comment">
                <IconButton size="small" onClick={onEdit} color="primary">
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share comment">
                <IconButton size="small" onClick={onShare} color="info">
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete comment">
                <IconButton size="small" onClick={onDelete} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </ContentCard>
  );
};

export default PostsList;