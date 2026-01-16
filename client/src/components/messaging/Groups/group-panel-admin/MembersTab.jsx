// src/components/messaging/Groups/GroupAdminPanel/components/tabs/MembersTab.jsx
import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Pagination,
  InputAdornment,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarTodayIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  PersonRemove as PersonRemoveIcon,
} from '@mui/icons-material';
import { Fade, Grow } from '@mui/material';
import { ModernCard, MemberListItem, ListItemAvatar, ListItemText } from './GroupAdminPanelStyles';

const MembersTab = ({
  members,
  group,
  searchTerm,
  onSearch,
  onRemoveMember,
  isMobile,
  paginatedMembers,
  totalPages,
  page,
  onPageChange,
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
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PeopleIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Member Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {members.length} total members
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                placeholder="Search members..."
                value={searchTerm}
                onChange={onSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: isMobile ? '100%' : 250 }}
              />
              <Button
                startIcon={<DownloadIcon />}
                variant="outlined"
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Export
              </Button>
            </Box>
          </Box>
          
          <ModernCard>
            <CardContent sx={{ p: 3 }}>
              <List disablePadding>
                {paginatedMembers.map((member) => (
                  <Grow in={true} key={member.user?.id || member.id}>
                    <MemberListItem
                      secondaryAction={
                        member.role !== 'owner' && member.user?.id !== group.created_by?.id && (
                          <Tooltip title="Remove member">
                            <IconButton
                              size="small"
                              onClick={() => onRemoveMember(member.user?.id || member.user_id)}
                              sx={{ 
                                color: 'error.main',
                                '&:hover': { 
                                  bgcolor: 'error.light',
                                  color: 'error.contrastText'
                                }
                              }}
                            >
                              <PersonRemoveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={member.user?.profile_image || member.user_profile?.image}
                          alt={member.user?.username}
                          sx={{ 
                            width: 48, 
                            height: 48,
                            border: '2px solid',
                            borderColor: member.role === 'owner' ? 'warning.main' : 
                                      member.role === 'admin' ? 'primary.main' : 'divider',
                          }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {member.user?.username || 'Unknown member'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {member.role === 'owner' && (
                                <Chip
                                  label="Owner"
                                  size="small"
                                  color="warning"
                                  icon={<WorkspacePremiumIcon />}
                                  sx={{ fontWeight: 500 }}
                                />
                              )}
                              {member.role === 'admin' && (
                                <Chip
                                  label="Admin"
                                  size="small"
                                  color="primary"
                                  icon={<SecurityIcon />}
                                  sx={{ fontWeight: 500 }}
                                />
                              )}
                              {member.user?.id === group.created_by?.id && (
                                <Chip
                                  label="Creator"
                                  size="small"
                                  color="success"
                                  icon={<VerifiedIcon />}
                                  sx={{ fontWeight: 500 }}
                                />
                              )}
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              <CalendarTodayIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </Typography>
                            {member.last_active && (
                              <Typography variant="caption" sx={{ color: 'success.main', display: 'block' }}>
                                Active {new Date(member.last_active).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </MemberListItem>
                  </Grow>
                ))}
              </List>
              
              {/* Pagination - Mobile Only */}
              {isMobile && totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={onPageChange}
                    color="primary"
                    size="medium"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </CardContent>
          </ModernCard>
        </Box>
      </Box>
    </Fade>
  );
};

export default MembersTab;