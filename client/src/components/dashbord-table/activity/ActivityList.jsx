// src/components/activity/ActivityList.jsx
import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Badge,
  Box,
  Link,
  Button,
  alpha
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Feedback as FeedbackIcon,
  MarkEmailRead as MarkReadIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  ThumbUp as ThumbUpIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const ActivityList = ({
  displayActivities,
  isActivityUnread,
  markActivityAsRead,
  handleViewPost,
  handleViewComment,
  handleViewProfile,
  handleViewOwnProfileFeedbacks,
  getActivityIcon,
  getActivityColor,
  getActivityTitle,
  getActivityLabel,
  formatDate,
  formatRelativeDate,
  renderStars,
  renderPostInfo,
  renderCommentInfo
}) => {
  return (
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
              position: 'relative',
              py: 2.5,
              px: 3,
              backgroundColor: isUnread 
                ? 'linear-gradient(to right, rgba(255, 0, 80, 0.02), transparent)' 
                : 'transparent',
              borderBottom: index < displayActivities.length - 1 
                ? '1px solid' 
                : 'none',
              borderBottomColor: 'rgba(180, 20, 20, 0.08)',
              borderLeft: isUnread ? '4px solid' : 'none',
              borderLeftColor: 'rgb(255, 0, 80)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: 'rgba(60, 10, 10, 0.02)',
                transform: 'translateX(4px)',
                '& .MuiListItemSecondaryAction-root': {
                  opacity: 1,
                  transform: 'translateX(0)',
                }
              },
              '& .MuiListItemSecondaryAction-root': {
                right: 24,
                opacity: isUnread ? 1 : 0.6,
                transform: isUnread ? 'translateX(0)' : 'translateX(8px)',
                transition: 'all 0.2s ease',
              }
            }}
            secondaryAction={
              <Stack 
                direction="row" 
                spacing={0.5}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 2,
                  p: 0.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  border: '1px solid rgba(180, 20, 20, 0.08)',
                }}
              >
                {/* Mark as read button for unread activities */}
                {isUnread && (
                  <Tooltip title="Mark as read" arrow placement="top">
                    <IconButton 
                      size="small"
                      onClick={() => markActivityAsRead(activity.id)}
                      sx={{
                        color: 'rgb(255, 0, 80)',
                        '&:hover': {
                          bgcolor: 'rgba(255, 0, 80, 0.08)',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      <MarkReadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {/* View actions based on activity type */}
                {activityType === 'post' && postId && (
                  <Tooltip title="View post" arrow placement="top">
                    <IconButton 
                      size="small"
                      onClick={() => handleViewPost(postId, activity.id, user.id)}
                      sx={{
                        color: 'rgb(60, 10, 10)',
                        '&:hover': {
                          bgcolor: 'rgba(60, 10, 10, 0.08)',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {(activityType === 'comment' || activityType === 'comment_received') && commentId && postId && (
                  <Tooltip title="View comment" arrow placement="top">
                    <IconButton 
                      size="small"
                      onClick={() => handleViewComment(commentId, postId, activity.id, user.id)}
                      sx={{
                        color: 'rgb(180, 20, 20)',
                        '&:hover': {
                          bgcolor: 'rgba(180, 20, 20, 0.08)',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {activityType === 'feedback_received' && (
                  <Tooltip title="View feedback on your profile" arrow placement="top">
                    <IconButton 
                      size="small"
                      onClick={() => handleViewProfile(profile,activity.id)}
                      sx={{
                        color: 'rgb(255, 0, 80)',
                        '&:hover': {
                          bgcolor: 'rgba(255, 0, 80, 0.08)',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      <FeedbackIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {activityType === 'feedback_given' && user.id && (
                  <Tooltip title="View user's profile" arrow placement="top">
                    <IconButton 
                      size="small"
                      onClick={() => handleViewProfile(profile, activity.id)}
                      sx={{
                        color: 'rgb(60, 10, 10)',
                        '&:hover': {
                          bgcolor: 'rgba(60, 10, 10, 0.08)',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      <PersonIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {(activityType === 'rating_received' || activityType === 'rating_given') && postId && (
                  <Tooltip title="View post" arrow placement="top">
                    <IconButton 
                      size="small"
                      onClick={() => handleViewPost(postId, activity.id, user.id)}
                      sx={{
                        color: 'rgb(180, 20, 20)',
                        '&:hover': {
                          bgcolor: 'rgba(180, 20, 20, 0.08)',
                          transform: 'scale(1.1)',
                        }
                      }}
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
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: 'rgb(255, 0, 80)',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    boxShadow: '0 0 0 2px white',
                    animation: isUnread ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)', opacity: 1 },
                      '50%': { transform: 'scale(1.2)', opacity: 0.8 },
                      '100%': { transform: 'scale(1)', opacity: 1 },
                    }
                  }
                }}
              >
                <Avatar 
                  src={user.profile_picture}
                  sx={{ 
                    width: 48,
                    height: 48,
                    bgcolor: `${getActivityColor(activityType)}.main`,
                    color: 'white',
                    boxShadow: isUnread 
                      ? '0 4px 14px rgba(255, 0, 80, 0.25)' 
                      : '0 2px 8px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 6px 20px rgba(255, 0, 80, 0.3)',
                    }
                  }}
                >
                  {getActivityIcon(activityType)}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            
            <ListItemText
              primary={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  mb: 1,
                  maxWidth: 'calc(100% - 100px)'
                }}>
                  <Typography 
                    variant="subtitle1" 
                    component="span" 
                    fontWeight={isUnread ? '700' : '600'}
                    sx={{
                      color: isUnread ? 'rgb(60, 10, 10)' : 'text.primary',
                      fontSize: '0.95rem',
                      letterSpacing: '-0.01em',
                      maxWidth: '70%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {title}
                  </Typography>
                  <Chip
                    label={getActivityLabel(activityType)}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: `linear-gradient(135deg, ${getActivityColor(activityType)}.main, ${getActivityColor(activityType)}.dark)`,
                      color: 'white',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      flexShrink: 0,
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
                      display="block"
                      sx={{ 
                        mb: 1.5,
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        maxWidth: '100%',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Box component="span" sx={{ color: 'text.secondary' }}>By</Box>
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 600,
                          color: 'rgb(60, 10, 10)',
                          background: 'linear-gradient(135deg, rgb(60,10,10), rgb(180,20,20))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {userFullName}
                      </Box>
                      {user.profile_picture && (
                        <Avatar 
                          src={user.profile_picture} 
                          sx={{ 
                            width: 20, 
                            height: 20,
                            border: '1px solid rgba(255,0,80,0.2)'
                          }}
                        />
                      )}
                    </Typography>
                  )}
                  
                  {/* Target user for given activities */}
                  {(activityType === 'feedback_given' || activityType === 'rating_given') && targetUser.username && (
                    <Typography
                      component="span"
                      variant="body2"
                      display="block"
                      sx={{ 
                        mb: 1.5,
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        maxWidth: '100%',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Box component="span" sx={{ color: 'text.secondary' }}>To</Box>
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 600,
                          color: 'rgb(180, 20, 20)',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {targetUser.first_name ? `${targetUser.first_name} ${targetUser.last_name}` : targetUser.username}
                      </Box>
                    </Typography>
                  )}
                  
                  {/* Main description - WITH ELLIPSIS */}
                  {description && (
                    <Typography
                      component="span"
                      variant="body2"
                      display="block"
                      sx={{ 
                        mb: 2,
                        p: 2,
                        backgroundColor: 'rgba(60, 10, 10, 0.02)',
                        borderRadius: 1.5,
                        borderLeft: '4px solid',
                        borderLeftColor: `${getActivityColor(activityType)}.main`,
                        color: 'text.primary',
                        fontSize: '0.85rem',
                        lineHeight: 1.6,
                        fontStyle: 'normal',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        "{description}"
                      </Box>
                      {description.length > 200 && (
                        <Button
                          size="small"
                          sx={{
                            mt: 0.5,
                            fontSize: '0.7rem',
                            color: 'rgb(255, 0, 80)',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                              backgroundColor: 'transparent',
                              textDecoration: 'underline',
                            }
                          }}
                          onClick={() => {/* Handle expand */}}
                        >
                          Read more
                        </Button>
                      )}
                    </Typography>
                  )}
                  
                  {/* Specific data */}
                  
                  {/* For posts */}
                  {activityType === 'post' && renderPostInfo && (
                    <Box sx={{ 
                      maxWidth: '100%',
                      '& *': {
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }
                    }}>
                      {renderPostInfo(postData)}
                    </Box>
                  )}
                  
                  {/* For comments */}
                  {(activityType === 'comment' || activityType === 'comment_received') && renderCommentInfo && (
                    <Box sx={{ 
                      maxWidth: '100%',
                      '& *': {
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }
                    }}>
                      {renderCommentInfo(commentData)}
                    </Box>
                  )}
                  
                  {/* For feedbacks */}
                  {(activityType === 'feedback_received' || activityType === 'feedback_given') && metadata.rating && (
                    <Box sx={{ 
                      mb: 2,
                      maxWidth: '100%',
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        mb: 1,
                        flexWrap: 'wrap',
                      }}>
                        {renderStars(metadata.rating)}
                        {feedbackData.helpful_count > 0 && (
                          <Chip
                            icon={<ThumbUpIcon sx={{ fontSize: 12 }} />}
                            label={`${feedbackData.helpful_count} helpful`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.6rem',
                              bgcolor: 'rgba(79, 70, 229, 0.08)',
                              color: '#4F46E5',
                            }}
                          />
                        )}
                      </Box>
                      
                      {/* Message spécial pour feedbacks reçus */}
                      {activityType === 'feedback_received' && (
                        <Box 
                          sx={{ 
                            mt: 1.5, 
                            p: 1.5, 
                            bgcolor: 'rgba(16, 185, 129, 0.04)',
                            borderRadius: 1.5,
                            border: '1px solid rgba(16, 185, 129, 0.1)',
                            maxWidth: '100%',
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#10B981', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: '#10B981',
                                display: 'inline-block',
                              }}
                            />
                            <Link 
                              component="button" 
                              variant="caption"
                              onClick={() => handleViewProfile(profile,activity.id)}
                              sx={{
                                color: '#10B981',
                                fontWeight: 600,
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '250px',
                                '&:hover': {
                                  textDecoration: 'underline',
                                }
                              }}
                            >
                              View all feedback on your profile
                            </Link>
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  {/* For ratings */}
                  {(activityType === 'rating_received' || activityType === 'rating_given') && metadata.stars && (
                    <Box sx={{ 
                      mb: 2,
                      maxWidth: '100%',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {renderStars(metadata.stars)}
                      </Box>
                      {ratingData.comment && (
                        <Typography 
                          variant="caption" 
                          display="block"
                          sx={{
                            mt: 0.5,
                            p: 1.5,
                            bgcolor: 'rgba(0,0,0,0.02)',
                            borderRadius: 1,
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            maxWidth: '100%',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                          }}
                        >
                          Note: {ratingData.comment}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {/* Post information (for comments and ratings) - WITH ELLIPSIS */}
                  {(activityType === 'comment' || activityType === 'comment_received' || 
                    activityType === 'rating_received' || activityType === 'rating_given') && postTitle && (
                    <Typography
                      component="span"
                      variant="body2"
                      display="block"
                      sx={{ 
                        mb: 1.5,
                        p: 1.5,
                        bgcolor: 'rgba(60, 10, 10, 0.02)',
                        borderRadius: 1.5,
                        color: 'text.secondary',
                        border: '1px solid rgba(180, 20, 20, 0.08)',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Box component="span" sx={{ fontWeight: 500, color: 'rgb(60, 10, 10)' }}>On post:</Box>{' '}
                      <Box 
                        component="span" 
                        sx={{ 
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 'calc(100% - 80px)',
                          display: 'inline-block',
                          verticalAlign: 'bottom',
                        }}
                      >
                        "{postTitle}"
                      </Box>
                    </Typography>
                  )}
                  
                  {/* Date and time information */}
                  <Stack 
                    direction="row" 
                    spacing={2} 
                    alignItems="center" 
                    flexWrap="wrap"
                    sx={{
                      mt: 1,
                      pt: 1,
                      borderTop: '1px solid rgba(180, 20, 20, 0.06)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon sx={{ fontSize: 14, color: 'rgb(180, 20, 20)' }} />
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ color: 'text.secondary', fontWeight: 500 }}
                      >
                        {formatDate(timestamp)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 14, color: 'rgb(180, 20, 20)' }} />
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ color: 'text.secondary', fontWeight: 500 }}
                      >
                        {formatRelativeDate(timestamp)}
                      </Typography>
                    </Box>
                    
                    {isUnread && (
                      <Chip
                        label="NEW"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          bgcolor: 'rgb(255, 0, 80)',
                          color: 'white',
                          boxShadow: '0 2px 6px rgba(255, 0, 80, 0.3)',
                          '& .MuiChip-label': {
                            px: 1,
                          }
                        }}
                      />
                    )}
                  </Stack>
                </React.Fragment>
              }
              primaryTypographyProps={{
                variant: 'subtitle1',
              }}
              secondaryTypographyProps={{
                component: 'div',
                variant: 'body2',
                sx: {
                  maxWidth: '100%',
                  '& .MuiTypography-root': {
                    maxWidth: '100%',
                  }
                }
              }}
              sx={{
                maxWidth: 'calc(100% - 80px)',
                '& .MuiListItemText-primary': {
                  maxWidth: '100%',
                },
                '& .MuiListItemText-secondary': {
                  maxWidth: '100%',
                }
              }}
            />
          </ListItem>
        );
      })}
    </List>
  );
};

ActivityList.propTypes = {
  displayActivities: PropTypes.array.isRequired,
  isActivityUnread: PropTypes.func.isRequired,
  markActivityAsRead: PropTypes.func.isRequired,
  handleViewPost: PropTypes.func.isRequired,
  handleViewComment: PropTypes.func.isRequired,
  handleViewProfile: PropTypes.func.isRequired,
  handleViewOwnProfileFeedbacks: PropTypes.func.isRequired,
  getActivityIcon: PropTypes.func.isRequired,
  getActivityColor: PropTypes.func.isRequired,
  getActivityTitle: PropTypes.func.isRequired,
  getActivityLabel: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  formatRelativeDate: PropTypes.func.isRequired,
  renderStars: PropTypes.func.isRequired,
  renderPostInfo: PropTypes.func.isRequired,
  renderCommentInfo: PropTypes.func.isRequired
};

export default ActivityList;