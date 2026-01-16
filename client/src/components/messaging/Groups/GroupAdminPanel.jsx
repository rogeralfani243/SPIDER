// src/components/messaging/Groups/GroupAdminPanel/GroupAdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Alert,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { groupAPI } from '../../../hooks/messaging/messagingApi';

// Import des composants
import AdminHeader from './group-panel-admin/AdminHeader';
import AdminTabsComponent from './group-panel-admin/AdminTabs';
import LoadingState from './group-panel-admin/LoadinState';
import ErrorState from './group-panel-admin/ErrorState';
import AdminFooter from './group-panel-admin/AdminFooter';

// Import des onglets
import JoinRequestsTab from './group-panel-admin/JoinRequestTab';
import MembersTab from './group-panel-admin/MembersTab';
import AnalyticsTab from './group-panel-admin/AnalyticTab';
import SettingsTab from './group-panel-admin/SettingsTab';

const GroupAdminPanel = ({ onClose: externalOnClose }) => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabValue, setTabValue] = useState(0);
  const [joinRequests, setJoinRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [membersPerPage] = useState(10);
  
  // Load group data
  useEffect(() => {
    const loadGroup = async () => {
      if (!groupId) {
        setError('Group ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await groupAPI.getGroupDetails(groupId);
        setGroup(response.data);
        setError('');
      } catch (err) {
        console.error('Error loading group:', err);
        setError('Failed to load group information');
      } finally {
        setLoading(false);
      }
    };

    loadGroup();
  }, [groupId]);

  // Load admin data based on tab
  useEffect(() => {
    if (group) {
      loadAdminData();
    }
  }, [tabValue, group]);

  const loadAdminData = async () => {
    if (!group || !groupId) return;

    setDataLoading(true);
    try {
      if (tabValue === 0) {
        // Join requests
        const response = await groupAPI.getJoinRequests(groupId);
        setJoinRequests(response.data || []);
      } else if (tabValue === 1) {
        // Members
        const response = await groupAPI.getGroupMembers(groupId);
        setMembers(response.data?.results || response.data || []);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      if (tabValue === 0) {
        setError('Failed to load join requests');
      } else if (tabValue === 1) {
        setError('Failed to load members');
      }
    } finally {
      setDataLoading(false);
    }
  };

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      navigate(-1);
    }
  };

  const handleApproveRequest = async (requestId) => {
    if (!groupId || !requestId) return;

    try {
      await groupAPI.approveJoinRequest(groupId, requestId, { 
        review_notes: '' 
      });
      loadAdminData();
    } catch (err) {
      console.error('Error approving request:', err);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!groupId || !requestId) return;

    try {
      await groupAPI.rejectJoinRequest(groupId, requestId, { 
        review_notes: '' 
      });
      loadAdminData();
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!groupId || !memberId) return;

    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await groupAPI.removeMember(groupId, memberId);
        loadAdminData();
      } catch (err) {
        console.error('Error removing member:', err);
      }
    }
  };

  const handleEditGroup = () => {
    navigate(`/groups/${groupId}/edit`);
  };

  const handleGoToGroup = () => {
    navigate(`/groups/${groupId}`);
  };

  const handleRefresh = () => {
    loadAdminData();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Filter members based on search
  const filteredMembers = members.filter(member =>
    member.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination for members (mobile only)
  const startIndex = (page - 1) * membersPerPage;
  const endIndex = startIndex + membersPerPage;
  const paginatedMembers = isMobile ? filteredMembers.slice(startIndex, endIndex) : filteredMembers;
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error && !group) {
    return <ErrorState error={error} onClose={handleClose} />;
  }

  const renderTabContent = () => {
    switch (tabValue) {
      case 0: // Join requests
        return (
          <JoinRequestsTab
            joinRequests={joinRequests}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
            dataLoading={dataLoading}
          />
        );
      case 1: // Members
        return (
          <MembersTab
            members={members}
            group={group}
            searchTerm={searchTerm}
            onSearch={handleSearch}
            onRemoveMember={handleRemoveMember}
            isMobile={isMobile}
            paginatedMembers={paginatedMembers}
            totalPages={totalPages}
            page={page}
            onPageChange={handlePageChange}
            dataLoading={dataLoading}
          />
        );
      case 2: // Statistics
        return (
          <AnalyticsTab
            group={group}
            dataLoading={dataLoading}
          />
        );
      case 3: // Settings
        return (
          <SettingsTab
            onEditGroup={handleEditGroup}
            onGoToGroup={handleGoToGroup}
            onRefresh={handleRefresh}
            dataLoading={dataLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        pb: 6,
        overflowX: 'hidden',
      }}
    >
      {/* Header */}
      <AdminHeader
        group={group}
        isMobile={isMobile}
        onClose={handleClose}
        onRefresh={handleRefresh}
      />

      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: isMobile ? -6 : -4, 
          position: 'relative', 
          zIndex: 2,
          px: isMobile ? 2 : 3
        }}
      >
        {/* Tabs Navigation */}
        <AdminTabsComponent
          tabValue={tabValue}
          setTabValue={setTabValue}
          isMobile={isMobile}
          joinRequests={joinRequests}
        />

        {/* Main Content */}
        <Box sx={{ position: 'relative' }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
              }}
              action={
                <Button 
                  size="small" 
                  onClick={handleRefresh}
                  startIcon={<RefreshIcon />}
                >
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}
          
          {renderTabContent()}
        </Box>

        {/* Footer */}
        <AdminFooter group={group} isMobile={isMobile} />
      </Container>
    </Box>
  );
};

export default GroupAdminPanel;