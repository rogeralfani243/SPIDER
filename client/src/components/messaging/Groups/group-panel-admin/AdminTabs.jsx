// src/components/messaging/Groups/GroupAdminPanel/components/AdminTabs.jsx
import React from 'react';
import {
  Box,
  Badge,
  Tab,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { ModernCard, AdminTabs as StyledTabs } from './GroupAdminPanelStyles';

const AdminTabsComponent = ({ 
  tabValue, 
  setTabValue, 
  isMobile, 
  joinRequests 
}) => {
  return (
    <ModernCard sx={{ mb: 4 }}>
      <StyledTabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        variant={isMobile ? "scrollable" : "fullWidth"}
        scrollButtons={isMobile ? "auto" : false}
        allowScrollButtonsMobile
      >
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge badgeContent={joinRequests.length} color="error">
                <NotificationsIcon />
              </Badge>
              {!isMobile && <span>Requests</span>}
            </Box>
          }
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon />
              {!isMobile && <span>Members</span>}
            </Box>
          }
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChartIcon />
              {!isMobile && <span>Analytics</span>}
            </Box>
          }
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon />
              {!isMobile && <span>Settings</span>}
            </Box>
          }
        />
      </StyledTabs>
    </ModernCard>
  );
};

export default AdminTabsComponent;