// src/components/groups/GroupMembersSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Badge,
  AvatarGroup,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Paper,
  InputAdornment,
  Pagination,
  Checkbox,
} from '@mui/material';
import {
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  MoreVert as MoreVertIcon,
  PersonRemove as RemoveIcon,
  Block as BlockIcon,
  Shield as ShieldIcon,
  Search as SearchIcon,
  GroupAdd as GroupAddIcon,
  Mail as MailIcon,
  Chat as ChatIcon,
  PersonAdd as PersonAddIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  EmojiEvents as BadgeIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { groupAPI, conversationAPI, userAPI } from '../../../hooks/messaging/messagingApi';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const GroupMembersSection = ({
  members = [],
  loading = false,
  isMember = false,
  isAdmin = false,
  groupId,
  can_invite = false,
  onMemberUpdate = () => {},
}) => {
  const { user } = useAuth();
  const [allMembers, setAllMembers] = useState(members);
  const [filteredMembers, setFilteredMembers] = useState(members);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: '',
    title: '',
    message: '',
  });
  const [inviteDialog, setInviteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('joined');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showOnlyOnline, setShowOnlyOnline] = useState(false);
  const [perPage] = useState(12);
  
  // States for user search and selection
  const [selectedUsersForInvite, setSelectedUsersForInvite] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const userSearchTimeoutRef = useRef(null);
  
  const navigate = useNavigate();

  // Load full members list if user is member/admin
  useEffect(() => {
    if ((isMember || isAdmin || can_invite) && groupId && members.length < 5) {
      loadCompleteMembers();
    } else {
      setAllMembers(members);
      setFilteredMembers(members);
    }
  }, [members, isMember, isAdmin, groupId, can_invite]);

  // Apply filters and search
  useEffect(() => {
    let result = allMembers;

    // Apply role filter
    if (filterRole !== 'all') {
      result = result.filter(member => member.role === filterRole);
    }

    // Apply online filter
    if (showOnlyOnline) {
      result = result.filter(member => member.user?.is_online === true);
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(member =>
        member.user?.username?.toLowerCase().includes(term) ||
        member.user?.first_name?.toLowerCase().includes(term) ||
        member.user?.last_name?.toLowerCase().includes(term) ||
        member.user?.email?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.user?.username || '').localeCompare(b.user?.username || '');
        case 'role':
          const roleOrder = { owner: 0, admin: 1, moderator: 2, member: 3 };
          return roleOrder[a.role] - roleOrder[b.role];
        case 'joined':
          return new Date(b.joined_at) - new Date(a.joined_at);
        case 'active':
          return new Date(b.last_active || 0) - new Date(a.last_active || 0);
        default:
          return 0;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedResult = result.slice(startIndex, endIndex);
    
    setTotalPages(Math.ceil(result.length / perPage));
    setFilteredMembers(paginatedResult);
  }, [allMembers, searchTerm, filterRole, sortBy, showOnlyOnline, page, perPage]);

  // Effect for user search with debounce
  useEffect(() => {
    if (userSearchQuery.trim().length >= 2) {
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }

      userSearchTimeoutRef.current = setTimeout(async () => {
        try {
          setUserSearchLoading(true);
          const response = await userAPI.searchUsers(userSearchQuery);
          
          // Filter out already selected users and existing group members
          const existingMemberIds = allMembers.map(member => member.user?.id);
          const selectedUserIds = selectedUsersForInvite.map(user => user.id);
          
          const filteredResults = response.data.results?.filter(
            user => !selectedUserIds.includes(user.id) && !existingMemberIds.includes(user.id)
          ) || [];
          
          setUserSearchResults(filteredResults);
        } catch (error) {
          console.error('Search error:', error);
          setUserSearchResults([]);
        } finally {
          setUserSearchLoading(false);
        }
      }, 300);
    } else {
      setUserSearchResults([]);
    }

    return () => {
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }
    };
  }, [userSearchQuery, selectedUsersForInvite, allMembers]);

  const loadCompleteMembers = async () => {
    if (!groupId) return;
    
    setLoadingMembers(true);
    try {
      const response = await groupAPI.getGroupMembers(groupId, {
        page: 1,
        limit: 100,
      });
      
      let membersData = [];
      if (response.data?.members && Array.isArray(response.data.members)) {
        membersData = response.data.members;
      } else if (Array.isArray(response.data)) {
        membersData = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        membersData = response.data.results;
      }
      
      setAllMembers(membersData);
    } catch (error) {
      console.error('Error loading complete members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleMemberAction = (member, action) => {
    setSelectedMember(member);
    
    switch (action) {
      case 'make_admin':
        setActionDialog({
          open: true,
          type: 'make_admin',
          title: 'Make Administrator',
          message: `Are you sure you want to make ${member.user?.username} an administrator? They will have full control over the group.`,
        });
        break;
      case 'remove':
        setActionDialog({
          open: true,
          type: 'remove',
          title: 'Remove Member',
          message: `Are you sure you want to remove ${member.user?.username} from the group?`,
        });
        break;
      case 'ban':
        setActionDialog({
          open: true,
          type: 'ban',
          title: 'Ban Member',
          message: `Are you sure you want to ban ${member.user?.username} from the group? They will not be able to rejoin.`,
        });
        break;
      case 'contact':
        window.location.href = `/messages?user_id=${member.user?.id}`;
        break;
      default:
        break;
    }
    setAnchorEl(null);
  };

  const confirmAction = async () => {
    if (!selectedMember || !groupId) return;

    try {
      switch (actionDialog.type) {
        case 'remove':
          await groupAPI.removeMember(groupId, selectedMember.user?.id);
          break;
        case 'ban':
          alert(`Ban functionality for ${selectedMember.user?.username} - To be implemented`);
          break;
        case 'make_admin':
          alert(`Make admin functionality for ${selectedMember.user?.username} - To be implemented`);
          break;
        default:
          break;
      }
      
      // Refresh members list
      onMemberUpdate();
      setActionDialog({ ...actionDialog, open: false });
      setSelectedMember(null);
    } catch (error) {
      console.error('Error performing action:', error);
      alert(error.response?.data?.detail || 'Failed to perform action');
    }
  };

  const handleInviteUsers = async (userIds) => {
    if (!groupId || !userIds || userIds.length === 0) return;
    
    try {
      await groupAPI.inviteToGroup(groupId, { user_ids: userIds });
      alert(`${userIds.length} user(s) invited successfully!`);
      setInviteDialog(false);
      setSelectedUsersForInvite([]);
      setUserSearchQuery('');
      setUserSearchResults([]);
      onMemberUpdate();
    } catch (error) {
      console.error('Error inviting users:', error);
      alert(error.response?.data?.detail || 'Failed to invite users');
    }
  };

  // User selection handlers
  const handleAddUser = (user) => {
    if (!selectedUsersForInvite.some(selected => selected.id === user.id)) {
      const updatedUsers = [...selectedUsersForInvite, user];
      setSelectedUsersForInvite(updatedUsers);
      
      // Remove from search results
      setUserSearchResults(userSearchResults.filter(u => u.id !== user.id));
      setUserSearchQuery('');
    }
  };

  const handleRemoveUser = (userId) => {
    const updatedUsers = selectedUsersForInvite.filter(user => user.id !== userId);
    setSelectedUsersForInvite(updatedUsers);
  };

  const handleClearAllUsers = () => {
    setSelectedUsersForInvite([]);
  };

  const handleClearSearch = () => {
    setUserSearchQuery('');
    setUserSearchResults([]);
    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner':
        return 'error';
      case 'admin':
        return 'warning';
      case 'moderator':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return <AdminIcon fontSize="small" />;
      case 'moderator':
        return <ShieldIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  const handleClickMessageUser = async (member) => {
    if (member.user?.id) {
      try {
        const response = await conversationAPI.getOrCreateConversationWithUser(
          member.user?.id
        );
        navigate(`/message?conversation_id=${response.data.id}`);
      } catch (error) {
        console.error('Error creating conversation:', error);
        navigate(`/message?user_id=${member.user?.id}`);
      }
    }
  };

  const renderMembersList = () => {
    if (loadingMembers) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (filteredMembers.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No members found. {!isMember && 'You must be a member to see all members.'}
        </Alert>
      );
    }

    return (
      <>
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <List sx={{ p: 0 }}>
            {filteredMembers.map((member) => {
              const isCurrentUser = member.user?.id === user?.id;
              const canManage = isAdmin && !isCurrentUser && member.role !== 'owner';
              
              return (
                <ListItem
                  key={member.id}
                  divider
                  sx={{
                    py: 2,
                    px: 3,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  {/* Avatar with online status */}
                  <ListItemAvatar sx={{ minWidth: 60 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={member.user?.profile_image}
                        sx={{ width: 48, height: 48, cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${member.user?.profile_id}`)}
                      >
                        {member.user?.username?.charAt(0)}
                      </Avatar>
                      {member.user?.is_online && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 12,
                            height: 12,
                            backgroundColor: '#4caf50',
                            borderRadius: '50%',
                            border: '2px solid white',
                          }}
                        />
                      )}
                    </Box>
                  </ListItemAvatar>
                  
                  {/* Member Info */}
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {member.user?.first_name} {member.user?.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{member.user?.username}
                        </Typography>
                        {isCurrentUser && (
                          <Chip
                            label="You"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                        <Chip
                          icon={getRoleIcon(member.role)}
                          label={member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          size="small"
                          color={getRoleColor(member.role)}
                          variant="outlined"
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 14 }} />
                          <Typography variant="caption" color="text.secondary">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        {member.last_active && (
                          <Typography variant="caption" color="text.secondary">
                            • Last active: {new Date(member.last_active).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  
                  {/* Action Buttons */}
                  <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isMember && !isCurrentUser && (
                      <Tooltip title="Send message">
                        <IconButton
                          size="small"
                          onClick={() => handleClickMessageUser(member)}
                          sx={{
                            color: 'primary.main',
                            '&:hover': {
                              backgroundColor: 'primary.lighter',
                            },
                          }}
                        >
                          <ChatIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {canManage && (
                      <>
                        {isAdmin && (
                          <Tooltip title="Remove member">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleMemberAction(member, 'remove')}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'error.lighter',
                                },
                              }}
                            >
                              <RemoveIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
              {/*
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setSelectedMember(member);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
              */}
                      </>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </Paper>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
              size="large"
            />
          </Box>
        )}
      </>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Group Members ({allMembers.length})
        </Typography>
        
        {can_invite && (
          <Button
            variant="contained"
            startIcon={<GroupAddIcon />}
            onClick={() => setInviteDialog(true)}
          >
            Invite Members
          </Button>
        )}
      </Box>
      
      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {/* Role Filter */}
              <Button
                variant={filterRole === 'all' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setFilterRole('all')}
                startIcon={<FilterIcon />}
              >
                All
              </Button>
              
              <Button
                variant={filterRole === 'owner' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setFilterRole('owner')}
                startIcon={<AdminIcon />}
              >
                Owners
              </Button>
              
           {/*
              <Button
                variant={filterRole === 'admin' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setFilterRole('admin')}
                startIcon={<AdminIcon />}
              >
                Admins
              </Button>
           */}
              
              <Button
                variant={filterRole === 'member' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setFilterRole('member')}
                startIcon={<PersonIcon />}
              >
                Members
              </Button>
              
              {/* Online Filter */}
              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyOnline}
                    onChange={(e) => setShowOnlyOnline(e.target.checked)}
                    size="small"
                  />
                }
                label="Online Only"
              />
              
              {/* Sort Options */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<SortIcon />}
                onClick={() => {
                  const sortOptions = ['joined', 'name', 'role', 'active'];
                  const currentIndex = sortOptions.indexOf(sortBy);
                  const nextIndex = (currentIndex + 1) % sortOptions.length;
                  setSortBy(sortOptions[nextIndex]);
                }}
              >
                Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Stats */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" color="primary">
                {allMembers.filter(m => m.role === 'owner').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Owners
              </Typography>
            </Paper>
          </Grid>
          
   {/*
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" color="warning.main">
                {allMembers.filter(m => m.role === 'admin').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Admins
              </Typography>
            </Paper>
          </Grid>
          
   */}
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" color="info.main">
                {allMembers.filter(m => m.role === 'member').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Members
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" color="success.main">
                {allMembers.filter(m => m.user?.is_online).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Online Now
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Members List */}
      {renderMembersList()}
      
      {/* Online Members Preview */}
      {allMembers.filter(m => m.user?.is_online).length > 0 && (
        <Paper sx={{ p: 2, mt: 3, borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            <BadgeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Online Now ({allMembers.filter(m => m.user?.is_online).length})
          </Typography>
          <AvatarGroup max={10} sx={{ justifyContent: 'flex-start' }}>
            {allMembers
              .filter(m => m.user?.is_online)
              .slice(0, 10)
              .map((member) => (
                <Tooltip
                  key={member.id}
                  title={`${member.user?.username} (${member.role})`}
                >
                  <Avatar
                    src={member.user?.profile_image}
                    sx={{ width: 40, height: 40 }}
                      onClick={() => navigate(`/profile/${member.user?.profile_id}`)}
                  >
                    {member.user?.username?.charAt(0)}
                  </Avatar>
                </Tooltip>
              ))}
          </AvatarGroup>
        </Paper>
      )}
      
      {/* Member Action Menu */}
{/*
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleMemberAction(selectedMember, 'make_admin')}>
          <AdminIcon fontSize="small" sx={{ mr: 1 }} />
          Make Administrator
        </MenuItem>
        <MenuItem onClick={() => handleMemberAction(selectedMember, 'contact')}>
          <MailIcon fontSize="small" sx={{ mr: 1 }} />
          Send Message
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMemberAction(selectedMember, 'remove')}>
          <RemoveIcon fontSize="small" sx={{ mr: 1 }} />
          Remove from Group
        </MenuItem>
        <MenuItem onClick={() => handleMemberAction(selectedMember, 'ban')}>
          <BlockIcon fontSize="small" sx={{ mr: 1 }} />
          Ban from Group
        </MenuItem>
      </Menu>
      
*/}
      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onClose={() => setActionDialog({ ...actionDialog, open: false })}
      >
        <DialogTitle>{actionDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{actionDialog.message}</Typography>
          {actionDialog.type === 'remove' && selectedMember?.role === 'owner' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <WarningIcon />
              This member is an owner. Removing owners may require special permissions.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ ...actionDialog, open: false })}>
            Cancel
          </Button>
          <Button
            onClick={confirmAction}
            color={actionDialog.type === 'ban' ? 'error' : 'primary'}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Invite Dialog */}
      <Dialog
        open={inviteDialog}
        onClose={() => {
          setInviteDialog(false);
          setSelectedUsersForInvite([]);
          setUserSearchQuery('');
          setUserSearchResults([]);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: '80vh', height: '80vh' } }}
      >
        <DialogTitle>
          Invite Members to Group
          <Typography variant="caption" color="text.secondary" display="block">
            Search and select users to invite to this group
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            {/* Info Alert */}
            <Alert severity="info" sx={{ mb: 3 }}>
              You can invite up to {100 - allMembers.length} more members to this group.
              Invited users will be able to join the group immediately.
            </Alert>

            {/* Selected Users Chips */}
            {selectedUsersForInvite.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">
                    Selected Users ({selectedUsersForInvite.length})
                  </Typography>
                  <Button
                    size="small"
                    onClick={handleClearAllUsers}
                    disabled={selectedUsersForInvite.length === 0}
                  >
                    Clear All
                  </Button>
                </Box>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    maxHeight: 150,
                    overflowY: 'auto',
                  }}
                >
                  {selectedUsersForInvite.map((user) => (
                    <Chip
                      key={user.id}
                      avatar={
                        <Avatar
                          src={user.profile_image}
                          alt={user.username}
                          sx={{ width: 24, height: 24 }}
                        >
                          <PersonIcon fontSize="small" />
                        </Avatar>
                      }
                      label={user.username}
                      onDelete={() => handleRemoveUser(user.id)}
                      color="primary"
                      variant="outlined"
                      size="medium"
                    />
                  ))}
                </Paper>
              </Box>
            )}

            {/* Search Input */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search users by username..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: userSearchQuery && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={handleClearSearch}
                      edge="end"
                    >
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Type at least 2 characters to search for users"
            />

            {/* Loading indicator */}
            {userSearchLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {/* Search Results */}
            {userSearchResults.length > 0 && !userSearchLoading && (
              <Paper
                variant="outlined"
                sx={{
                  mt: 2,
                  maxHeight: 300,
                  overflowY: 'auto',
                }}
              >
                <List dense>
                  {userSearchResults.map((user) => (
                    <ListItem
                      key={user.id}
                      button
                      onClick={() => handleAddUser(user)}
                      disabled={selectedUsersForInvite.length >= (100 - allMembers.length)}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={user.profile_image}
                          alt={user.username}
                        >
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.username}
                        secondary={
                          <React.Fragment>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {user.first_name} {user.last_name}
                            </Typography>
                            {user.email && ` • ${user.email}`}
                          </React.Fragment>
                        }
                      />
                      <Checkbox
                        edge="end"
                        checked={selectedUsersForInvite.some(u => u.id === user.id)}
                        onChange={() => handleAddUser(user)}
                        disabled={selectedUsersForInvite.length >= (100 - allMembers.length)}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {userSearchQuery && userSearchResults.length === 0 && !userSearchLoading && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                No users found for "{userSearchQuery}"
              </Typography>
            )}

            {/* Selection Info */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {selectedUsersForInvite.length === 0
                ? 'No users selected yet'
                : `${selectedUsersForInvite.length} user${selectedUsersForInvite.length > 1 ? 's' : ''} selected`}
              {selectedUsersForInvite.length >= (100 - allMembers.length) && (
                <Typography component="span" color="error" sx={{ ml: 1 }}>
                  • Maximum limit reached
                </Typography>
              )}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setInviteDialog(false);
            setSelectedUsersForInvite([]);
            setUserSearchQuery('');
            setUserSearchResults([]);
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (selectedUsersForInvite.length > 0) {
                handleInviteUsers(selectedUsersForInvite.map(user => user.id));
              }
            }}
            disabled={!selectedUsersForInvite || selectedUsersForInvite.length === 0}
          >
            Invite {selectedUsersForInvite?.length || 0} User(s)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupMembersSection;