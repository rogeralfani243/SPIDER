// src/components/dashbord-table/activity/useActivityState.js
import { useState, useEffect } from 'react';

export const useActivityState = ({ onMarkAsRead, onFilterChange }) => {
  const [filter, setFilter] = useState('all');
  const [viewedActivities, setViewedActivities] = useState(new Set());

  // Initialize from localStorage
  useEffect(() => {
    const savedViewed = localStorage.getItem('viewedActivities');
    if (savedViewed) {
      setViewedActivities(new Set(JSON.parse(savedViewed)));
    }
  }, []);

  // Save to localStorage when viewedActivities changes
  useEffect(() => {
    if (viewedActivities.size > 0) {
      localStorage.setItem('viewedActivities', JSON.stringify([...viewedActivities]));
    }
  }, [viewedActivities]);

  // Mark an activity as read
  const markActivityAsRead = (activityId) => {
    const newViewed = new Set(viewedActivities);
    newViewed.add(activityId);
    setViewedActivities(newViewed);
    
    if (onMarkAsRead) {
      onMarkAsRead(activityId);
    }
  };

  // Mark all as read
  const markAllAsRead = (activities) => {
    const allIds = activities.map(activity => activity.id);
    const newViewed = new Set([...viewedActivities, ...allIds]);
    setViewedActivities(newViewed);
    
    if (onMarkAsRead) {
      allIds.forEach(id => onMarkAsRead(id));
    }
  };

  // Check if activity is unread
  const isActivityUnread = (activityId) => {
    return !viewedActivities.has(activityId);
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (onFilterChange) {
      onFilterChange(newFilter);
    }
  };

  return {
    filter,
    setFilter,
    viewedActivities,
    setViewedActivities,
    markActivityAsRead,
    markAllAsRead,
    isActivityUnread,
    handleFilterChange
  };
};

export default useActivityState;