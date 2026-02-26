// src/components/dashboard-admin/components/Views/GroupsView.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Tabs, Tab, Button
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ListAlt as ListIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useAdminData } from '../../../hooks/useAdminData';
import useAdminApi from '../../../hooks/useAdminApi';

import TabPanel from './groups/TabPanel';
import GroupsListTab from './groups/GroupsListTab';
import GroupsAnalyticsTab from './groups/GroupsAnalyticsTab';
import GroupDetailsDialog from './groups/GroupDetailsDialog';
import EditGroupDialog from './groups/EditGroupDialog';

const GroupsView = () => {
  const { showSnackbar } = useAdminData();
  const { fetchGroups, updateGroup, deleteGroup, fetchGroupAnalytics } = useAdminApi();
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Groups state
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalGroups, setTotalGroups] = useState(0);
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    group_type: '',
    is_active: '',
    min_members: '',
    max_members: '',
    location: '',
    created_from: '',
    created_to: ''
  });

  // Load groups on mount and when page/rowsPerPage change
  useEffect(() => {
    loadGroups();
  }, [page, rowsPerPage]);

  // Load analytics when tab changes to analytics
  useEffect(() => {
    if (activeTab === 1) {
      loadAnalytics();
    }
  }, [activeTab]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await fetchGroups(params);
      setGroups(response.data.items);
      setTotalGroups(response.data.pagination.total_items);
    } catch (error) {
      console.error('Error loading groups:', error);
      showSnackbar('Error loading groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetchGroupAnalytics();
      setAnalyticsData(response);
    } catch (error) {
      console.error('Error loading analytics:', error);
      showSnackbar('Error loading analytics', 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setPage(0);
    loadGroups();
  };

  const handleRefresh = () => {
    if (activeTab === 0) {
      loadGroups();
    } else {
      loadAnalytics();
    }
    showSnackbar('Data refreshed', 'success');
  };

  const handleViewDetails = (group) => {
    setSelectedGroup(group);
    setDetailsDialogOpen(true);
  };

  const handleEdit = (group) => {
    setSelectedGroup(group);
    setEditFormData({
      id: group.id,
      name: group.name || '',
      description: group.description || '',
      group_type: group.group_type || 'group_public',
      is_active: group.is_active !== undefined ? group.is_active : true,
      max_participants: group.max_participants || '',
      location: group.location || '',
      website: group.website || '',
      requires_approval: group.requires_approval || false,
      can_anyone_invite: group.can_anyone_invite !== false,
      is_visible: group.is_visible !== false
    });
    setEditDialogOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSaveGroup = async () => {
    try {
      await updateGroup(selectedGroup.id, editFormData);
      showSnackbar('Group updated successfully', 'success');
      setEditDialogOpen(false);
      loadGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      showSnackbar('Error updating group', 'error');
    }
  };

  const handleToggleStatus = async (group, newStatus) => {
    try {
      await updateGroup(group.id, { is_active: newStatus });
      showSnackbar(`Group ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      loadGroups();
    } catch (error) {
      console.error('Error toggling group status:', error);
      showSnackbar('Error updating group status', 'error');
    }
  };

  const handleDelete = async (group) => {
    if (window.confirm(`Are you sure you want to delete "${group.name || `Group ${group.id}`}"? This action cannot be undone.`)) {
      try {
        await deleteGroup(group.id);
        showSnackbar('Group deleted successfully', 'success');
        loadGroups();
      } catch (error) {
        console.error('Error deleting group:', error);
        showSnackbar('Error deleting group', 'error');
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#4F46E5', mb: 1 }}>
            Groups Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {activeTab === 0 ? `${totalGroups} groups found` : 'Analytics & Insights'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ borderColor: '#4F46E5', color: '#4F46E5' }}
          >
            Refresh
          </Button>
          {activeTab === 0 && (
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs Navigation */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            bgcolor: 'white',
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#4F46E5'
              }
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#4F46E5',
              height: 3
            }
          }}
        >
          <Tab 
            icon={<ListIcon />} 
            iconPosition="start" 
            label="Groups List" 
          />
          <Tab 
            icon={<AnalyticsIcon />} 
            iconPosition="start" 
            label="Analytics" 
          />
        </Tabs>

        {/* Groups List Tab */}
        <TabPanel value={activeTab} index={0}>
          <GroupsListTab
            groups={groups}
            loading={loading}
            filters={filters}
            onFilterChange={handleFilterChange}
            onApplyFilters={handleApplyFilters}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            page={page}
            rowsPerPage={rowsPerPage}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
            totalGroups={totalGroups}
          />
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={1}>
          <GroupsAnalyticsTab
            analyticsData={analyticsData}
            loading={analyticsLoading}
            onRefresh={loadAnalytics}
          />
        </TabPanel>
      </Paper>

      {/* Details Dialog */}
      <GroupDetailsDialog
        open={detailsDialogOpen}
        group={selectedGroup}
        onClose={() => setDetailsDialogOpen(false)}
        onEdit={handleEdit}
      />

      {/* Edit Dialog */}
      <EditGroupDialog
        open={editDialogOpen}
        group={selectedGroup}
        formData={editFormData}
        onClose={() => setEditDialogOpen(false)}
        onFormChange={handleEditFormChange}
        onSave={handleSaveGroup}
      />
    </Box>
  );
};

export default GroupsView;