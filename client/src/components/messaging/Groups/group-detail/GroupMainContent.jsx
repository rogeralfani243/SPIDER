// src/components/groups/GroupMainContent.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Box,
  Typography,
  Button,
  Paper,
  AvatarGroup,
  Tooltip,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Language as WebsiteIcon,
  Rule as RuleIcon,
  Message as MessageIcon,
  CalendarToday as CalendarIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Tag as TagIcon,
} from '@mui/icons-material';

const GroupMainContent = ({
  group,
  allMembers,
  isMember,
  isPublicGroup,
  showFullDescription,
  setShowFullDescription,
  getRatingDistribution,
  getMyFeedback,
  handleContactAdmin,
  setFeedbackDialogOpen,
  isAuthenticated,
  navigate,
  id,
}) => {
  const description = group?.description || '';
  const truncatedDescription = description.length > 300 && !showFullDescription 
    ? `${description.substring(0, 300)}...` 
    : description;

  return (
    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                About this Group
              </Typography>
              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                {truncatedDescription}
                {description.length > 300 && (
                  <Button
                    size="small"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    sx={{ ml: 1 }}
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </Button>
                )}
              </Typography>
            </Box>
            
            {/* Stats */}
            <StatsSection group={group} allMembers={allMembers} />
            
            {/* Members Preview */}
            {allMembers.length > 0 && (
              <MembersPreviewSection 
                allMembers={allMembers} 
                isMember={isMember} 
                isPublicGroup={isPublicGroup} 
              />
            )}
            
            {/* Tags */}
            {group.tags && group.tags.length > 0 && (
              <TagsSection tags={group.tags} />
            )}
          </Grid>
          
          {/* Right Column */}
          <Grid item xs={12} md={4}>
            {/* Rating Distribution */}
            <RatingDistributionSection 
              group={group} 
              getRatingDistribution={getRatingDistribution}
              getMyFeedback={getMyFeedback}
              setFeedbackDialogOpen={setFeedbackDialogOpen}
              isAuthenticated={isAuthenticated}
              navigate={navigate}
              id={id}
              isMember={isMember}
            />
            
            {/* Quick Info */}
            <QuickInfoSection 
              group={group} 
              isPublicGroup={isPublicGroup} 
              handleContactAdmin={handleContactAdmin} 
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Sous-composants pour chaque section

const StatsSection = ({ group, allMembers }) => (
  <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
    <Grid container spacing={2}>
      <Grid item xs={6} sm={3}>
        <Box sx={{ textAlign: 'center' }}>
          <PeopleIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            {allMembers.length || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Members
          </Typography>
          {group.max_participants && (
            <Typography variant="caption" display="block" color="text.secondary">
              of {group.max_participants} max
            </Typography>
          )}
        </Box>
      </Grid>
      
      <Grid item xs={6} sm={3}>
        <Box sx={{ textAlign: 'center' }}>
          <StarIcon sx={{ fontSize: 32, color: '#ffc107', mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            {(group.average_rating || 0).toFixed(1)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Average Rating
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            ({group.total_reviews || 0} reviews)
          </Typography>
        </Box>
      </Grid>
      
      <Grid item xs={6} sm={3}>
        <Box sx={{ textAlign: 'center' }}>
          <LocationIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
          <Typography variant="body1" fontWeight="medium">
            {group.location || 'Online'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Location
          </Typography>
        </Box>
      </Grid>
      
      <Grid item xs={6} sm={3}>
        <Box sx={{ textAlign: 'center' }}>
          {group.requires_approval ? (
            <LockIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
          ) : (
            <PublicIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
          )}
          <Typography variant="body1" fontWeight="medium">
            {group.requires_approval ? 'Approval Required' : 'Open Join'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Access
          </Typography>
        </Box>
      </Grid>
    </Grid>
  </Paper>
);

const MembersPreviewSection = ({ allMembers, isMember, isPublicGroup }) => (
  <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        MEMBERS PREVIEW
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
      </Typography>
    </Box>
    
    <AvatarGroup max={8} sx={{ justifyContent: 'flex-start' }}>
      {allMembers.slice(0, 12).map((member) => (
        <Tooltip
          key={member.id || member.user?.id}
          title={`${member.user?.username} ${member.role === 'owner' || member.role === 'admin' ? `(${member.role})` : ''}`}
        >
          <Avatar
            src={member.user?.profile_image}
            sx={{ 
              width: 40, 
              height: 40,
              border: member.role === 'owner' ? '2px solid #ff6b6b' :
                      member.role === 'admin' ? '2px solid #4ecdc4' : '2px solid white'
            }}
          >
            {member.user?.username?.charAt(0)}
          </Avatar>
        </Tooltip>
      ))}
    </AvatarGroup>
    
    {!isMember && isPublicGroup && (
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Join the group to see all {allMembers.length} members and access the chat.
      </Typography>
    )}
  </Paper>
);

const TagsSection = ({ tags }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle2" gutterBottom color="text.secondary">
      TAGS
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {tags.map((tag, index) => (
        <Chip
          key={index}
          label={tag}
          size="small"
          icon={<TagIcon />}
          variant="outlined"
        />
      ))}
    </Box>
  </Box>
);

const RatingDistributionSection = ({ 
  group, 
  getRatingDistribution, 
  getMyFeedback, 
  setFeedbackDialogOpen,
  isAuthenticated,
  navigate,
  id,
  isMember
}) => (
  <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Rating Distribution
      </Typography>
      
      {getRatingDistribution().map((item) => (
        <Box key={item.stars} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ minWidth: 40 }}>
            {item.stars}★
          </Typography>
          <LinearProgress
            variant="determinate"
            value={item.percentage}
            sx={{ 
              flexGrow: 1, 
              mx: 1,
              height: 8,
              borderRadius: 1,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#ffc107',
              }
            }}
          />
          <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right', fontSize: '0.75rem' }}>
            {item.count}
          </Typography>
        </Box>
      ))}
      
      {group.total_reviews === 0 && (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
          No ratings yet
        </Typography>
      )}
      
      {/* Feedback Button */}
      <Button
        fullWidth
        variant="outlined"
        onClick={() => {
          if (!isAuthenticated) {
            navigate('/login', { state: { from: `/groups/${id}` } });
          } else if (!isMember) {
            alert('You must be a member to submit feedback.');
          } else {
            setFeedbackDialogOpen(true);
          }
        }}
        sx={{ mt: 2 }}
        disabled={!isMember}
      >
        {getMyFeedback() ? 'Update Your Review' : 'Write a Review'}
      </Button>
    </Box>
  </Paper>
);

const QuickInfoSection = ({ group, isPublicGroup, handleContactAdmin }) => (
  <Paper variant="outlined" sx={{ borderRadius: 2 }}>
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        GROUP INFO
      </Typography>
      
      {group.website && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WebsiteIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" noWrap>
            <a 
              href={group.website} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {group.website.replace(/^https?:\/\//, '')}
            </a>
          </Typography>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <RuleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="body2">
          {group.requires_approval ? 'Approval required to join' : 'Open membership'}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="body2">
          Created {new Date(group.created_at).toLocaleDateString()}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar 
          src={group.created_by?.profile_image} 
          sx={{ width: 40, height: 40, mr: 2 }}
        >
          {group.created_by?.username?.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            Created by {group.created_by?.username || 'Unknown'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {group.created_by?.email || ''}
          </Typography>
        </Box>
      </Box>
      
      {/* Contact Admin Button */}
      {isPublicGroup && group.created_by?.id && (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<MessageIcon />}
          onClick={handleContactAdmin}
          sx={{ mt: 2 }}
        >
          Contact Admin
        </Button>
      )}
    </Box>
  </Paper>
);

export default GroupMainContent;