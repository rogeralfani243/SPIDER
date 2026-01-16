// src/components/FollowersList.jsx
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  CardMedia,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Message as MessageIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Verified as VerifiedIcon,
  Block as BlockIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import { dashboardAPI } from '../services/api';

const FollowersContainer = styled(Box)(({ theme }) => ({
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

const UserCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.3s',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)',
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(3),
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

const FollowersList = () => {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    userId: null,
    userName: '',
    type: null // 'unfollow' or 'remove'
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchFollowersData();
  }, []);

  const fetchFollowersData = async () => {
    try {
      setLoading(true);
      
      // Demo data
      const demoFollowers = [
        {
          id: 1,
          username: 'john_doe',
          name: 'John Doe',
          avatar: 'JD',
          followed_at: '2024-01-15T10:30:00Z',
          email: 'john@example.com',
          is_verified: true,
          mutual_followers: 12,
          last_active: '2 hours ago',
          location: 'New York, USA',
          bio: 'Full-stack developer passionate about React and Node.js',
          tags: ['developer', 'react', 'opensource'],
          engagement: 'high'
        },
        {
          id: 2,
          username: 'jane_smith',
          name: 'Jane Smith',
          avatar: 'JS',
          followed_at: '2024-01-14T14:20:00Z',
          email: 'jane@example.com',
          is_verified: true,
          mutual_followers: 8,
          last_active: '5 hours ago',
          location: 'London, UK',
          bio: 'UI/UX Designer | Creating beautiful user experiences',
          tags: ['designer', 'uiux', 'figma'],
          engagement: 'medium'
        },
        {
          id: 3,
          username: 'alex_wong',
          name: 'Alex Wong',
          avatar: 'AW',
          followed_at: '2024-01-13T09:15:00Z',
          email: 'alex@example.com',
          is_verified: false,
          mutual_followers: 5,
          last_active: '1 day ago',
          location: 'San Francisco, USA',
          bio: 'Product Manager | Startup enthusiast',
          tags: ['product', 'startup', 'tech'],
          engagement: 'high'
        },
        {
          id: 4,
          username: 'sara_jones',
          name: 'Sara Jones',
          avatar: 'SJ',
          followed_at: '2024-01-12T16:45:00Z',
          email: 'sara@example.com',
          is_verified: true,
          mutual_followers: 15,
          last_active: '3 hours ago',
          location: 'Berlin, Germany',
          bio: 'Data Scientist | Machine Learning Researcher',
          tags: ['datascience', 'ml', 'python'],
          engagement: 'very-high'
        },
        {
          id: 5,
          username: 'mike_brown',
          name: 'Mike Brown',
          avatar: 'MB',
          followed_at: '2024-01-11T11:20:00Z',
          email: 'mike@example.com',
          is_verified: false,
          mutual_followers: 3,
          last_active: '2 days ago',
          location: 'Toronto, Canada',
          bio: 'DevOps Engineer | Cloud Infrastructure',
          tags: ['devops', 'aws', 'kubernetes'],
          engagement: 'medium'
        },
        {
          id: 6,
          username: 'emily_chen',
          name: 'Emily Chen',
          avatar: 'EC',
          followed_at: '2024-01-10T08:30:00Z',
          email: 'emily@example.com',
          is_verified: true,
          mutual_followers: 20,
          last_active: 'Just now',
          location: 'Sydney, Australia',
          bio: 'Mobile Developer | React Native & Flutter',
          tags: ['mobile', 'react-native', 'flutter'],
          engagement: 'very-high'
        },
        {
          id: 7,
          username: 'david_kim',
          name: 'David Kim',
          avatar: 'DK',
          followed_at: '2024-01-09T13:15:00Z',
          email: 'david@example.com',
          is_verified: false,
          mutual_followers: 7,
          last_active: '1 week ago',
          location: 'Seoul, South Korea',
          bio: 'Backend Engineer | Microservices Architecture',
          tags: ['backend', 'java', 'microservices'],
          engagement: 'low'
        },
        {
          id: 8,
          username: 'lisa_wang',
          name: 'Lisa Wang',
          avatar: 'LW',
          followed_at: '2024-01-08T15:40:00Z',
          email: 'lisa@example.com',
          is_verified: true,
          mutual_followers: 18,
          last_active: '4 hours ago',
          location: 'Singapore',
          bio: 'Frontend Developer | Vue.js Specialist',
          tags: ['frontend', 'vue', 'javascript'],
          engagement: 'high'
        }
      ];

      const demoFollowing = [
        {
          id: 9,
          username: 'tech_guru',
          name: 'Tech Guru',
          avatar: 'TG',
          followed_at: '2024-01-10T08:30:00Z',
          email: 'tech@example.com',
          is_verified: true,
          mutual_followers: 25,
          last_active: '1 hour ago',
          location: 'Silicon Valley, USA',
          bio: 'Tech Influencer | Sharing latest tech trends',
          tags: ['influencer', 'tech', 'trends'],
          engagement: 'very-high',
          follows_back: true
        },
        {
          id: 10,
          username: 'design_master',
          name: 'Design Master',
          avatar: 'DM',
          followed_at: '2024-01-09T13:15:00Z',
          email: 'design@example.com',
          is_verified: true,
          mutual_followers: 32,
          last_active: '3 hours ago',
          location: 'Los Angeles, USA',
          bio: 'Creative Director | Design Thinking Advocate',
          tags: ['design', 'creative', 'leadership'],
          engagement: 'high',
          follows_back: true
        },
        {
          id: 11,
          username: 'code_ninja',
          name: 'Code Ninja',
          avatar: 'CN',
          followed_at: '2024-01-08T15:40:00Z',
          email: 'code@example.com',
          is_verified: false,
          mutual_followers: 15,
          last_active: '2 days ago',
          location: 'Remote',
          bio: 'Open Source Contributor | Full Stack Wizard',
          tags: ['opensource', 'fullstack', 'contributor'],
          engagement: 'medium',
          follows_back: false
        },
        {
          id: 12,
          username: 'startup_ceo',
          name: 'Startup CEO',
          avatar: 'SC',
          followed_at: '2024-01-07T11:20:00Z',
          email: 'ceo@example.com',
          is_verified: true,
          mutual_followers: 42,
          last_active: '6 hours ago',
          location: 'Austin, USA',
          bio: 'Serial Entrepreneur | Venture Capitalist',
          tags: ['entrepreneur', 'vc', 'startup'],
          engagement: 'very-high',
          follows_back: true
        },
        {
          id: 13,
          username: 'ai_researcher',
          name: 'AI Researcher',
          avatar: 'AR',
          followed_at: '2024-01-06T09:45:00Z',
          email: 'ai@example.com',
          is_verified: true,
          mutual_followers: 28,
          last_active: '1 day ago',
          location: 'Cambridge, UK',
          bio: 'AI Researcher | PhD in Computer Science',
          tags: ['ai', 'research', 'academia'],
          engagement: 'high',
          follows_back: false
        }
      ];

      setFollowers(demoFollowers);
      setFollowing(demoFollowing);
    } catch (error) {
      console.error('Error fetching followers data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load followers data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    const data = activeTab === 0 ? followers : following;
    
    let filtered = [...data];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply engagement filter
    if (filter !== 'all') {
      filtered = filtered.filter(user => user.engagement === filter);
    }
    
    return filtered;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEngagementColor = (engagement) => {
    switch(engagement) {
      case 'very-high': return '#10B981';
      case 'high': return '#3B82F6';
      case 'medium': return '#F59E0B';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getEngagementLabel = (engagement) => {
    switch(engagement) {
      case 'very-high': return 'Very High';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  };

  const handleUnfollow = (userId, userName) => {
    setDeleteDialog({
      open: true,
      userId,
      userName,
      type: 'unfollow'
    });
  };

  const handleRemoveFollower = (userId, userName) => {
    setDeleteDialog({
      open: true,
      userId,
      userName,
      type: 'remove'
    });
  };

  const confirmAction = () => {
    try {
      if (deleteDialog.type === 'unfollow') {
        setFollowing(following.filter(user => user.id !== deleteDialog.userId));
        setSnackbar({
          open: true,
          message: `Unfollowed ${deleteDialog.userName}`,
          severity: 'success'
        });
      } else {
        setFollowers(followers.filter(user => user.id !== deleteDialog.userId));
        setSnackbar({
          open: true,
          message: `Removed ${deleteDialog.userName} from followers`,
          severity: 'success'
        });
      }
      setDeleteDialog({ open: false, userId: null, userName: '', type: null });
    } catch (error) {
      console.error('Error performing action:', error);
      setSnackbar({
        open: true,
        message: 'Failed to perform action',
        severity: 'error'
      });
    }
  };

  const handleMessage = (userId, userName) => {
    console.log('Messaging user:', userId, userName);
    setSnackbar({
      open: true,
      message: `Messaging ${userName}`,
      severity: 'info'
    });
  };

  const handleFollowBack = (userId, userName) => {
    const userToFollow = followers.find(f => f.id === userId);
    if (userToFollow) {
      setFollowing([userToFollow, ...following]);
      setSnackbar({
        open: true,
        message: `Started following ${userName}`,
        severity: 'success'
      });
    }
  };

  const getStats = () => {
    const totalFollowers = followers.length;
    const totalFollowing = following.length;
    const mutualFollowers = followers.filter(f => 
      following.some(followingUser => followingUser.username === f.username)
    ).length;
    const verifiedFollowers = followers.filter(f => f.is_verified).length;
    const highEngagementFollowers = followers.filter(f => f.engagement === 'high' || f.engagement === 'very-high').length;
    const followsBack = following.filter(f => f.follows_back).length;
    
    return {
      totalFollowers,
      totalFollowing,
      mutualFollowers,
      verifiedFollowers,
      highEngagementFollowers,
      followsBack,
      difference: totalFollowers - totalFollowing
    };
  };

  const stats = getStats();
  const statsCards = [
    {
      title: 'Followers',
      value: stats.totalFollowers,
      icon: <PeopleIcon />,
      color: '#6366F1',
      trend: '+12 this month',
      description: 'People following you'
    },
    {
      title: 'Following',
      value: stats.totalFollowing,
      icon: <PersonAddIcon />,
      color: '#10B981',
      trend: '+5 this month',
      description: 'People you follow'
    },
    {
      title: 'Mutual',
      value: stats.mutualFollowers,
      icon: <CheckCircleIcon />,
      color: '#EC4899',
      trend: '+8 this month',
      description: 'Both following each other'
    },
    {
      title: 'Verified',
      value: stats.verifiedFollowers,
      icon: <VerifiedIcon />,
      color: '#F59E0B',
      trend: '45% of followers',
      description: 'Verified accounts'
    },
    {
      title: 'High Engagement',
      value: stats.highEngagementFollowers,
      icon: <TrendingUpIcon />,
      color: '#8B5CF6',
      trend: '68% engagement rate',
      description: 'Active followers'
    },
    {
      title: 'Follows Back',
      value: stats.followsBack,
      icon: <PersonIcon />,
      color: '#3B82F6',
      trend: `${Math.round((stats.followsBack / stats.totalFollowing) * 100) || 0}% rate`,
      description: 'People who follow back'
    }
  ];

  const tabLabels = [
    { label: 'Followers', count: followers.length, icon: <PeopleIcon /> },
    { label: 'Following', count: following.length, icon: <PersonAddIcon /> }
  ];

  const filteredData = getFilteredData();
  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
          Loading Followers...
        </Typography>
      </Box>
    );
  }

  return (
    <FollowersContainer>
      <Container maxWidth="xl">
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="600">
              Followers Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage your followers and following lists
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchFollowersData}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => console.log('Find people to follow')}
            >
              Find People
            </Button>
          </Stack>
        </Box>

        {/* Search and Filter */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search followers by name, username, or bio..."
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
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <FilterIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  Engagement:
                </Typography>
                <TextField
                  select
                  size="small"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="all">All Engagement</MenuItem>
                  <MenuItem value="very-high">Very High</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
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
                          backgroundColor: stat.trend.includes('+') ? '#10B98120' : '#6B728020',
                          color: stat.trend.includes('+') ? '#10B981' : '#6B7280',
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="h3" fontWeight="700">
                        {stat.value}
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
            onChange={(e, value) => {
              setActiveTab(value);
              setPage(0);
            }}
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

        {/* Users List */}
        {paginatedData.length > 0 ? (
          <Grid container spacing={3}>
            {paginatedData.map((user) => (
              <Grid item xs={12} sm={6} md={4} key={user.id}>
                <UserCard elevation={2}>
                  <CardContent>
                    <Stack spacing={2}>
                      {/* Header */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              width: 64,
                              height: 64,
                              bgcolor: 'primary.main',
                              fontSize: '1.25rem',
                              fontWeight: 600,
                            }}
                          >
                            {user.avatar}
                          </Avatar>
                          <Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="h6" fontWeight="600" noWrap>
                                {user.name}
                              </Typography>
                              {user.is_verified && (
                                <VerifiedIcon sx={{ color: '#3B82F6', fontSize: 18 }} />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              @{user.username}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                              <Chip
                                label={getEngagementLabel(user.engagement)}
                                size="small"
                                sx={{
                                  backgroundColor: `${getEngagementColor(user.engagement)}20`,
                                  color: getEngagementColor(user.engagement),
                                }}
                              />
                              {activeTab === 1 && user.follows_back && (
                                <Chip
                                  label="Follows back"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          </Box>
                        </Box>
                        <IconButton size="small">
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      {/* Bio */}
                      {user.bio && (
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {user.bio}
                        </Typography>
                      )}

                      {/* Tags */}
                      {user.tags && user.tags.length > 0 && (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {user.tags.slice(0, 3).map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              sx={{
                                backgroundColor: 'grey.100',
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                              }}
                            />
                          ))}
                          {user.tags.length > 3 && (
                            <Chip
                              label={`+${user.tags.length - 3}`}
                              size="small"
                              sx={{
                                backgroundColor: 'grey.100',
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                              }}
                            />
                          )}
                        </Stack>
                      )}

                      {/* Stats */}
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={3}>
                          <Box display="flex" flexDirection="column" alignItems="center">
                            <Typography variant="body2" fontWeight="600">
                              {user.mutual_followers}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Mutual
                            </Typography>
                          </Box>
                          <Box display="flex" flexDirection="column" alignItems="center">
                            <Typography variant="body2" fontWeight="600">
                              {user.location?.split(',')[0]}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Location
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          <ScheduleIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                          {user.last_active}
                        </Typography>
                      </Box>

                      {/* Meta Info */}
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Following since: {formatDate(user.followed_at)}
                        </Typography>
                        {user.email && (
                          <Tooltip title={user.email}>
                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          </Tooltip>
                        )}
                      </Box>

                      {/* Actions */}
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Button
                          size="small"
                          startIcon={<MessageIcon />}
                          variant="outlined"
                          onClick={() => handleMessage(user.id, user.name)}
                        >
                          Message
                        </Button>
                        <Stack direction="row" spacing={1}>
                          {activeTab === 0 ? (
                            <>
                              <Tooltip title="Follow back">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => handleFollowBack(user.id, user.name)}
                                >
                                  <PersonAddIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove follower">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleRemoveFollower(user.id, user.name)}
                                >
                                  <PersonRemoveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              {!user.follows_back && (
                                <Tooltip title="Request follow back">
                                  <IconButton size="small" color="info">
                                    <NotificationsIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Unfollow">
                                <IconButton 
                                  size="small" 
                                  color="warning"
                                  onClick={() => handleUnfollow(user.id, user.name)}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </UserCard>
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
              <PeopleIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            ) : (
              <PersonAddIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            )}
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No {activeTab === 0 ? 'Followers' : 'Following'} Found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {searchTerm 
                ? 'No users match your search criteria'
                : activeTab === 0
                  ? 'You don\'t have any followers yet'
                  : 'You\'re not following anyone yet'}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
              >
                Clear Filters
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => console.log('Find people to follow')}
              >
                Discover People
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Pagination */}
        {filteredData.length > rowsPerPage && (
          <Box display="flex" justifyContent="center" mt={4}>
            <TablePagination
              component="div"
              count={filteredData.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        )}

        {/* Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, userId: null, userName: '', type: null })}
        >
          <DialogTitle>
            {deleteDialog.type === 'unfollow' ? 'Unfollow User' : 'Remove Follower'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {deleteDialog.type} "{deleteDialog.userName}"?
            </Typography>
            {deleteDialog.type === 'unfollow' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                You can follow them again anytime.
              </Alert>
            )}
            {deleteDialog.type === 'remove' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This user won't be able to follow you again unless you approve it.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialog({ open: false, userId: null, userName: '', type: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              color={deleteDialog.type === 'unfollow' ? 'warning' : 'error'}
              variant="contained"
            >
              {deleteDialog.type === 'unfollow' ? 'Unfollow' : 'Remove'}
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
    </FollowersContainer>
  );
};

export default FollowersList;