// src/components/messaging/Groups/GroupAdminPanel/components/AdminFooter.jsx
import React from 'react';
import { Box, Typography, CardContent } from '@mui/material';
import { AdminPanelSettings as AdminPanelSettingsIcon } from '@mui/icons-material';
import { Fade } from '@mui/material';
import { ModernCard } from './GroupAdminPanelStyles';

const AdminFooter = ({ group, isMobile }) => {
  return (
    <Fade in={true}>
      <ModernCard sx={{ mt: 6 }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 1 : 0,
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AdminPanelSettingsIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="body2" color="text.secondary">
                Group Administration • {group?.name}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Last updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        </CardContent>
      </ModernCard>
    </Fade>
  );
};

export default AdminFooter;