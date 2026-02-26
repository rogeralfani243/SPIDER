// src/components/dashboard-admin/components/Views/PostsViewWithTabs.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ListAlt as ListIcon
} from '@mui/icons-material';
import PostsView from './PostsView';
import PostsAnalyticsView from './PostsAnalyticsView';

// Tab Panel Component
function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`posts-tabpanel-${index}`}
      aria-labelledby={`posts-tab-${index}`}
    >
      {value === index && children}
    </div>
  );
}

const PostsViewWithTabs = ({ posts, loading }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="posts management tabs"
          sx={{ px: 2 }}
        >
          <Tab 
            icon={<ListIcon />} 
            iconPosition="start" 
            label="Posts List" 
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<BarChartIcon />} 
            iconPosition="start" 
            label="Analytics" 
            sx={{ minHeight: 64 }}
          />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <PostsView posts={posts} loading={loading} />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <PostsAnalyticsView />
      </TabPanel>
    </Box>
  );
};

export default PostsViewWithTabs;