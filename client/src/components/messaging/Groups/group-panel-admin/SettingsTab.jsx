// src/components/messaging/Groups/GroupAdminPanel/components/tabs/SettingsTab.jsx
import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Edit as EditIcon,
  Group as GroupIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Fade } from '@mui/material';
import { ModernCard } from './GroupAdminPanelStyles';

const SettingsTab = ({ 
  onEditGroup, 
  onGoToGroup, 
  onRefresh,
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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <SettingsIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Group Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage group configuration and permissions
            </Typography>
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ModernCard sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <EditIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Edit Group
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Update group information and settings
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Modify group name, description, rules, visibility settings, and other configuration options.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={onEditGroup}
                  startIcon={<EditIcon />}
                  sx={{ borderRadius: 2, mt: 2 }}
                >
                  Edit Group Settings
                </Button>
              </CardContent>
            </ModernCard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <ModernCard sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <GroupIcon sx={{ fontSize: 32, color: 'secondary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      View Group
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Return to public group page
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Navigate back to the main group page to view content and interact as a regular member.
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onGoToGroup}
                  startIcon={<GroupIcon />}
                  sx={{ borderRadius: 2, mt: 2 }}
                >
                  Go to Group Page
                </Button>
              </CardContent>
            </ModernCard>
          </Grid>
          
          <Grid item xs={12}>
         {/*
            <ModernCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <RefreshIcon sx={{ fontSize: 32, color: 'info.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Data Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Refresh and synchronize group data
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="info"
                    onClick={onRefresh}
                    startIcon={<RefreshIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Refresh Data
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Export Data
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Clear Cache
                  </Button>
                </Box>
              </CardContent>
            </ModernCard>
         */}
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default SettingsTab;