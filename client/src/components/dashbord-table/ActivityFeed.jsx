// src/components/ActivityFeed.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  LinearProgress,
  Stack,
  IconButton,
  Tooltip,
  Rating,
  Badge,
  Button,
  Divider,
  Link
} from '@mui/material';
import {
  Create as CreateIcon,
  Comment as CommentIcon,
  Star as StarIcon,
  Person as PersonIcon,
  OpenInNew as OpenInNewIcon,
  Visibility as VisibilityIcon,
  Category as CategoryIcon,
  Tag as TagIcon,
  ThumbUp as ThumbUpIcon,
  Chat as ChatIcon,
  Feedback as FeedbackIcon,
  RateReview as RateReviewIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  FilterList as FilterIcon,
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkReadIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import PropTypes from 'prop-types';

const getActivityIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'post':
      return <CreateIcon />;
    case 'comment':
      return <CommentIcon />;
    case 'comment_received':
      return <ChatIcon />;
    case 'rating_received':
    case 'rating_given':
      return <StarIcon />;
    case 'feedback_received':
    case 'feedback_given':
      return <FeedbackIcon />;
    default:
      return <CreateIcon />;
  }
};

const getActivityColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'post':
      return 'primary';
    case 'comment':
      return 'secondary';
    case 'comment_received':
      return 'info';
    case 'rating_received':
    case 'rating_given':
      return 'warning';
    case 'feedback_received':
    case 'feedback_given':
      return 'success';
    default:
      return 'default';
  }
};

const getActivityTitle = (type, metadata = {}) => {
  switch (type?.toLowerCase()) {
    case 'post':
      return 'New post created';
    case 'comment':
      return 'You commented';
    case 'comment_received':
      return 'New comment on your post';
    case 'rating_received':
      return 'New rating on your post';
    case 'rating_given':
      return 'You rated a post';
    case 'feedback_received':
      return 'New feedback on your profile';
    case 'feedback_given':
      return 'You gave feedback';
    default:
      return 'New activity';
  }
};

const getActivityLabel = (type) => {
  switch (type?.toLowerCase()) {
    case 'post':
      return 'POST';
    case 'comment':
      return 'COMMENT';
    case 'comment_received':
      return 'COMMENT RECEIVED';
    case 'rating_received':
      return 'RATING RECEIVED';
    case 'rating_given':
      return 'RATING GIVEN';
    case 'feedback_received':
      return 'FEEDBACK RECEIVED';
    case 'feedback_given':
      return 'FEEDBACK GIVEN';
    default:
      return 'ACTIVITY';
  }
};

