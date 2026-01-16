// components/search/GroupCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Group as GroupIcon,
  People as PeopleIcon,
  Star as StarIcon,
  RateReview as ReviewIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Visibility as VisibilityIcon,
  GroupAdd as GroupAddIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  AccessTime as AccessTimeIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Chip,
  Button,
  Card,
  CardMedia,
  Fade,
  Tooltip,
  alpha,
  CardContent,
  Avatar,
  AvatarGroup,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { FiMoreVertical } from 'react-icons/fi';

export const GroupCard = ({ 
  group, 
  onClick, 
  onJoinRequest, 
  isHovered, 
  onMouseEnter, 
  onMouseLeave,
  compact = true,
  showDescription = true,
  showStats = true,
  showActions = true,
  className = '',
  isSearchResult = true
}) => {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  if (!group) return null;

  // Sécuriser les données du groupe
  const safeGroup = {
    id: group.id || 0,
    name: group.name || 'Unnamed Group',
    description: group.description || '',
    group_type: group.group_type || 'group_public',
    group_photo_url: group.group_photo_url || group.group_photo || group.image_url || '/default-group.jpg',
    category: group.category || { name: 'General' },
    location: group.location || '',
    tags: Array.isArray(group.tags) ? group.tags : [],
    group_members: Array.isArray(group.group_members) ? group.group_members : [],
    recent_members: Array.isArray(group.recent_members) ? group.recent_members : [],
    members_count: group.members_count || group.group_members?.length || 0,
    average_rating: group.average_rating || 0,
    total_reviews: group.total_reviews || 0,
    is_member: !!group.is_member,
    has_pending_request: !!group.has_pending_request,
    is_blocked: !!group.is_blocked,
    is_active: group.is_active !== false,
    is_visible: group.is_visible !== false,
    is_full: !!group.is_full,
    can_join: group.can_join !== false,
    requires_approval: group.requires_approval !== false,
    created_at: group.created_at || '',
    updated_at: group.updated_at || '',
    ...group
  };

  const averageRating = safeGroup.average_rating;
  const totalReviews = safeGroup.total_reviews;
  const membersCount = safeGroup.members_count;
  const isMember = safeGroup.is_member;
  const hasPendingRequest = safeGroup.has_pending_request;
  const canJoin = safeGroup.can_join && !isMember && !hasPendingRequest && !safeGroup.is_full;
  const requiresApproval = safeGroup.requires_approval;

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  const handleSaveGroup = (event) => {
    event.stopPropagation();
    console.log('Save group:', safeGroup.id);
    handleMenuClose();
  };

  const handleShareGroup = (event) => {
    event.stopPropagation();
    console.log('Share group:', safeGroup.id);
    handleMenuClose();
  };

  const handleReportGroup = (event) => {
    event.stopPropagation();
    console.log('Report group:', safeGroup.id);
    handleMenuClose();
  };

  const handleClick = (event) => {
    event.stopPropagation();
    if (onClick) {
      onClick(safeGroup);
    } else {
      navigate(`/groups/${safeGroup.id}`);
    }
  };

  const handleJoinRequest = (event) => {
    event.stopPropagation();
    if (onJoinRequest) {
      onJoinRequest(safeGroup.id);
    } else {
      console.log('Join request for group:', safeGroup.id);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Version compacte pour les résultats de recherche
  if (compact && isSearchResult) {
    return (
      <Card 
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        sx={{ 
          position: 'relative',
          height: 300,
          borderRadius: 2,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: isHovered ? 4 : 1,
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          '&:hover': {
            '& .group-image': {
              transform: 'scale(1.03)',
            },
          },
        }}
        onClick={handleClick}
      >
        {/* Background Image */}
        <CardMedia
          className="group-image"
          component="img"
          image={safeGroup.group_photo_url}
          alt={safeGroup.name}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
        />

        {/* Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(to bottom, ${alpha('#000', 0.1)} 0%, ${alpha('#000', 0.4)} 50%, ${alpha('#000', 0.8)} 100%)`,
            transition: 'all 0.3s ease',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Header with type badge */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Chip
              label={safeGroup.group_type === 'group_public' ? 'Public' : 'Private'}
              size="small"
              color={safeGroup.group_type === 'group_public' ? 'primary' : 'secondary'}
              icon={safeGroup.group_type === 'group_public' ? <PublicIcon /> : <LockIcon />}
              sx={{
                fontWeight: 'bold',
                backdropFilter: 'blur(4px)',
                backgroundColor: alpha('#fff', 0.9),
              }}
            />
            
         {/*
            //Options menu 
            <IconButton
              size="small"
              sx={{ 
                backgroundColor: alpha('#fff', 0.9),
                '&:hover': { backgroundColor: 'white' }
              }}
              onClick={handleMenuClick}
            >
              <FiMoreVertical />
            </IconButton>
         */}
          </Box>

          {/* Group name and info */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 700,
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                fontSize: '1.1rem',
                lineHeight: 1.2,
              }}
            >
              {safeGroup.name}
            </Typography>

            {/* Quick stats */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
              <Tooltip title={`${membersCount} members`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PeopleIcon sx={{ color: alpha('#fff', 0.9), fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 500 }}>
                    {membersCount}
                  </Typography>
                </Box>
              </Tooltip>

              <Tooltip title={`${averageRating.toFixed(1)} rating`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StarIcon sx={{ color: '#ffd700', fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 500 }}>
                    {averageRating.toFixed(1)}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>

            {/* Category and tags */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {safeGroup.category && safeGroup.category.name && (
                <Chip
                  icon={<CategoryIcon sx={{ fontSize: 12 }} />}
                  label={safeGroup.category.name}
                  size="small"
                  sx={{
                    backgroundColor: alpha('#fff', 0.2),
                    color: 'white',
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
              )}
              
              {safeGroup.tags.slice(0, 1).map((tag, index) => (
                <Chip
                  key={index}
                  icon={<TagIcon sx={{ fontSize: 12 }} />}
                  label={tag}
                  size="small"
                  sx={{
                    backgroundColor: alpha('#fff', 0.15),
                    color: 'white',
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
              ))}
            </Box>

            {/* Join button */}
            <Fade in={isHovered}>
              <Button
                variant="contained"
                size="small"
                startIcon={isMember ? <CheckCircleIcon /> : <GroupAddIcon />}
                onClick={handleJoinRequest}
                sx={{
                  mt: 1,
                  backgroundColor: alpha('#1976d2', 0.9),
                  color: 'white',
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: '#1976d2',
                  },
                }}
              >
                {isMember ? 'Member' : 'Join'}
              </Button>
            </Fade>
          </Box>
        </Box>

        {/* Options menu */}
  {/*
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={handleSaveGroup}>Save Group</MenuItem>
          <MenuItem onClick={handleShareGroup}>Share</MenuItem>
          <MenuItem onClick={handleReportGroup}>Report</MenuItem>
        </Menu>
  */}
      </Card>
    );
  }

  // Version complète (non compacte)
  return (
    <Card 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      sx={{ 
        position: 'relative',
        height: 400,
        borderRadius: 3,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isHovered ? 8 : 3,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        '&:hover': {
          '& .group-image': {
            transform: 'scale(1.05)',
          },
          '& .group-info-overlay': {
            backgroundColor: alpha('#000', 0.8),
            backdropFilter: 'blur(4px)',
          },
          '& .hover-actions': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
      onClick={handleClick}
    >
      {/* Background Image */}
      <CardMedia
        className="group-image"
        component="img"
        image={safeGroup.group_photo_url}
        alt={safeGroup.name}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'transform 0.6s ease',
        }}
      />

      {/* Gradient Overlay */}
      <Box
        className="group-info-overlay"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `linear-gradient(to bottom, ${alpha('#000', 0.2)} 0%, ${alpha('#000', 0.6)} 70%, ${alpha('#000', 0.9)} 100%)`,
          transition: 'all 0.4s ease',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        {/* Group Type Badge */}
        <Chip
          label={safeGroup.group_type === 'group_public' ? 'Public' : 'Private'}
          size="small"
          color={safeGroup.group_type === 'group_public' ? 'primary' : 'secondary'}
          icon={safeGroup.group_type === 'group_public' ? <PublicIcon /> : <LockIcon />}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            fontWeight: 'bold',
            backdropFilter: 'blur(4px)',
            backgroundColor: alpha('#fff', 0.9),
            border: '1px solid',
            borderColor: alpha('#fff', 0.3),
          }}
        />

        {/* Group Name */}
        <Typography
          variant="h5"
          sx={{
            color: 'white',
            fontWeight: 700,
            mb: 2,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            fontSize: { xs: '1.3rem', sm: '1.5rem' },
            lineHeight: 1.2,
          }}
        >
          {safeGroup.name}
        </Typography>

        {/* Description (si showDescription est true) */}
        {showDescription && safeGroup.description && (
          <Typography
            variant="body2"
            sx={{
              color: alpha('#fff', 0.9),
              mb: 2,
              fontSize: '0.9rem',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {safeGroup.description}
          </Typography>
        )}

        {/* Stats Row */}
        {showStats && (
          <Box sx={{
            display: 'flex',
            gap: 3,
            mb: 3,
            alignItems: 'center',
          }}>
            {/* Members */}
            <Tooltip title={`${membersCount} members`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ color: alpha('#fff', 0.9), fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  {membersCount}
                </Typography>
              </Box>
            </Tooltip>

            {/* Rating */}
            <Tooltip title={`${averageRating.toFixed(1)} average rating`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon sx={{ color: '#ffd700', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  {averageRating.toFixed(1)}
                </Typography>
              </Box>
            </Tooltip>

            {/* Reviews */}
            <Tooltip title={`${totalReviews} reviews`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReviewIcon sx={{ color: alpha('#fff', 0.9), fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  {totalReviews}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        )}

        {/* Category and Location */}
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          mb: 3,
        }}>
          {safeGroup.category && safeGroup.category.name && (
            <Chip
              icon={<CategoryIcon sx={{ fontSize: 16 }} />}
              label={safeGroup.category.name}
              size="small"
              sx={{
                backgroundColor: alpha('#fff', 0.15),
                color: 'white',
                backdropFilter: 'blur(4px)',
                border: '1px solid',
                borderColor: alpha('#fff', 0.3),
                fontSize: '0.75rem',
              }}
            />
          )}
          
          {safeGroup.location && (
            <Chip
              icon={<LocationIcon sx={{ fontSize: 16 }} />}
              label={safeGroup.location}
              size="small"
              sx={{
                backgroundColor: alpha('#fff', 0.15),
                color: 'white',
                backdropFilter: 'blur(4px)',
                border: '1px solid',
                borderColor: alpha('#fff', 0.3),
                fontSize: '0.75rem',
              }}
            />
          )}
        </Box>

        {/* Tags - Appear on Hover */}
        <Fade in={isHovered}>
          <Box sx={{
            mb: 3,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
          }}>
            {safeGroup.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{
                  backgroundColor: alpha('#fff', 0.2),
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 22,
                }}
              />
            ))}
            {safeGroup.tags.length > 3 && (
              <Chip
                label={`+${safeGroup.tags.length - 3}`}
                size="small"
                sx={{
                  backgroundColor: alpha('#fff', 0.2),
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 22,
                }}
              />
            )}
          </Box>
        </Fade>

        {/* Created date */}
        {safeGroup.created_at && (
          <Tooltip title={`Created on ${formatDate(safeGroup.created_at)}`}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              mb: 2,
              color: alpha('#fff', 0.7),
              fontSize: '0.75rem'
            }}>
              <AccessTimeIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption">
                Created {formatDate(safeGroup.created_at)}
              </Typography>
            </Box>
          </Tooltip>
        )}

        {/* Hover Actions - Appear on Hover */}
        {showActions && (
          <Box
            className="hover-actions"
            sx={{
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.3s ease',
              display: 'flex',
              gap: 2,
            }}
          >
            {/* View Details Button */}
            <Button
              variant="contained"
              startIcon={<VisibilityIcon />}
              onClick={(e) => {
                e.stopPropagation();
                handleClick(e);
              }}
              sx={{
                flex: 1,
                backgroundColor: alpha('#fff', 0.9),
                color: 'text.primary',
                '&:hover': {
                  backgroundColor: 'white',
                },
              }}
            >
              View Details
            </Button>

            {/* Join/Status Button */}
            {isMember ? (
              <Button
                variant="contained"
                startIcon={<CheckCircleIcon />}
                sx={{
                  backgroundColor: alpha('#4caf50', 0.9),
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#4caf50',
                  },
                }}
                onClick={(e) => e.stopPropagation()}
              >
                Member
              </Button>
            ) : hasPendingRequest ? (
              <Button
                variant="contained"
                startIcon={<PendingIcon />}
                sx={{
                  backgroundColor: alpha('#ff9800', 0.9),
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#ff9800',
                  },
                }}
                onClick={(e) => e.stopPropagation()}
              >
                Pending
              </Button>
            ) : safeGroup.is_full ? (
              <Button
                variant="contained"
                color="error"
                disabled
                sx={{
                  backgroundColor: alpha('#f44336', 0.9)
                }}
                onClick={(e) => e.stopPropagation()}
              >
                Full
              </Button>
            ) : canJoin ? (
              <Button
                variant="contained"
                startIcon={<GroupAddIcon />}
                onClick={handleJoinRequest}
                sx={{
                  backgroundColor: alpha('#1976d2', 0.9),
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#1976d2',
                  },
                }}
              >
                {requiresApproval ? 'Request Join' : 'Join Now'}
              </Button>
            ) : null}
          </Box>
        )}
      </Box>
    </Card>
  );
};