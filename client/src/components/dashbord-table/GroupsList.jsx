// src/components/GroupsList.jsx
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
  Switch,
  FormControlLabel,
  LinearProgress,
  Badge,
  Fade,
  CardMedia,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Person as PersonIcon,
  Article as ArticleIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  ExitToApp as ExitToAppIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
   EmojiEvents as CrownIcon,
  People as PeopleIcon,
  ChatBubble as ChatBubbleIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { dashboardAPI } from '../services/api';
import { FaCrown } from 'react-icons/fa';

<FaCrown />

const GroupsContainer = styled(Box)(({ theme }) => ({
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

const GroupCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.3s',
  cursor: 'pointer',
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

const PrivacyBadge = styled(Chip)(({ theme, privacy }) => ({
  backgroundColor: privacy === 'private' ? '#F59E0B20' : '#10B98120',
  color: privacy === 'private' ? '#92400E' : '#065F46',
  fontWeight: 500,
  fontSize: '0.75rem',
}));

const RoleBadge = styled(Chip)(({ theme, role }) => ({
  backgroundColor: role === 'creator' ? '#6366F120' : '#6B728020',
  color: role === 'creator' ? '#3730A3' : '#374151',
  fontWeight: 500,
  fontSize: '0.75rem',
}));

const GroupsList = () => {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialog, setCreateDialog] = useState({
    open: false,
    name: '',
    description: '',
    isPrivate: false
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    groupId: null,
    groupName: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    filterGroups();
  }, [groups, activeTab, searchTerm]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getGroups();
      
      // Demo data
      const demoGroups = [
        {
          id: 1,
          name: 'Web Developers',
          description: 'Community for passionate web developers to share knowledge, resources, and collaborate on projects.',
          creator: { username: 'you', avatar: 'Y' },
          is_private: false,
          created_at: '2024-01-10T08:30:00Z',
          members_count: 145,
          posts_count: 320,
          is_creator: true,
          is_member: true,
          tags: ['web', 'development', 'javascript', 'react'],
          recent_activity: '2 hours ago',
          member_growth: '+12%'
        },
        {
          id: 2,
          name: 'UX/UI Design Community',
          description: 'Share resources, tips, and best practices in user experience and interface design.',
          creator: { username: 'design_master', avatar: 'DM' },
          is_private: true,
          created_at: '2024-01-09T13:15:00Z',
          members_count: 89,
          posts_count: 156,
          is_creator: false,
          is_member: true,
          tags: ['design', 'ui', 'ux', 'figma'],
          recent_activity: '5 hours ago',
          member_growth: '+8%'
        },
        {
          id: 3,
          name: 'Startup Entrepreneurs',
          description: 'Network for entrepreneurs and startup founders to exchange ideas, experiences, and advice.',
          creator: { username: 'you', avatar: 'Y' },
          is_private: false,
          created_at: '2024-01-08T15:40:00Z',
          members_count: 234,
          posts_count: 521,
          is_creator: true,
          is_member: true,
          tags: ['startup', 'business', 'entrepreneurship', 'funding'],
          recent_activity: '1 day ago',
          member_growth: '+25%'
        },
        {
          id: 4,
          name: 'Data Science & AI',
          description: 'Discussion forum for machine learning, data analysis, artificial intelligence topics and projects.',
          creator: { username: 'data_guru', avatar: 'DG' },
          is_private: false,
          created_at: '2024-01-07T11:20:00Z',
          members_count: 187,
          posts_count: 289,
          is_creator: false,
          is_member: true,
          tags: ['datascience', 'ai', 'ml', 'python'],
          recent_activity: '2 days ago',
          member_growth: '+15%'
        },
        {
          id: 5,
          name: 'Mobile Development',
          description: 'Community for React Native, Flutter, Swift, Kotlin developers to share insights and solutions.',
          creator: { username: 'mobile_dev', avatar: 'MD' },
          is_private: true,
          created_at: '2024-01-06T09:45:00Z',
          members_count: 132,
          posts_count: 187,
          is_creator: false,
          is_member: false,
          tags: ['mobile', 'react-native', 'flutter', 'ios'],
          recent_activity: '3 days ago',
          member_growth: '+10%'
        },
        {
          id: 6,
          name: 'DevOps Engineers',
          description: 'Platform for DevOps professionals to discuss tools, practices, and infrastructure management.',
          creator: { username: 'devops_expert', avatar: 'DE' },
          is_private: false,
          created_at: '2024-01-05T14:30:00Z',
          members_count: 98,
          posts_count: 145,
          is_creator: false,
          is_member: true,
          tags: ['devops', 'kubernetes', 'docker', 'aws'],
          recent_activity: '1 week ago',
          member_growth: '+18%'
        }
      ];

      const groupsData = response.data || demoGroups;
      setGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load groups',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterGroups = () => {
    let filtered = [...groups];
    
    // Apply tab filter
    switch(activeTab) {
      case 1: // Created by me
        filtered = filtered.filter(g => g.is_creator);
        break;
      case 2: // Joined
        filtered = filtered.filter(g => g.is_member && !g.is_creator);
        break;
      case 3: // Private
        filtered = filtered.filter(g => g.is_private);
        break;
      case 4: // Public
        filtered = filtered.filter(g => !g.is_private);
        break;
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    
    setFilteredGroups(filtered);
  };

  const getStats = () => {
    const created = groups.filter(g => g.is_creator).length;
    const joined = groups.filter(g => g.is_member && !g.is_creator).length;
    const privateGroups = groups.filter(g => g.is_private).length;
    const publicGroups = groups.filter(g => !g.is_private).length;
    const totalMembers = groups.reduce((sum, g) => sum + (g.members_count || 0), 0);
    const totalPosts = groups.reduce((sum, g) => sum + (g.posts_count || 0), 0);
    const activeGroups = groups.filter(g => g.recent_activity?.includes('hour') || g.recent_activity?.includes('day')).length;
    
    return { created, joined, privateGroups, publicGroups, totalMembers, totalPosts, activeGroups };
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

  const handleCreateGroup = async () => {
    try {
      const newGroupData = {
        id: groups.length + 1,
        name: createDialog.name,
        description: createDialog.description,
        creator: { username: 'you', avatar: 'Y' },
        is_private: createDialog.isPrivate,
        created_at: new Date().toISOString(),
        members_count: 1,
        posts_count: 0,
        is_creator: true,
        is_member: true,
        tags: [],
        recent_activity: 'Just now',
        member_growth: '0%'
      };
      
      setGroups([newGroupData, ...groups]);
      setCreateDialog({ open: false, name: '', description: '', isPrivate: false });
      setSnackbar({
        open: true,
        message: 'Group created successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating group:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create group',
        severity: 'error'
      });
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      setGroups(groups.map(g => 
        g.id === groupId ? { 
          ...g, 
          is_member: true, 
          members_count: (g.members_count || 0) + 1,
          member_growth: `${parseInt(g.member_growth || '0') + 5}%`
        } : g
      ));
      setSnackbar({
        open: true,
        message: 'Successfully joined the group',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error joining group:', error);
      setSnackbar({
        open: true,
        message: 'Failed to join group',
        severity: 'error'
      });
    }
  };

  const handleLeaveGroup = async (groupId, groupName) => {
    setDeleteDialog({
      open: true,
      groupId,
      groupName,
      action: 'leave'
    });
  };

  const confirmLeaveGroup = () => {
    try {
      setGroups(groups.map(g => 
        g.id === deleteDialog.groupId && !g.is_creator ? { 
          ...g, 
          is_member: false, 
          members_count: Math.max(0, (g.members_count || 0) - 1)
        } : g
      ));
      setDeleteDialog({ open: false, groupId: null, groupName: '' });
      setSnackbar({
        open: true,
        message: 'Successfully left the group',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error leaving group:', error);
      setSnackbar({
        open: true,
        message: 'Failed to leave group',
        severity: 'error'
      });
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    setDeleteDialog({
      open: true,
      groupId,
      groupName,
      action: 'delete'
    });
  };

  const confirmDeleteGroup = () => {
    try {
      setGroups(groups.filter(g => g.id !== deleteDialog.groupId));
      setDeleteDialog({ open: false, groupId: null, groupName: '' });
      setSnackbar({
        open: true,
        message: 'Group deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete group',
        severity: 'error'
      });
    }
  };

  const stats = getStats();
  const statsCards = [
    {
      title: 'Groups Created',
      value: stats.created,
      icon: <CrownIcon />,
      color: '#6366F1',
      trend: '+2 this month',
      description: 'Groups you created'
    },
    {
      title: 'Groups Joined',
      value: stats.joined,
      icon: <PeopleIcon />,
      color: '#10B981',
      trend: '+5 this month',
      description: 'Active memberships'
    },
    {
      title: 'Total Members',
      value: stats.totalMembers.toLocaleString(),
      icon: <GroupIcon />,
      color: '#EC4899',
      trend: '+15% growth',
      description: 'Across all groups'
    },
    {
      title: 'Total Posts',
      value: stats.totalPosts.toLocaleString(),
      icon: <ArticleIcon />,
      color: '#F59E0B',
      trend: '+23% increase',
      description: 'Group discussions'
    },
    {
      title: 'Private Groups',
      value: stats.privateGroups,
      icon: <LockIcon />,
      color: '#8B5CF6',
      trend: '3 invite-only',
      description: 'Exclusive communities'
    },
    {
      title: 'Active Groups',
      value: stats.activeGroups,
      icon: <TrendingUpIcon />,
      color: '#3B82F6',
      trend: 'Recently active',
      description: 'With recent activity'
    }
  ];

  const tabLabels = [
    { label: 'All Groups', count: groups.length },
    { label: 'Created by Me', count: stats.created },
    { label: 'Joined', count: stats.joined },
    { label: 'Private', count: stats.privateGroups },
    { label: 'Public', count: stats.publicGroups }
  ];

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
          Loading Groups...
        </Typography>
      </Box>
    );
  }

  return (
    <GroupsContainer>
      <Container maxWidth="xl">
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="600">
              Groups Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage your communities and discover new groups
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchGroups}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialog({ ...createDialog, open: true })}
            >
              Create Group
            </Button>
          </Stack>
        </Box>

        {/* Search and Filter */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search groups by name, description, or tags..."
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
                  defaultValue="recent"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="recent">Most Recent</MenuItem>
                  <MenuItem value="popular">Most Popular</MenuItem>
                  <MenuItem value="active">Most Active</MenuItem>
                  <MenuItem value="members">Most Members</MenuItem>
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
            onChange={(e, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabLabels.map((tab, index) => (
              <Tab
                key={index}
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

        {/* Groups Grid */}
        {filteredGroups.length > 0 ? (
          <Grid container spacing={3}>
            {filteredGroups.map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group.id}>
                <GroupCard elevation={2}>
                  <CardContent>
                    <Stack spacing={2}>
                      {/* Header */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              width: 56,
                              height: 56,
                              bgcolor: group.is_private ? 'warning.main' : 'primary.main',
                            }}
                          >
                            <GroupIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="600" noWrap>
                              {group.name}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                              <PrivacyBadge
                                privacy={group.is_private ? 'private' : 'public'}
                                icon={group.is_private ? <LockIcon /> : <PublicIcon />}
                                size="small"
                              />
                              {group.is_creator && (
                                <RoleBadge
                                  role="creator"
                                  icon={<CrownIcon />}
                                  size="small"
                                />
                              )}
                              {group.is_member && !group.is_creator && (
                                <RoleBadge
                                  role="member"
                                  icon={<PersonIcon />}
                                  size="small"
                                />
                              )}
                            </Stack>
                          </Box>
                        </Box>
                        <IconButton size="small">
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      {/* Description */}
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {group.description}
                      </Typography>

                      {/* Tags */}
                      {group.tags && group.tags.length > 0 && (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {group.tags.slice(0, 3).map((tag, index) => (
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
                          {group.tags.length > 3 && (
                            <Chip
                              label={`+${group.tags.length - 3}`}
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
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <PeopleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight="500">
                              {group.members_count?.toLocaleString() || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Members
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <ArticleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                            <Typography variant="body2" fontWeight="500">
                              {group.posts_count?.toLocaleString() || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Posts
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip
                          label={group.member_growth || '+0%'}
                          size="small"
                          sx={{
                            backgroundColor: group.member_growth?.includes('+') ? '#10B98120' : '#6B728020',
                            color: group.member_growth?.includes('+') ? '#10B981' : '#6B7280',
                          }}
                        />
                      </Box>

                      {/* Meta Info */}
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          <ScheduleIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                          Created {formatDate(group.created_at)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Activity: {group.recent_activity}
                        </Typography>
                      </Box>

                      {/* Actions */}
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => console.log('View group:', group.id)}
                        >
                          View
                        </Button>
                        <Stack direction="row" spacing={1}>
                          {group.is_creator ? (
                            <>
                              <Tooltip title="Edit group">
                                <IconButton size="small" color="primary">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete group">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeleteGroup(group.id, group.name)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : group.is_member ? (
                            <Tooltip title="Leave group">
                              <Button
                                size="small"
                                startIcon={<ExitToAppIcon />}
                                color="warning"
                                variant="outlined"
                                onClick={() => handleLeaveGroup(group.id, group.name)}
                              >
                                Leave
                              </Button>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Join group">
                              <Button
                                size="small"
                                startIcon={<CheckCircleIcon />}
                                color="success"
                                variant="contained"
                                onClick={() => handleJoinGroup(group.id)}
                              >
                                Join
                              </Button>
                            </Tooltip>
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </GroupCard>
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
            <GroupIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Groups Found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {searchTerm 
                ? 'No groups match your search criteria'
                : activeTab === 1
                  ? 'You haven\'t created any groups yet'
                  : activeTab === 2
                    ? 'You haven\'t joined any groups yet'
                    : 'No groups available in this category'}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setActiveTab(0);
                }}
              >
                Clear Filters
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialog({ ...createDialog, open: true })}
              >
                Create Your First Group
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Create Group Dialog */}
        <Dialog
          open={createDialog.open}
          onClose={() => setCreateDialog({ ...createDialog, open: false })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Group</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                autoFocus
                label="Group Name"
                fullWidth
                value={createDialog.name}
                onChange={(e) => setCreateDialog({ ...createDialog, name: e.target.value })}
                placeholder="Enter group name"
                helperText="Choose a descriptive name for your group"
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={createDialog.description}
                onChange={(e) => setCreateDialog({ ...createDialog, description: e.target.value })}
                placeholder="Describe your group's purpose and topics"
                helperText="What will this group discuss? Who is it for?"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={createDialog.isPrivate}
                    onChange={(e) => setCreateDialog({ ...createDialog, isPrivate: e.target.checked })}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Private Group</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only visible to invited members
                    </Typography>
                  </Box>
                }
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setCreateDialog({ ...createDialog, open: false })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              variant="contained"
              disabled={!createDialog.name.trim() || !createDialog.description.trim()}
            >
              Create Group
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete/Leave Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, groupId: null, groupName: '' })}
        >
          <DialogTitle>
            {deleteDialog.action === 'delete' ? 'Delete Group' : 'Leave Group'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {deleteDialog.action} "{deleteDialog.groupName}"?
            </Typography>
            {deleteDialog.action === 'delete' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This action cannot be undone. All group data will be permanently deleted.
              </Alert>
            )}
            {deleteDialog.action === 'leave' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                You can rejoin this group later if it's public or if you receive an invitation.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialog({ open: false, groupId: null, groupName: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={deleteDialog.action === 'delete' ? confirmDeleteGroup : confirmLeaveGroup}
              color={deleteDialog.action === 'delete' ? 'error' : 'warning'}
              variant="contained"
            >
              {deleteDialog.action === 'delete' ? 'Delete' : 'Leave'}
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
    </GroupsContainer>
  );
};

export default GroupsList;