const ActivityFeed = ({ 
  activities, 
  loading, 
  showAll = false,
  onMarkAsRead,
  unreadCount,
  onFilterChange ,
  handleClickFeedbacksViewOnProfile
},ref) => {
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

  // Activity types available for filtering - CORRIGÉ
  const activityTypes = [
    { key: 'all', label: 'All Activities', icon: <FilterIcon /> },
    { key: 'post', label: 'Your Posts', icon: <CreateIcon /> },
    { key: 'comment', label: 'Your Comments', icon: <CommentIcon /> },
    { key: 'comment_received', label: 'Comments Received', icon: <ChatIcon /> },
    { key: 'rating_received', label: 'Ratings Received', icon: <StarIcon /> }, // CORRIGÉ: 'rating_received'
    { key: 'rating_given', label: 'Ratings Given', icon: <RateReviewIcon /> },
    { key: 'feedback_received', label: 'Feedback Received', icon: <FeedbackIcon /> },
    { key: 'feedback_given', label: 'Feedback Given', icon: <FeedbackIcon /> },
  ];

  // Mark an activity as read
  const markActivityAsRead = (activityId) => {
    const newViewed = new Set(viewedActivities);
    newViewed.add(activityId);
    setViewedActivities(newViewed);
    
    if (onMarkAsRead) {
      onMarkAsRead(activityId);
    }
  };

  // Check if activity is unread
  const isActivityUnread = (activityId) => {
    return !viewedActivities.has(activityId);
  };

  // Mark all as read
  const markAllAsRead = () => {
    const normalizedActivities = Array.isArray(activities) 
      ? activities 
      : (activities?.activities || activities?.results || []);
    
    const allIds = normalizedActivities.map(activity => activity.id);
    const newViewed = new Set([...viewedActivities, ...allIds]);
    setViewedActivities(newViewed);
    
    if (onMarkAsRead) {
      allIds.forEach(id => onMarkAsRead(id));
    }
  };

  // Handle viewing feedbacks - NOUVELLE FONCTION
  const handleViewFeedbacks = (userId, activityId) => {
    markActivityAsRead(activityId);
    // Rediriger vers la page des feedbacks du profil
    window.open(`/profile/${userId}#feedbacks`, '_blank');
  };

  // Handle viewing own profile for feedback received
  const handleViewOwnProfileFeedbacks = (activityId) => {
    markActivityAsRead(activityId);
    // Rediriger vers son propre profil section feedbacks
    window.open('/profile#feedbacks', '_blank');
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
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No recent activity
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Start posting or commenting to see your activities here!
        </Typography>
      </Box>
    );
  }

  // Filter activities by type - CORRIGÉ POUR LES RATINGS
  const filteredActivities = filter === 'all' 
    ? normalizedActivities 
    : normalizedActivities.filter(activity => {
        // Gestion spéciale pour les ratings
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

  // Handle viewing actions
  const handleViewPost = (postId, activityId,userId) => {
    markActivityAsRead(activityId);
    window.location.href = `/user/${userId}/posts/${postId}`;
  };

  const handleViewComment = (commentId, postId, activityId,userId) => {
    markActivityAsRead(activityId);
    window.location.href = `/user/${userId}/posts/${postId}`;
  };

  const handleViewProfile = (profileId, activityId) => {
    markActivityAsRead(activityId);
    window.location.href = `/profile/${profileId}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = parseISO(dateString);
      return format(date, "MM/dd/yyyy 'at' HH:mm", { locale: enUS });
    } catch (error) {
      return dateString;
    }
  };

  // Format relative date
  const formatRelativeDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: enUS });
    } catch (error) {
      return 'Recently';
    }
  };

  // Render stars for ratings
  const renderStars = (stars) => {
    if (!stars) return null;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Rating value={stars} max={5} readOnly size="small" />
        <Typography variant="caption" color="text.secondary">
          ({stars}/5)
        </Typography>
      </Box>
    );
  };

  // Render post information
  const renderPostInfo = (postData) => {
    if (!postData) return null;
    
    return (
      <Box sx={{ mb: 1 }}>
        {/* Category */}
        {postData.category && (
          <Chip
            icon={<CategoryIcon />}
            label={postData.category.name || 'Category'}
            size="small"
            variant="outlined"
            sx={{ mr: 1, mb: 0.5 }}
          />
        )}
        
        {/* Tags */}
        {postData.tags && postData.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {postData.tags.slice(0, 2).map((tag, index) => (
              <Chip
                key={index}
                icon={<TagIcon />}
                label={tag.name}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        )}
        
        {/* Average rating */}
        {postData.average_rating > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <StarIcon fontSize="small" color="warning" />
            <Typography variant="caption" color="text.secondary">
              Avg rating: {postData.average_rating.toFixed(1)}/5 ({postData.total_ratings || 0} ratings)
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Render comment information
  const renderCommentInfo = (commentData) => {
    if (!commentData) return null;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        {commentData.likes_count > 0 && (
          <Typography variant="caption" color="text.secondary">
            <ThumbUpIcon fontSize="inherit" /> {commentData.likes_count}
          </Typography>
        )}
        {commentData.reply_count > 0 && (
          <Typography variant="caption" color="text.secondary">
            <CommentIcon fontSize="inherit" /> {commentData.reply_count}
          </Typography>
        )}
        {commentData.is_edited && (
          <Typography variant="caption" color="text.secondary">
            (edited)
          </Typography>
        )}
      </Box>
    );
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (onFilterChange) {
      onFilterChange(newFilter);
    }
  };

  // Message quand aucun résultat pour le filtre
  if (showAll && filteredActivities.length === 0 && filter !== 'all') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          No {getActivityLabel(filter).toLowerCase()} found
        </Typography>
        
        {filter === 'feedback_received' && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" color="text.primary" gutterBottom>
               Want to see feedback on your profile?
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Feedback received will appear on your feedback's section  in your profile.
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<ViewIcon />}
              onClick={handleClickFeedbacksViewOnProfile}
              sx={{ mt: 1 }}
            >
              View all feedback on your profile
            </Button>
          </Box>
        )}
        
        <Button 
          variant="text" 
          size="small" 
          startIcon={<FilterIcon />}
          onClick={() => handleFilterChange('all')}
          sx={{ mt: 2 }}
        >
          Show all activities
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with unread count and mark all as read */}
      {showAll && (
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h6" fontWeight="600" gutterBottom ref={ref}>
              Activity Feed
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {unreadActivitiesCount > 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge badgeContent={unreadActivitiesCount} color="error">
                    <NotificationsIcon color="action" />
                  </Badge>
                  <span>{unreadActivitiesCount} unread activity{unreadActivitiesCount !== 1 ? 'ies' : ''}</span>
                </Box>
              ) : (
                'All activities read'
              )}
            </Typography>
          </Box>
          
          {unreadActivitiesCount > 0 && (
            <Button
              size="small"
              startIcon={<MarkReadIcon />}
              onClick={markAllAsRead}
              variant="outlined"
            >
              Mark all as read
            </Button>
          )}
        </Box>
      )}

      {/* Activity filters */}
      {showAll && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Filter by type:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {activityTypes.map((type) => (
              <Chip
                key={type.key}
                icon={type.icon}
                label={type.label}
                onClick={() => handleFilterChange(type.key)}
                color={filter === type.key ? 'primary' : 'default'}
                variant={filter === type.key ? 'filled' : 'outlined'}
                size="small"
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
          <Divider sx={{ mt: 1 }} />
        </Box>
      )}

      {/* Activities list */}
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {displayActivities.map((activity, index) => {
          const activityType = activity.type || 'activity';
          const title = activity.title || getActivityTitle(activityType, activity.metadata);
          const description = activity.description || '';
          const timestamp = activity.timestamp || activity.created_at;
          const user = activity.user || {};
          const targetUser = activity.target_user || {};
          
          const username = user.username || 'Anonymous';
          const userFullName = user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : username;
          
          const metadata = activity.metadata || {};
          
          const postId = metadata.post_id || activity.post_data?.id;
          const commentId = metadata.comment_id || activity.comment_data?.id;
          const postTitle = metadata.post_title || activity.post_data?.title || 'a post';
          
          const postData = activity.post_data || {};
          const commentData = activity.comment_data || {};
          const feedbackData = activity.feedback_data || {};
          const profile = feedbackData.profile_id || {};
          const ratingData = activity.rating_data || {};

          const isUnread = isActivityUnread(activity.id);

          return (
            <ListItem
            id={`activity-${activity.id}`}
              key={activity.id || `activity-${index}`}
              alignItems="flex-start"
              sx={{
                borderBottom: index < displayActivities.length - 1 ? '1px solid #f0f0f0' : 'none',
                py: 2,
                backgroundColor: isUnread ? 'action.hover' : 'transparent',
                borderLeft: isUnread ? '4px solid' : 'none',
                borderLeftColor: `${getActivityColor(activityType)}.main`,
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  {/* Mark as read button for unread activities */}
                  {isUnread && (
                    <Tooltip title="Mark as read">
                      <IconButton 
                        size="small"
                        onClick={() => markActivityAsRead(activity.id)}
                      >
                        <MarkReadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {/* View actions based on activity type */}
                  {activityType === 'post' && postId && (
                    <Tooltip title="View post">
                      <IconButton 
                        size="small"
                        onClick={() => handleViewPost(postId, activity.id, user.id)}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {(activityType === 'comment' || activityType === 'comment_received') && commentId && postId && (
                    <Tooltip title="View comment">
                      <IconButton 
                        size="small"
                        onClick={() => handleViewComment(commentId, postId, activity.id,user.id)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {activityType === 'feedback_received' && (
                    <Tooltip title="View feedback on your profile">
                      <IconButton 
                        size="small"
                        onClick={() => handleViewOwnProfileFeedbacks(activity.id)}
                      >
                        <FeedbackIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {activityType === 'feedback_given' && user.id && (
                    <Tooltip title="View user's profile">
                      <IconButton 
                        size="small"
                        onClick={() => handleViewProfile(profile, activity.id)}
                      >
                        <PersonIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {(activityType === 'rating_received' || activityType === 'rating_given') && postId && (
                    <Tooltip title="View post">
                      <IconButton 
                        size="small"
                        onClick={() => handleViewPost(postId, activity.id,user.id)}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              }
            >
              <ListItemAvatar>
                <Badge
                  color="error"
                  variant="dot"
                  invisible={!isUnread}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  <Avatar 
                    src={user.profile_picture}
                    sx={{ 
                      bgcolor: `${getActivityColor(activityType)}.light`,
                      color: `${getActivityColor(activityType)}.contrastText`
                    }}
                  >
                    {getActivityIcon(activityType)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography 
                      variant="subtitle1" 
                      component="span" 
                      fontWeight={isUnread ? '700' : '600'}
                      color={isUnread ? 'text.primary' : 'text.primary'}
                    >
                      {title}
                    </Typography>
                    <Chip
                      label={getActivityLabel(activityType)}
                      size="small"
                      color={getActivityColor(activityType)}
                      sx={{ 
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                }
                secondary={
                  <React.Fragment>
                    {/* User for received activities */}
                    {(activityType === 'comment_received' || activityType === 'feedback_received' || activityType === 'rating_received') && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        display="block"
                        sx={{ mb: 1 }}
                      >
                        By <strong>{userFullName}</strong>
                        {user.profile_picture && (
                          <Avatar 
                            src={user.profile_picture} 
                            sx={{ width: 20, height: 20, ml: 1, display: 'inline-block', verticalAlign: 'middle' }}
                          />
                        )}
                      </Typography>
                    )}
                    
                    {/* Target user for given activities */}
                    {(activityType === 'feedback_given' || activityType === 'rating_given') && targetUser.username && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        display="block"
                        sx={{ mb: 1 }}
                      >
                        To <strong>{targetUser.first_name ? `${targetUser.first_name} ${targetUser.last_name}` : targetUser.username}</strong>
                      </Typography>
                    )}
                    
                    {/* Main description */}
                    {description && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        display="block"
                        sx={{ 
                          mb: 1.5,
                          fontStyle: 'italic',
                          backgroundColor: '#f8f9fa',
                          p: 1.5,
                          borderRadius: 1,
                          borderLeft: `3px solid ${getActivityColor(activityType)}.main`
                        }}
                      >
                        "{description.length > 200 
                          ? `${description.substring(0, 200)}...` 
                          : description}"
                      </Typography>
                    )}
                    
                    {/* Specific data */}
                    
                    {/* For posts */}
                    {activityType === 'post' && renderPostInfo(postData)}
                    
                    {/* For comments */}
                    {(activityType === 'comment' || activityType === 'comment_received') && renderCommentInfo(commentData)}
                    
                    {/* For feedbacks */}
                    {(activityType === 'feedback_received' || activityType === 'feedback_given') && metadata.rating && (
                      <Box sx={{ mb: 1 }}>
                        {renderStars(metadata.rating)}
                        
                        {/* Message spécial pour feedbacks reçus */}
                        {activityType === 'feedback_received' && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              <Link 
                                component="button" 
                                variant="caption"
                                onClick={() => handleViewOwnProfileFeedbacks(activity.id)}
                                sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                              >
                                 View all feedback on your profile
                              </Link>
                            </Typography>
                          </Box>
                        )}
                        
                        {feedbackData.helpful_count > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                            <ThumbUpIcon fontSize="small" /> {feedbackData.helpful_count} helpful
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    {/* For ratings - CORRIGÉ POUR LES TYPES */}
                    {(activityType === 'rating_received' || activityType === 'rating_given') && metadata.stars && (
                      <Box sx={{ mb: 1 }}>
                        {renderStars(metadata.stars)}
                        {ratingData.comment && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Note: {ratingData.comment}
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    {/* Post information (for comments and ratings) */}
                    {(activityType === 'comment' || activityType === 'comment_received' || 
                      activityType === 'rating_received' || activityType === 'rating_given') && postTitle && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 1 }}
                      >
                        On post: <strong>"{postTitle}"</strong>
                      </Typography>
                    )}
                    
                    {/* Date and time information */}
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          {formatDate(timestamp)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          {formatRelativeDate(timestamp)}
                        </Typography>
                      </Box>
                      
                      {isUnread && (
                        <Chip
                          label="NEW"
                          size="small"
                          color="error"
                          sx={{ height: 18, fontSize: '0.6rem' }}
                        />
                      )}
                    </Stack>
                  </React.Fragment>
                }
              />
            </ListItem>
          );
        })}
      </List>

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
                onClick={() => handleFilterChange('all')}
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

// Prop Types
ActivityFeed.propTypes = {
  activities: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object
  ]),
  loading: PropTypes.bool,
  showAll: PropTypes.bool,
  onMarkAsRead: PropTypes.func,
  unreadCount: PropTypes.number,
  onFilterChange: PropTypes.func
};

ActivityFeed.defaultProps = {
  activities: [],
  loading: false,
  showAll: false,
  unreadCount: 0
};

export default ActivityFeed;