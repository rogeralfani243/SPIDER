// src/components/groups/GroupDetailPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Alert,
  CircularProgress,
  Skeleton,
  Typography,
  Button,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Home as HomeIcon,
  Groups as GroupsIcon,
  ChevronRight as ChevronRightIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { groupAPI, conversationAPI } from '../../../hooks/messaging/messagingApi';
import { useAuth } from '../../../hooks/useAuth';

// Composants enfants
import GroupHeader from './group-detail/GroupDetailHeader';
import GroupMainContent from './group-detail/GroupMainContent';
import GroupTabsSection from './group-detail/GroupTabs';
import JoinGroupDialog from './group-detail/JoinGroupDialog';
import GroupFeedbackDialog from './group-detail/GroupFeedbackDialog';
import AdminPanelDialog from './group-detail/AdminPanelDialog';
import LoadingState from './group-detail/LoadingState';
import ErrorState from './group-detail/ErrorState';
import DashboardMain from '../../dashboard_main';
const GroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // États
  const[JoinError, setJoinError] = useState('')
  const [group, setGroup] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (id) {
      loadGroupDetails();
    }
  }, [id]);

  const loadGroupDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    setError('');
    setAccessDenied(false);
    
    try {
      console.log('🟡 Loading group details for ID:', id);
      
      // 1. Load group details
      const groupRes = await groupAPI.getGroupDetails(id);
      console.log('✅ Group API response:', groupRes.data);
      const groupData = groupRes.data;
      setGroup(groupData);
      
      // 2. Load feedbacks
      try {
        const feedbacksRes = await groupAPI.getGroupFeedbacks(id, { page: 1, limit: 5 });
        const feedbacksData = feedbacksRes.data?.results || feedbacksRes.data || [];
        setFeedbacks(Array.isArray(feedbacksData) ? feedbacksData : []);
      } catch (feedbackErr) {
        console.warn('Could not load feedbacks:', feedbackErr);
        setFeedbacks([]);
      }
      
      // 3. Load members based on user permissions
      await loadMembersBasedOnAccess(groupData);
      
    } catch (err) {
      console.error('❌ Error loading group details:', err);
      
      if (err.response?.status === 403) {
        setAccessDenied(true);
        setError('You do not have permission to view this group.');
      } else {
        setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to load group details. Please try again.');
      }
      
      setGroup(null);
      setFeedbacks([]);
      setAllMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMembersBasedOnAccess = async (groupData) => {
    try {
      setMembersLoading(true);
      
      // Check if user has access to see all members
      const isUserMember = groupData?.is_member === true;
      const isUserAdmin = groupData?.created_by?.id === user?.id;
      const isPublicGroup = groupData?.group_type === 'group_public';
      
      console.log('🔍 User permissions:', {
        isUserMember,
        isUserAdmin,
        isPublicGroup,
        isAuthenticated
      });
      
      let membersData = [];
      
      // Try to load members from API if user has access
      if (isAuthenticated && (isUserMember || isUserAdmin)) {
        try {
          console.log('🔄 Loading members via API (user has access)');
          const membersRes = await groupAPI.getGroupMembers(id, { 
            page: 1, 
            limit: 100 
          });
          
          console.log('✅ Members API response structure:', Object.keys(membersRes.data || {}));
          
          // Extract members from different response formats
          if (membersRes.data?.results && Array.isArray(membersRes.data.results)) {
            membersData = membersRes.data.results;
          } else if (Array.isArray(membersRes.data)) {
            membersData = membersRes.data;
          } else if (membersRes.data?.members && Array.isArray(membersRes.data.members)) {
            membersData = membersRes.data.members;
          }
          
          console.log(`✅ Loaded ${membersData.length} members from API`);
          
        } catch (apiErr) {
          console.warn('❌ Members API failed:', apiErr);
        }
      }
      
      // If no members from API, try to extract from group data
      if (membersData.length === 0) {
        console.log('🔄 Extracting members from group data');
        
        if (groupData?.group_members && Array.isArray(groupData.group_members)) {
          membersData = groupData.group_members;
          console.log(`✅ Using ${membersData.length} members from group_members`);
        } else if (groupData?.members && Array.isArray(groupData.members)) {
          membersData = groupData.members;
          console.log(`✅ Using ${membersData.length} members from members`);
        }
      }
      
      // For non-members viewing public groups, show limited preview
      if (!isUserMember && !isUserAdmin && isPublicGroup) {
        console.log('ℹ️ Non-member viewing public group - showing limited preview');
        // Show only first 10 members for preview
        membersData = membersData.slice(0, 10);
      }
      
      // Filter out any null/undefined members
      membersData = membersData.filter(member => member && member.user);
      
      console.log(`✅ Final members count: ${membersData.length}`);
      console.log('✅ Members sample:', membersData.slice(0, 3));
      
      setAllMembers(membersData);
      
    } catch (err) {
      console.error('❌ Error loading members:', err);
      setAllMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

// Dans GroupDetailPage.jsx
const handleJoinRequest = async (message = '') => {
  if (!isAuthenticated) {
    navigate('/login', { state: { from: `/groups/${id}` } });
    return;
  }
  
  try {
    const response = await groupAPI.requestToJoin(id, { message });
    alert(response.data.detail || 'Join request sent successfully!');
    setJoinDialogOpen(false);
    setJoinMessage('');
    loadGroupDetails(); // Refresh group data
  } catch (err) {
    console.error('Join request error:', err);
    
    // Vérifier si c'est une erreur 403 (Forbidden - User removed by admin)
    if (err.response?.status === 403) {
      // Afficher le message spécifique du backend
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail || 
                          'You were removed from this group by an admin and cannot rejoin.';
      
      // Vous pouvez utiliser un état pour afficher l'erreur dans le dialog
      setJoinError(errorMessage);
      
      // Ou utiliser un alert
      alert(errorMessage);
      
      // Si c'est un bannissement admin, fermer le dialog
      if (errorMessage.includes('removed by admin') || errorMessage.includes('USER WAS REMOVED BY ADMIN')) {
        setJoinDialogOpen(false);
      }
    } else {
      alert(err.response?.data?.detail || 'Failed to send join request. Please try again.');
    }
  }
};

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await groupAPI.leaveGroup(id);
      alert(response.data.detail || 'You have successfully left the group.');
      navigate('/groups/');
    } catch (err) {
      console.error('Leave group error:', err);
      alert(err.response?.data?.detail || 'Failed to leave group. Please try again.');
    }
  };

  const handleSubmitFeedback = async (rating, comment) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/groups/${id}` } });
      return;
    }
    
    try {
      await groupAPI.submitFeedback(id, { rating, comment });
      alert('Thank you for your feedback!');
      setFeedbackDialogOpen(false);
      loadGroupDetails(); // Refresh to show new feedback
    } catch (err) {
      console.error('Submit feedback error:', err);
      alert(err.response?.data?.detail || 'Failed to submit feedback. Please try again.');
    }
  };



const handleContactAdmin = async () => {
  if (!isAuthenticated) {
    navigate('/login', { state: { from: `/groups/${id}` } });
    return;
  }
  
  if (group?.created_by?.id) {
    try {
      // 1. Vérifier si une conversation existe déjà
      const response = await conversationAPI.getOrCreateConversationWithUser(
        group.created_by.id
      );
      
      // 2. Rediriger vers la conversation
      navigate(`/message?conversation_id=${response.data.id}`);
      
    } catch (error) {
      console.error('Error creating conversation:', error);
      
      // Fallback : Redirection simple
      navigate(`/message?user_id=${group.created_by.id}`);
    }
  }
};

const handleOpenChat = () => {
  if (!isAuthenticated) {
    navigate('/login', { state: { from: `/groups/${id}` } });
    return;
  }
  
  if (isMember) {
    // Redirection vers la messagerie avec paramètre pour sélectionner la conversation du groupe
    navigate(`/message?select_group=${id}`);
  } else {
    alert('You must be a member of the group to access the chat.');
  }
};
  // Calculate rating distribution
  const getRatingDistribution = () => {
    if (!group?.rating_distribution || typeof group.rating_distribution !== 'object') {
      return [5, 4, 3, 2, 1].map(stars => ({
        stars,
        count: 0,
        percentage: 0,
      }));
    }
    
    const distribution = group.rating_distribution;
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    
    return [5, 4, 3, 2, 1].map(stars => ({
      stars,
      count: distribution[stars] || 0,
      percentage: total > 0 ? ((distribution[stars] || 0) / total) * 100 : 0,
    }));
  };

  // Get my feedback
  const getMyFeedback = () => {
    if (!user || !feedbacks.length) return null;
    return feedbacks.find(f => f.user?.id === user.id);
  };

  // Check permissions
  const isAdmin = group?.created_by?.id === user?.id;
  const isMember = group?.is_member === true || allMembers.some(m => m.user?.id === user?.id);
  const hasPendingRequest = group?.has_pending_request || false;
  const canJoin = group?.can_join && !isMember && !hasPendingRequest && !group?.is_full;
  const isPrivateGroup = group?.group_type === 'group_private';
  const isPublicGroup = group?.group_type === 'group_public';
  const can_invite = group?.can_invite && isMember 
  // Loading State
  if (loading) {
    return <LoadingState />;
  }

  // Error State
  if (error || !group) {
    return <ErrorState error={error} accessDenied={accessDenied} navigate={navigate} />;
  }

  return (
   <>

    <Container maxWidth="lg" sx={{ py: 4, paddingTop:'4em',   zIndex: 1,  position: 'relative',  }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" color="inherit" sx={{ display: 'flex', alignItems: 'center','&:hover':{color:'#850505ff'} }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Link component={RouterLink} to="/groups/" color="inherit" sx={{ display: 'flex', alignItems: 'center','&:hover':{color:'#850505ff'} }}>
          <GroupsIcon sx={{ mr: 0.5 }} fontSize="small" />
          Groups
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <ChevronRightIcon sx={{ mr: 0.5 }} fontSize="small" />
          {group.name}
        </Typography>
      </Breadcrumbs>

      {/* Header Card */}
      <GroupHeader
        group={group}
        isAdmin={isAdmin}
        isMember={isMember}
        hasPendingRequest={hasPendingRequest}
        canJoin={canJoin}
        isPrivateGroup={isPrivateGroup}
        onJoinClick={() => setJoinDialogOpen(true)}
        onLeaveGroup={handleLeaveGroup}
        onOpenChat={handleOpenChat}
        onEditGroup={() => navigate(`/groups/${id}/edit`)}
        onOpenAdminPanel={() => navigate(`/groups/${id}/admin`)}
      />

      {/* Main Content */}
      <GroupMainContent
        group={group}
        allMembers={allMembers}
        isMember={isMember}
        isPublicGroup={isPublicGroup}
        showFullDescription={showFullDescription}
        setShowFullDescription={setShowFullDescription}
        getRatingDistribution={getRatingDistribution}
        getMyFeedback={getMyFeedback}
        handleContactAdmin={handleContactAdmin}
        setFeedbackDialogOpen={setFeedbackDialogOpen}
        isAuthenticated={isAuthenticated}
        navigate={navigate}
        id={id}
      />

      {/* Tabs Section */}
      <GroupTabsSection
        tabValue={tabValue}
        can_invite={ can_invite }
        setTabValue={setTabValue}
        group={group}
        allMembers={allMembers}
        membersLoading={membersLoading}
        isMember={isMember}
        isAdmin={isAdmin}
        feedbacks={feedbacks}
        navigate={navigate}
        id={id}
        loadMembersBasedOnAccess={() => loadMembersBasedOnAccess(group)}
        setFeedbackDialogOpen={setFeedbackDialogOpen}
      />

      {/* Join Request Dialog */}
      <JoinGroupDialog
        open={joinDialogOpen}
        onClose={() => setJoinDialogOpen(false)}
        group={group}
        joinMessage={joinMessage}
        setJoinMessage={setJoinMessage}
        handleJoinRequest={handleJoinRequest}
      />

      {/* Feedback Dialog */}
      <GroupFeedbackDialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        group={group}
        getMyFeedback={getMyFeedback}
        handleSubmitFeedback={handleSubmitFeedback}
      />

      {/* Admin Panel */}
      <AdminPanelDialog
        open={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
        group={group}
        isAdmin={isAdmin}
        loadGroupDetails={loadGroupDetails}
      />
    </Container>
   </>
  );
};

export default GroupDetailPage;