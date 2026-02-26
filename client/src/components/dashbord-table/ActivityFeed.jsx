// src/components/ActivityFeed.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Button,
} from '@mui/material';
import { FilterList as FilterIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

import ActivityHeader from './activity/activityHeader';
import ActivityFilters from './activity/ActivityFilters';
import ActivityList from './activity/ActivityList';
import ActivityEmptyState from './activity/ActivityEmptyState.jsx';
import ActivityFilterEmptyState from './activity/ActivityFilterEmptyState';
import {
  getActivityIcon,
  getActivityColor,
  getActivityTitle,
  getActivityLabel
} from './activity/activityHelpers';
import { useActivityState } from './activity/useActivityState';
import {
  formatDate,
  formatRelativeDate,
  renderStars,
  renderPostInfo,
  renderCommentInfo
} from './activity/activityFormatters';

const ActivityFeed = ({ 
  activities, 
  loading, 
  showAll = false,
  onMarkAsRead,
  unreadCount,
  onFilterChange,
  handleClickFeedbacksViewOnProfile
}, ref) => {
  const {
    filter,
    setFilter,
    viewedActivities,
    markActivityAsRead,
    markAllAsRead,
    isActivityUnread,
    handleFilterChange: internalHandleFilterChange
  } = useActivityState({ onMarkAsRead, onFilterChange });

  // Activity types available for filtering
  const activityTypes = [
    { key: 'all', label: 'All Activities', icon: <FilterIcon /> },
    { key: 'post', label: 'Your Posts', icon: getActivityIcon('post') },
    { key: 'comment', label: 'Your Comments', icon: getActivityIcon('comment') },
    { key: 'comment_received', label: 'Comments Received', icon: getActivityIcon('comment_received') },
    { key: 'rating_received', label: 'Ratings Received', icon: getActivityIcon('rating_received') },
    { key: 'rating_given', label: 'Ratings Given', icon: getActivityIcon('rating_given') },
    { key: 'feedback_received', label: 'Feedback Received', icon: getActivityIcon('feedback_received') },
    { key: 'feedback_given', label: 'Feedback Given', icon: getActivityIcon('feedback_given') },
  ];

  // Handle viewing actions
  const handleViewPost = (postId, activityId, userId) => {
    markActivityAsRead(activityId);
    window.location.href = `/user/${userId}/posts/${postId}`;
  };

  const handleViewComment = (commentId, postId, activityId, userId) => {
    markActivityAsRead(activityId);
    window.location.href = `/user/${userId}/posts/${postId}`;
  };

  const handleViewProfile = (profileId, activityId) => {
    markActivityAsRead(activityId);
    window.location.href = `/profile/${profileId}`;
  };

  const handleViewOwnProfileFeedbacks = (profileId,activityId) => {
    markActivityAsRead(activityId);
    window.open(`/profile/${profileId}/`, '_blank');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Loading activities...
        </Typography>
      </Box>
    );
  }

  // Normalize activities
  const normalizedActivities = Array.isArray(activities) 
    ? activities 
    : (activities?.activities || activities?.results || []);

  if (!normalizedActivities || normalizedActivities.length === 0) {
    return <ActivityEmptyState />;
  }

  // Filter activities by type
  const filteredActivities = filter === 'all' 
    ? normalizedActivities 
    : normalizedActivities.filter(activity => {
        if (filter === 'rating_received') {
          return activity.type === 'rating_received' || activity.type === 'rating';
        } else if (filter === 'rating_given') {
          return activity.type === 'rating_given';
        }
        return activity.type === filter;
      });

  // Limit activities if not showing all
  const displayActivities = showAll ? filteredActivities : filteredActivities.slice(0, 10);

  // Count unread activities
  const unreadActivitiesCount = filteredActivities.filter(
    activity => isActivityUnread(activity.id)
  ).length;

  // Message quand aucun résultat pour le filtre
  if (showAll && filteredActivities.length === 0 && filter !== 'all') {
    return (
      <ActivityFilterEmptyState
        filter={filter}
        handleFilterChange={() => internalHandleFilterChange('all')}
        getActivityLabel={getActivityLabel}
        handleClickFeedbacksViewOnProfile={handleClickFeedbacksViewOnProfile}
      />
    );
  }

  return (
    <Box>
      {/* Header with unread count and mark all as read */}
      {showAll && (
        <ActivityHeader
          unreadActivitiesCount={unreadActivitiesCount}
          onMarkAllAsRead={markAllAsRead}
        />
      )}

      {/* Activity Filters */}
      {showAll && (
        <ActivityFilters
          activityTypes={activityTypes}
          filter={filter}
          onFilterChange={internalHandleFilterChange}
          getActivityLabel={getActivityLabel}
        />
      )}

      {/* Activities list */}
      <ActivityList
        displayActivities={displayActivities}
        isActivityUnread={isActivityUnread}
        markActivityAsRead={markActivityAsRead}
        handleViewPost={handleViewPost}
        handleViewComment={handleViewComment}
        handleViewProfile={handleViewProfile}
        handleViewOwnProfileFeedbacks={handleViewOwnProfileFeedbacks}
        getActivityIcon={getActivityIcon}
        getActivityColor={getActivityColor}
        getActivityTitle={getActivityTitle}
        getActivityLabel={getActivityLabel}
        formatDate={formatDate}
        formatRelativeDate={formatRelativeDate}
        renderStars={renderStars}
        renderPostInfo={renderPostInfo}
        renderCommentInfo={renderCommentInfo}
      />

      {/* Footer with information */}
      {showAll && (
        <Box sx={{ 
          p: 2, 
          backgroundColor: 'action.hover', 
          borderRadius: 1,
          mt: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1
        }}>
          <Typography variant="caption" color="text.secondary">
            Showing {displayActivities.length} of {filteredActivities.length} activities
            {filter !== 'all' && ` (filtered by: ${getActivityLabel(filter).toLowerCase()})`}
            {unreadActivitiesCount > 0 && ` • ${unreadActivitiesCount} unread`}
            
            {/* Debug info pour les ratings */}
            {(filter === 'rating_received' || filter === 'rating_given') && (
              <Box component="span" sx={{ ml: 1 }}>
                Types trouvés: {[...new Set(normalizedActivities
                  .filter(a => a.type?.includes('rating'))
                  .map(a => a.type))].join(', ')}
              </Box>
            )}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {filter !== 'all' && (
              <Button 
                size="small" 
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => internalHandleFilterChange('all')}
              >
                Show all
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

ActivityFeed.propTypes = {
  activities: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object
  ]),
  loading: PropTypes.bool,
  showAll: PropTypes.bool,
  onMarkAsRead: PropTypes.func,
  unreadCount: PropTypes.number,
  onFilterChange: PropTypes.func,
  handleClickFeedbacksViewOnProfile: PropTypes.func
};

ActivityFeed.defaultProps = {
  activities: [],
  loading: false,
  showAll: false,
  unreadCount: 0
};

export default ActivityFeed;