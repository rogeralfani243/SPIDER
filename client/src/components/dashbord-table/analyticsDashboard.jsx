// frontend/src/pages/dashboard/AnalyticsDashboard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Container, Box, Tabs, Tab, Button } from '@mui/material';
import { 
  Dashboard, PostAdd, Comment, Star, Feedback, Groups,
  Report, Public, Timeline, EmojiEvents, FilterAlt 
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useAnalyticsData } from './analytics/useAnalyticData';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import ProfileHeader from '../profil_details/ProfileHeader';
import StatsCards from './analytics/StatsCard';
import GeoFiltersDrawer from './analytics/GeoFiltersDrawer';

// Tabs
import OverviewTab from './analytics/OverviewTab';
import PostsTab from './PostsTab';
import CommentsTab from './analytics/comments/CommentsTab';
import RatingsTab from './RatingsTab';
import FeedbackTab from './FeedbackTab';
import GroupsTab from './analytics/comments/GroupsTab';
import ReportsTab from './analytics/ReportsTab';
import GeoTab from './analytics/GeoTab';
import TrendsTab from './analytics/TrendsTab';
import AchievementsTab from './analytics/AchievementsTab';

// Loading & Error
import LoadingScreen from './analytics/common/LoadingScreen';
import ErrorScreen from './analytics/common/ErrorScreen';
import ChartJS from './analytics/chartsConfig';
const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
  // Custom hook for data
  const { data, loading, error, refreshing, handleRefresh } = useAnalyticsData(timeRange);

  // ✅ Solution pour l'erreur "Canvas is already in use"
  // Nettoyer les graphiques lors du changement d'onglet
  useEffect(() => {
    return () => {
      // Force la destruction des instances Chart.js
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        const chartInstance = ChartJS.getChart(canvas);
        if (chartInstance) {
          chartInstance.destroy();
        }
      });
    };
  }, [activeTab]);

  // Chart refs for download
  const chartRefs = {
    activity: useRef(null),
    radar: useRef(null),
    categories: useRef(null),
    tags: useRef(null),
    ratings: useRef(null),
    feedback: useRef(null),
    geo: useRef(null),
    trends: useRef(null),
    comments: useRef(null),
    commentsByDay: useRef(null),
    commentsByWeek: useRef(null),
    commentsByMonth: useRef(null),
    commentsByCountry: useRef(null),
    commentsByCity: useRef(null),
    groups: useRef(null),
    groupsByDay: useRef(null),
    groupsByWeek: useRef(null),
    groupsByMonth: useRef(null),
    groupsByCountry: useRef(null),
    groupsByCity: useRef(null)
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // Filter states for geographical data
  const [geoFilters, setGeoFilters] = useState({
    selectedCountries: [],
    selectedCities: [],
    interactionType: 'all',
    minInteractions: 1,
    searchQuery: ''
  });

  if (loading && !refreshing) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={handleRefresh} />;
  }

  if (!data) return null;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Profile Header */}
      <ProfileHeader 
        profile={data.profile}
        engagement={data.engagement}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Stats Cards */}
      <StatsCards 
        posts={data.posts}
        comments={data.comments}
        ratings={data.ratings}
        feedback={data.feedback}
        groups={data.groups}
        messaging={data.messaging}
        reports={data.reports}
      />

      {/* Tabs */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', flex: 1 }}
        >
          <Tab icon={<Dashboard />} label="Overview" iconPosition="start" />
          <Tab icon={<PostAdd />} label="Posts" iconPosition="start" />
          <Tab icon={<Comment />} label="Comments" iconPosition="start" />
          <Tab icon={<Star />} label="Ratings" iconPosition="start" />
          <Tab icon={<Feedback />} label="Feedback" iconPosition="start" />
          <Tab icon={<Groups />} label="Groups" iconPosition="start" />
          <Tab icon={<Report />} label="Reports" iconPosition="start" />
          <Tab icon={<Public />} label="Geographical" iconPosition="start" />
          <Tab icon={<Timeline />} label="Trends" iconPosition="start" />
          <Tab icon={<EmojiEvents />} label="Achievements" iconPosition="start" />
        </Tabs>
        
        {activeTab === 7 && (
          <Button
            variant="outlined"
            startIcon={<FilterAlt />}
            onClick={() => setFilterDrawerOpen(true)}
            sx={{ ml: 2 }}
          >
            Filters
          </Button>
        )}
      </Box>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 0 && (
            <OverviewTab 
              data={data}
              chartRefs={chartRefs}
            />
          )}
          {activeTab === 1 && (
            <PostsTab 
              posts={data.posts}
              chartRefs={chartRefs}
            />
          )}
          {activeTab === 2 && (
            <CommentsTab 
              comments={data.comments}
              chartRefs={chartRefs}
            />
          )}
          {activeTab === 3 && (
            <RatingsTab 
              ratings={data.ratings}
              chartRefs={chartRefs}
            />
          )}
          {activeTab === 4 && (
            <FeedbackTab 
              feedback={data.feedback}
              chartRefs={chartRefs}
            />
          )}
          {activeTab === 5 && (
            <GroupsTab 
              groups={data.groups}
              chartRefs={chartRefs}
            />
          )}
          {activeTab === 6 && (
            <ReportsTab 
              reports={data.reports}
            />
          )}
          {activeTab === 7 && (
            <GeoTab 
              geographical={data.geographical}
              chartRefs={chartRefs}
              filters={geoFilters}
              setFilters={setGeoFilters}
            />
          )}
          {activeTab === 8 && (
            <TrendsTab 
              trends={data.trends}
              chartRefs={chartRefs}
            />
          )}
          {activeTab === 9 && (
            <AchievementsTab 
              profile={data.profile}
              engagement={data.engagement}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Filter Drawer */}
      <GeoFiltersDrawer 
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        geographical={data.geographical}
        filters={geoFilters}
        setFilters={setGeoFilters}
      />
    </Container>
  );
};

export default AnalyticsDashboard;