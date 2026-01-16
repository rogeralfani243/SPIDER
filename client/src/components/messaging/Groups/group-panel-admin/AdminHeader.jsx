// src/components/messaging/Groups/GroupAdminPanel/components/AdminHeader.jsx
import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Container,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
} from '@mui/icons-material';
import { GradientHeader, ProfessionalBadge } from './GroupAdminPanelStyles';

const AdminHeader = ({ 
  group, 
  isMobile, 
  onClose, 
  onRefresh 
}) => {
  const primaryClr = `linear-gradient(
  135deg,
  rgb(10, 10, 10),
  rgb(60, 10, 10),
  rgb(180, 20, 20),
  rgb(255, 0, 80)
); `
  return (
    <GradientHeader>
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0,
          position: 'relative', 
          zIndex: 1 ,
    
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            gap: 3,
            flexDirection: isMobile ? 'column' : 'row',
            textAlign: isMobile ? 'center' : 'left',
            width: isMobile ? '100%' : 'auto'
          }}>
            <Avatar
              src={group?.group_photo_url}
              alt={group?.name}
              sx={{ 
                width: 64, 
                height: 64,
                border: '3px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <GroupIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                flexWrap: 'wrap', 
                mb: 0.5,
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, color: 'white' }}>
                  {group?.name}
                </Typography>
                <ProfessionalBadge
                  label="ADMINISTRATION"
                  icon={<AdminPanelSettingsIcon />}
                  size="medium"
                />
              </Box>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                maxWidth: 600,
                textAlign: isMobile ? 'center' : 'left'
              }}>
                {group?.description}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5,
            mt: isMobile ? 2 : 0,
            alignSelf: isMobile ? 'center' : 'auto'
          }}>
            <Tooltip title="Close panel">
              <IconButton
                onClick={onClose}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh data">
              <IconButton
                onClick={onRefresh}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Container>
    </GradientHeader>
  );
};

export default AdminHeader;