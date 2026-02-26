// src/components/dashboard-admin/components/Views/UsersView.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, TablePagination,
  Button, TextField, MenuItem, Select, FormControl,
  InputLabel, Grid, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert,
  Switch, FormControlLabel, Badge, Tabs, Tab
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  BarChart as BarChartIcon,
  ListAlt as ListIcon
} from '@mui/icons-material';
import { useAdminData } from '../../../hooks/useAdminData';
import UsersAnalyticsView from './users/UserGraphiq';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`users-tabpanel-${index}`}
      aria-labelledby={`users-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Composants d'aide
const InfoItem = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
    <Box sx={{ color: 'text.secondary' }}>
      {icon}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="caption" color="textSecondary">
        {label}
      </Typography>
      <Typography variant="body2">
        {value || 'Not specified'}
      </Typography>
    </Box>
  </Box>
);

const StatItem = ({ label, value }) => (
  <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', flex: 1 }}>
    <Typography variant="h6">{value}</Typography>
    <Typography variant="caption" color="textSecondary">{label}</Typography>
  </Paper>
);

const UsersView = ({ users: initialUsers, loading }) => {
  const { fetchUsers, adminApi, showSnackbar } = useAdminData();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState(0);
  
  // State for users list
  const [users, setUsers] = useState(initialUsers || []);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionData, setActionData] = useState({});

  // Filtres
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    role: '',
    dateFrom: '',
    dateTo: '',
    hasPosts: '',
    hasCertifications: ''
  });

  // Charger les utilisateurs au montage
  useEffect(() => {
    fetchUsers();
  }, []);

  // Mettre à jour les utilisateurs quand initialUsers change
  useEffect(() => {
    if (initialUsers) {
      setUsers(initialUsers);
      setFilteredUsers(initialUsers);
    }
  }, [initialUsers]);

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...users];

    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par statut
    if (filters.status) {
      filtered = filtered.filter(user => {
        if (filters.status === 'active') return user.is_active === true;
        if (filters.status === 'inactive') return user.is_active === false;
        if (filters.status === 'staff') return user.is_staff === true;
        if (filters.status === 'superuser') return user.is_superuser === true;
        return true;
      });
    }

    // Filtre par rôle
    if (filters.role) {
      filtered = filtered.filter(user => {
        if (filters.role === 'admin') return user.is_staff || user.is_superuser;
        if (filters.role === 'regular') return !user.is_staff && !user.is_superuser;
        return true;
      });
    }

    // Filtre par date
    if (filters.dateFrom) {
      filtered = filtered.filter(user => 
        new Date(user.date_joined) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(user => 
        new Date(user.date_joined) <= new Date(filters.dateTo)
      );
    }

    setFilteredUsers(filtered);
    setPage(0); // Retour à la première page après filtrage
  }, [users, filters]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  const handleAction = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const confirmAction = async () => {
    try {
      switch (actionType) {
        case 'activate':
          await adminApi.updateUserStatus(selectedUser.id, 'activate');
          showSnackbar('User activated successfully', 'success');
          break;
        case 'deactivate':
          await adminApi.updateUserStatus(selectedUser.id, 'deactivate');
          showSnackbar('User deactivated successfully', 'success');
          break;
        case 'promote':
          await adminApi.updateUserStatus(selectedUser.id, 'promote_to_staff');
          showSnackbar('User promoted to staff', 'success');
          break;
        case 'demote':
          await adminApi.updateUserStatus(selectedUser.id, 'demote_from_staff');
          showSnackbar('User demoted from staff', 'success');
          break;
        case 'delete':
          // Implémenter la suppression
          showSnackbar('Delete functionality coming soon', 'info');
          break;
        default:
          break;
      }
      
      // Rafraîchir la liste
      await fetchUsers();
      setActionDialogOpen(false);
    } catch (error) {
      showSnackbar(`Error: ${error.message}`, 'error');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (user) => {
    if (!user.is_active) {
      return <Chip label="Inactive" color="error" size="small" />;
    }
    if (user.is_superuser) {
      return <Chip label="Super Admin" color="warning" size="small" />;
    }
    if (user.is_staff) {
      return <Chip label="Staff" color="info" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  const getLastActive = (user) => {
    if (user.last_login) {
      const lastLogin = new Date(user.last_login);
      const now = new Date();
      const diffDays = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    }
    return 'Never';
  };

  return (
    <>
      {/* En-tête avec boutons - Visible sur tous les onglets */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">
            Users Management
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 0.5 }}>
            {activeTab === 0 ? `${filteredUsers.length} total users` : 'Analytics & Insights'}
          </Typography>
        </Box>
     
      </Box>

      {/* Tabs Navigation */}
      <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="users view tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '0.95rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 600
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3
            }
          }}
        >
          <Tab 
            icon={<ListIcon />} 
            iconPosition="start" 
            label="Users List" 
            id="users-tab-0"
            aria-controls="users-tabpanel-0"
          />
          <Tab 
            icon={<BarChartIcon />} 
            iconPosition="start" 
            label="Analytics" 
            id="users-tab-1"
            aria-controls="users-tabpanel-1"
          />
        </Tabs>

        {/* Users List Tab */}
        <TabPanel value={activeTab} index={0}>
          {/* Filtres */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                    <MenuItem value="superuser">Super Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={filters.role}
                    label="Role"
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    <MenuItem value="admin">Admins</MenuItem>
                    <MenuItem value="regular">Regular Users</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="From Date"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="To Date"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={1}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FilterIcon />}
                  onClick={() => fetchUsers(filters)}
                  sx={{ minHeight: '40px' }}
                >
                  Filter
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Stats rapides */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {users.filter(u => u.is_active).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Users
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="secondary">
                  {users.filter(u => u.is_staff).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Staff Members
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main">
                  {users.filter(u => !u.is_active).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Inactive Users
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {users.filter(u => u.last_login && new Date(u.last_login).toDateString() === new Date().toDateString()).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Today
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Table des utilisateurs */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Last Active</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">
                          No users found. Try adjusting your filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Badge
                                color={user.is_active ? "success" : "error"}
                                variant="dot"
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              >
                                <Avatar
                                  src={user.profile?.image || ''}
                                  sx={{ width: 40, height: 40 }}
                                >
                                  {user.username?.[0]?.toUpperCase() || 'U'}
                                </Avatar>
                              </Badge>
                              <Box>
                                <Typography variant="body1" fontWeight="medium">
                                  {user.username}
                                  {user.is_superuser && (
                                    <StarIcon fontSize="small" sx={{ ml: 0.5, color: 'warning.main', verticalAlign: 'middle' }} />
                                  )}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  ID: {user.id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2">{user.email}</Typography>
                              </Box>
                              {user.profile?.phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                  <Typography variant="body2">{user.profile.phone}</Typography>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {getStatusChip(user)}
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              Posts: {user.post_count || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(user.date_joined).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(user.date_joined).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {getLastActive(user)}
                            </Typography>
                            {user.last_login && (
                              <Typography variant="caption" color="textSecondary">
                                {new Date(user.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleViewDetails(user)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              
                             {/*
                              <Tooltip title="Edit User">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => showSnackbar('Edit feature coming soon', 'info')}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                             */}
                              
                              {/* user.is_active ? (
                                <Tooltip title="Deactivate">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleAction(user, 'deactivate')}
                                  >
                                    <BlockIcon />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Activate">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleAction(user, 'activate')}
                                  >
                                    <ActivateIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                            {/*
                              {!user.is_superuser && (
                                <Tooltip title={user.is_staff ? "Remove Staff Role" : "Make Staff"}>
                                  <IconButton
                                    size="small"
                                    color={user.is_staff ? "secondary" : "primary"}
                                    onClick={() => handleAction(user, user.is_staff ? 'demote' : 'promote')}
                                  >
                                    {user.is_staff ? <WarningIcon /> : <StarIcon />}
                                  </IconButton>
                                </Tooltip>
                              )}
                            */}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Users per page:"
            />
          </Paper>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={1}>
          <UsersAnalyticsView />
        </TabPanel>
      </Paper>

      {/* Dialog de détails - Accessible depuis les deux onglets */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={selectedUser.profile?.image || ''}
                  sx={{ width: 50, height: 50 }}
                />
                <Box>
                  <Typography variant="h6">{selectedUser.username}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    User ID: {selectedUser.id}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Basic Information
                  </Typography>
                  <InfoItem icon={<EmailIcon />} label="Email" value={selectedUser.email} />
                  <InfoItem icon={<CalendarIcon />} label="Joined" value={new Date(selectedUser.date_joined).toLocaleString()} />
                  <InfoItem icon={<CalendarIcon />} label="Last Login" value={selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'} />
                  <InfoItem icon={<LocationIcon />} label="Location" value={selectedUser.profile?.location || 'Not specified'} />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Account Status
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch checked={selectedUser.is_active} disabled />}
                      label="Account Active"
                    />
                    <FormControlLabel
                      control={<Switch checked={selectedUser.is_staff} disabled />}
                      label="Staff Member"
                    />
                    <FormControlLabel
                      control={<Switch checked={selectedUser.is_superuser} disabled />}
                      label="Super Admin"
                    />
                  </Box>
                  
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 3 }} gutterBottom>
                    Statistics
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <StatItem label="Posts" value={selectedUser.post_count || 0} />
                    <StatItem label="Comments" value={selectedUser.comment_count || 0} />
                    <StatItem label="Reports" value={selectedUser.report_count || 0} />
                  </Box>
                </Grid>
                
                {selectedUser.profile?.bio && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Bio
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography>{selectedUser.profile.bio}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
           {/*
              <Button
                variant="contained"
                onClick={() => {
                  setDetailDialogOpen(false);
                  showSnackbar('Edit feature coming soon', 'info');
                }}
              >
                Edit User
              </Button>
           */}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog de confirmation d'action */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
      >
        <DialogTitle>
          Confirm Action
        </DialogTitle>
        <DialogContent>
          {selectedUser && actionType && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Are you sure you want to {actionType} user <strong>{selectedUser.username}</strong>?
            </Alert>
          )}
          <Typography variant="body2" color="textSecondary">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={confirmAction}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UsersView;