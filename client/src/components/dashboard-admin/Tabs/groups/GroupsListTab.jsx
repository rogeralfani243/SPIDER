// src/components/dashboard-admin/components/Views/groups/components/GroupsListTab.jsx
import React from 'react';
import {
  Box, Paper, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, TablePagination,
  Button, TextField, MenuItem, Select, FormControl,
  InputLabel, Grid, Avatar, Badge, CircularProgress, alpha
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';

const GroupsListTab = ({
  groups,
  loading,
  filters,
  onFilterChange,
  onApplyFilters,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
  page,
  rowsPerPage,
  onChangePage,
  onChangeRowsPerPage,
  totalGroups
}) => {
  const getGroupTypeIcon = (type) => {
    switch (type) {
      case 'group_public':
        return <PublicIcon fontSize="small" />;
      case 'group_private':
        return <LockIcon fontSize="small" />;
      default:
        return <GroupIcon fontSize="small" />;
    }
  };

  const getGroupTypeColor = (type) => {
    switch (type) {
      case 'group_public':
        return '#10B981';
      case 'group_private':
        return '#4F46E5';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'warning';
  };

  const getStatusIcon = (isActive) => {
    return isActive ? <ActiveIcon fontSize="small" /> : <InactiveIcon fontSize="small" />;
  };

  const getStatusLabel = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getGroupTypeLabel = (type) => {
    switch (type) {
      case 'group_public':
        return 'Public';
      case 'group_private':
        return 'Private';
      default:
        return type;
    }
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#f9fafb' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search groups..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Group Type</InputLabel>
              <Select
                value={filters.group_type || ''}
                label="Group Type"
                onChange={(e) => onFilterChange('group_type', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="group_public">Public</MenuItem>
                <MenuItem value="group_private">Private</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.is_active || ''}
                label="Status"
                onChange={(e) => onFilterChange('is_active', e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Min Members"
              type="number"
              value={filters.min_members || ''}
              onChange={(e) => onFilterChange('min_members', e.target.value)}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Max Members"
              type="number"
              value={filters.max_members || ''}
              onChange={(e) => onFilterChange('max_members', e.target.value)}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>

          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<FilterIcon />}
              onClick={onApplyFilters}
              sx={{
                bgcolor: '#4F46E5',
                '&:hover': { bgcolor: '#4338CA' },
                minHeight: '40px'
              }}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Groups Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Group</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Members</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Messages</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <CircularProgress sx={{ color: '#4F46E5' }} />
                  </TableCell>
                </TableRow>
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No groups found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Badge
                          color={group.is_active ? 'success' : 'default'}
                          variant="dot"
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        >
                          <Avatar
                            src={group.avatar || ''}
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: alpha(getGroupTypeColor(group.group_type), 0.2),
                              color: getGroupTypeColor(group.group_type)
                            }}
                          >
                            {group.name?.[0]?.toUpperCase() || 'G'}
                          </Avatar>
                        </Badge>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {group.name || `Group ${group.id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {group.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getGroupTypeIcon(group.group_type)}
                        label={getGroupTypeLabel(group.group_type)}
                        size="small"
                        sx={{
                          bgcolor: alpha(getGroupTypeColor(group.group_type), 0.1),
                          color: getGroupTypeColor(group.group_type),
                          border: `1px solid ${alpha(getGroupTypeColor(group.group_type), 0.3)}`,
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(group.is_active)}
                        label={getStatusLabel(group.is_active)}
                        color={getStatusColor(group.is_active)}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon fontSize="small" sx={{ color: '#4F46E5' }} />
                        <Typography variant="body2" fontWeight={600}>
                          {group.member_count || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MessageIcon fontSize="small" sx={{ color: '#F59E0B' }} />
                        <Typography variant="body2">
                          {group.message_count || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={group.created_by?.avatar || ''}
                          sx={{ width: 24, height: 24 }}
                        >
                          {group.created_by?.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">
                          {group.created_by?.username || 'Unknown'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(group.created_at).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(group.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => onViewDetails(group)}
                            sx={{ color: '#4F46E5' }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => onEdit(group)}
                            sx={{ color: '#F59E0B' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {group.is_active ? (
                          <Tooltip title="Deactivate">
                            <IconButton
                              size="small"
                              onClick={() => onToggleStatus(group, false)}
                              sx={{ color: '#EF4444' }}
                            >
                              <InactiveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Activate">
                            <IconButton
                              size="small"
                              onClick={() => onToggleStatus(group, true)}
                              sx={{ color: '#10B981' }}
                            >
                              <ActiveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => onDelete(group)}
                            sx={{ color: '#EF4444' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalGroups}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onChangePage}
          onRowsPerPageChange={onChangeRowsPerPage}
          labelRowsPerPage="Groups per page:"
        />
      </Paper>
    </Box>
  );
};

export default GroupsListTab;