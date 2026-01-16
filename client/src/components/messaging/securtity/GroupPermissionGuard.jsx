// src/components/security/GroupPermissionGuard.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI } from '../../../hooks/messaging/messagingApi';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Button,
  Paper,
  Container,
} from '@mui/material';
import {
  Lock as LockIcon,
  Shield as ShieldIcon,
  ArrowBack as ArrowBackIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const SecurityCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  maxWidth: 500,
  margin: '0 auto',
  textAlign: 'center',
}));

const GroupPermissionGuard = ({ children, requireAdmin = false, requireCreator = false }) => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkPermissions = async () => {
      if (!groupId) {
        setError('Group ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await groupAPI.getGroupDetails(groupId);
        const groupData = response.data;
        
        // Get current user
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setLoading(false);
          return;
        }
        
        const user = JSON.parse(userStr);

        // Check permissions based on requirements
        let permission = false;
        
        if (requireCreator) {
          // User must be the creator
          permission = groupData.created_by?.id === user.id;
        } else if (requireAdmin) {
          // User must be creator or admin
          const isCreator = groupData.created_by?.id === user.id;
          const isAdmin = groupData.member_info?.some(member => 
            member.user?.id === user.id && ['owner', 'admin'].includes(member.role)
          );
          permission = isCreator || isAdmin;
        }

        setHasPermission(permission);
        
      } catch (err) {
        console.error('Error checking group permissions:', err);
        setError('Failed to verify permissions');
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [groupId, requireAdmin, requireCreator]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, fontWeight: 600 }}>
          <ShieldIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Verifying permissions...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert 
          severity="error"
          sx={{
            borderRadius: 3,
            p: 3,
          }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          }
        >
          <Typography variant="h6" gutterBottom>
            Error
          </Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Container>
    );
  }

  if (!hasPermission) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          p: 3,
        }}
      >
        <SecurityCard elevation={3}>
          <LockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'error.main' }}>
            Access Restricted
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', mb: 3 }}>
            {requireCreator ? 'Creator Access Required' : 'Administrator Access Required'}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary', mb: 4 }}>
            This section is only accessible to {requireCreator ? 'group creators' : 'group administrators'}.
            You don't have the required permissions to view this page.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate(`/groups/${groupId}`)}
              startIcon={<GroupIcon />}
              sx={{ borderRadius: 2 }}
            >
              View Group
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              startIcon={<ArrowBackIcon />}
              sx={{ borderRadius: 2 }}
            >
              Go Back
            </Button>
          </Box>
        </SecurityCard>
      </Box>
    );
  }

  return children;
};

export default GroupPermissionGuard;