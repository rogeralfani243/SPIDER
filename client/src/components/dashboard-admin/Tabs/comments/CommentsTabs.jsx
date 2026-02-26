// src/components/dashboard-admin/Tabs/comments/CommentsTabs.jsx
import React from 'react';
import { Box, Tab, Tabs, Badge } from '@mui/material';

const CommentsTabs = ({ activeTab, onTabChange, hiddenCount = 0, spamCount = 0 }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs value={activeTab} onChange={(e, v) => onTabChange(v)}>
        <Tab label="All Comments" />
        <Tab 
          label={
            <Badge badgeContent={hiddenCount} color="default" max={999}>
              Hidden
            </Badge>
          } 
        />
        <Tab 
          label={
            <Badge badgeContent={spamCount} color="error" max={999}>
              Spam
            </Badge>
          } 
        />
        
        <Tab label="With Media" />
        <Tab label="Graphiq" />
      </Tabs>
    </Box>
  );
};

export default CommentsTabs;