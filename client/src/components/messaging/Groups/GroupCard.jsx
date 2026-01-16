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
} from '@mui/material';
export const GroupCard = ({ group, onClick, onJoinRequest, isHovered, onMouseEnter, onMouseLeave }) => {
  if (!group) return null;

  const averageRating = group.average_rating || 0;
  const totalReviews = group.total_reviews || 0;
  const membersCount = group.group_members.length || 0;
  const isMember = group.is_member || false;
  const hasPendingRequest = group.has_pending_request || false;
  const canJoin = group.can_join && !isMember && !hasPendingRequest && !group.is_full;
  const requiresApproval = group.requires_approval !== false;

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
  
    >
      {/* Background Image */}
      <CardMedia
        className="group-image"
        component="img"
        image={group.group_photo_url || '/default-group.jpg'}
        alt={group.name}
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
          label={group.group_type === 'group_public' ? 'Public' : 'Private'}
          size="small"
          color={group.group_type === 'group_public' ? 'primary' : 'secondary'}
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

        {/* Group Name - Always Visible */}
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
          {group.name || 'Unnamed Group'}
        </Typography>

        {/* Stats Row - Always Visible */}
        <Box sx={{
          display: 'flex',
          gap: 3,
          mb: 3,
          alignItems: 'center',
        }}>
          {/* Members */}
          <Tooltip title={`${membersCount} participants`}>
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

        {/* Category and Location - Always Visible */}
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          mb: 3,
        }}>
          {group.category && (
            <Chip
              icon={<CategoryIcon sx={{ fontSize: 16 }} />}
              label={group.category.name}
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
          
          {group.location && (
            <Chip
              icon={<LocationIcon sx={{ fontSize: 16 }} />}
              label={group.location}
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
            {group.tags && group.tags.slice(0, 3).map((tag, index) => (
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
            {group.tags && group.tags.length > 3 && (
              <Chip
                label={`+${group.tags.length - 3}`}
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

        {/* Hover Actions - Appear on Hover */}
        <Box
          className="hover-actions"
          sx={{
            opacity: 0,
            transform: 'translateY(20px)',
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
              onClick(group.id);
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
              variant="contained2"
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
              variant="contained2"
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
          ) : group.is_full ? (
            <Button
              variant="contained2"
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
              sx={{
                backgroundColor: alpha('#1976d2', 0.9),
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1976d2',
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                onJoinRequest(group.id);
              }}
            >
              {requiresApproval ? 'Request Join' : 'Join Now'}
            </Button>
          ) : null}
        </Box>
      </Box>
    </Card>
  );
};
