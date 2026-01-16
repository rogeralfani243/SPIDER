import React from 'react';
import {
  Box,
  Typography,
  Button,
  Badge,
  Stack,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  FilterList as FilterListIcon,
  Notifications as NotificationsIcon,
  AssignmentInd as AssignmentIndIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { Fade, Grow } from '@mui/material';
import { ModernCard } from './GroupAdminPanelStyles';

const JoinRequestsTab = ({ 
  joinRequests, 
  onApprove, 
  onReject,
  dataLoading 
}) => {
  if (dataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Fade in={true}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={joinRequests.length} color="error">
              <PersonAddIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            </Badge>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Join Requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {joinRequests.length} pending request{joinRequests.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          <Button
            startIcon={<FilterListIcon />}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2 }}
          >
            Filter
          </Button>
        </Box>
        
        {joinRequests.length === 0 ? (
          <ModernCard>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <NotificationsIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Pending Requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All join requests have been processed
              </Typography>
            </CardContent>
          </ModernCard>
        ) : (
          <ModernCard>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                {joinRequests.map((request) => (
                  <Grow in={true} key={request.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            src={request.user?.profile_image || request.user_profile?.image}
                            alt={request.user?.username}
                            sx={{ 
                              width: 48, 
                              height: 48,
                              border: '2px solid',
                              borderColor: 'warning.light',
                            }}
                          />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {request.user?.username || 'Unknown user'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <AssignmentIndIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                              {new Date(request.created_at).toLocaleDateString()}
                            </Typography>
                            {request.message && (
                              <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary', fontStyle: 'italic' }}>
                                "{request.message}"
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              onClick={() => onApprove(request.id)}
                              sx={{ color: 'success.main' }}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              onClick={() => onReject(request.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Paper>
                  </Grow>
                ))}
              </Stack>
            </CardContent>
          </ModernCard>
        )}
      </Box>
    </Fade>
  );
};

export default JoinRequestsTab;