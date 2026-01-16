// src/components/groups/GroupTabsSection.jsx
import React from 'react';
import {
  Card,
  Tabs,
  Tab,
  CardContent,
  Divider,
  Badge,
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Avatar,
  Rating,
} from '@mui/material';
import {
  People as PeopleIcon,
  Star as StarIcon,
  Rule as RuleIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Public as PublicIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import GroupMembersSection from '../GroupMemberSection';
import useGroupTabsStyles from './GroupTabsSection.styles.js';
import { useNavigate } from 'react-router-dom';
const GroupTabsSection = ({
  tabValue,
  setTabValue,
  group,
  allMembers,
  membersLoading,
  isMember,
  isAdmin,
  feedbacks,
  navigate,
  can_invite,
  id,
  loadMembersBasedOnAccess,
  setFeedbackDialogOpen,
}) => {
  const styles = useGroupTabsStyles();
  const isPublicGroup = group?.group_type === 'group_public';


  return (
    <Card sx={styles.card}>
      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={styles.tabs}
      >
        <Tab label="About" />
        <Tab 
          label={
            <Box sx={styles.tabLabel}>
              <PeopleIcon sx={styles.tabIcon} />
              Members
              <Badge 
                badgeContent={allMembers.length} 
                color="primary" 
                sx={styles.badge}
                showZero
              />
            </Box>
          }
        />
        <Tab 
          label={
            <Box sx={styles.tabLabel}>
              <StarIcon sx={styles.tabIcon} />
              Reviews
              <Badge 
                badgeContent={feedbacks.length} 
                color="primary" 
                sx={styles.badge}
                showZero
              />
            </Box>
          }
        />
        {group.rules && <Tab label="Rules" icon={<RuleIcon />} iconPosition="start" />}
      </Tabs>
      
      <Divider />
      
      <CardContent sx={styles.cardContent}>
        {tabValue === 0 && <AboutTab group={group} allMembers={allMembers} isPublicGroup={isPublicGroup} />}
        {tabValue === 1 && (
          <GroupMembersSection
          can_invite={can_invite}
            members={allMembers}
            loading={membersLoading}
            isMember={isMember}
            isAdmin={isAdmin}
            groupId={id}
            groupType={group?.group_type}
            onMemberUpdate={() => loadMembersBasedOnAccess(group)}
          />
        )}
        {tabValue === 2 && (
          <ReviewsTab 
            feedbacks={feedbacks} 
            id={id} 
            navigate={navigate} 
            isMember={isMember}
            setFeedbackDialogOpen={setFeedbackDialogOpen}
          />
        )}
        {tabValue === 3 && group.rules && <RulesTab rules={group.rules} />}
      </CardContent>
    </Card>
  );
};

const AboutTab = ({ group, allMembers, isPublicGroup }) => {
  const styles = useGroupTabsStyles();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Group Details
      </Typography>
      
      <Grid container spacing={3}>
        {group.location && (
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={styles.infoPaper}>
              <Box sx={styles.infoHeader}>
                <LocationIcon sx={styles.infoIcon} />
                <Typography variant="subtitle1">Location</Typography>
              </Box>
              <Typography variant="body1">{group.location}</Typography>
            </Paper>
          </Grid>
        )}
        
        {group.category && (
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={styles.infoPaper}>
              <Box sx={styles.infoHeader}>
                <CategoryIcon sx={styles.infoIcon} />
                <Typography variant="subtitle1">Category</Typography>
              </Box>
              <Typography variant="body1">{group.category.name}</Typography>
              {group.category.description && (
                <Typography variant="body2" color="text.secondary" sx={styles.categoryDescription}>
                  {group.category.description}
                </Typography>
              )}
            </Paper>
          </Grid>
        )}
        
        {group.max_participants && (
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={styles.infoPaper}>
              <Box sx={styles.infoHeader}>
                <PeopleIcon sx={styles.infoIcon} />
                <Typography variant="subtitle1">Capacity</Typography>
              </Box>
              <Typography variant="body1">
                {allMembers.length} / {group.max_participants} members
                {group.max_participants - allMembers.length > 0 && (
                  <Typography variant="body2" color="success.main" component="span" sx={styles.availableSpots}>
                    ({group.max_participants - allMembers.length} spots available)
                  </Typography>
                )}
              </Typography>
            </Paper>
          </Grid>
        )}
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={styles.infoPaper}>
            <Box sx={styles.infoHeader}>
              {isPublicGroup ? (
                <PublicIcon sx={styles.infoIcon} />
              ) : (
                <LockIcon sx={styles.infoIcon} />
              )}
              <Typography variant="subtitle1">Group Type</Typography>
            </Box>
            <Typography variant="body1">
              {isPublicGroup ? 'Public Group' : 'Private Group'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={styles.groupTypeDescription}>
              {isPublicGroup 
                ? 'Anyone can find and join this group' 
                : 'Only invited members can join this group'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const ReviewsTab = ({ feedbacks, id, navigate, isMember, setFeedbackDialogOpen }) => {
  const styles = useGroupTabsStyles();

  return (
    <Box>
      <Box sx={styles.reviewsHeader}>
        <Typography variant="h6">
          Member Reviews ({feedbacks.length})
        </Typography>
        {feedbacks.length > 5 && (
          <Button
            variant="outlined"
            onClick={() => navigate(`/groups/${id}/reviews`)}
          >
            See All Reviews
          </Button>
        )}
      </Box>
      
      {feedbacks.length > 0 ? (
        <Grid container spacing={2}>
          {feedbacks.slice(0, 5).map((feedback) => (
            <Grid item xs={12} key={feedback.id}>
              <Paper variant="outlined" sx={styles.feedbackPaper}>
                <Box sx={styles.feedbackHeader}>
                  <Box sx={styles.userInfo}>
                    <Avatar
                      src={feedback.user_profile?.image}
                      sx={styles.avatar}
                      onClick={() =>     navigate(`/profile/${feedback.user_profile?.id}/`)}
                    >
                      {feedback.user?.username?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        {feedback.user?.username || 'Anonymous'}
                      </Typography>
                      <Rating value={feedback.rating} readOnly size="small" />
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
                
                {feedback.comment && (
                  <Typography variant="body2" sx={styles.feedbackComment}>
                    {feedback.comment}
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
          
          {feedbacks.length > 5 && (
            <Grid item xs={12}>
              <Box sx={styles.viewAllContainer}>
                <Button
                  variant="text"
                  onClick={() => navigate(`/groups/${id}/reviews`)}
                >
                  View all {feedbacks.length} reviews
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      ) : (
        <Box sx={styles.noReviewsContainer}>
          <StarIcon sx={styles.noReviewsIcon} />
          <Typography variant="body1" color="text.secondary">
            No reviews yet. Be the first to review!
          </Typography>
          {isMember ? (
            <Button
              variant="contained"
              onClick={() => setFeedbackDialogOpen(true)}
              sx={styles.writeReviewButton}
            >
              Write First Review
            </Button>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={styles.memberRequiredText}>
              You must be a member to write a review.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

const RulesTab = ({ rules }) => {
  const styles = useGroupTabsStyles();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Group Rules
      </Typography>
      <Paper variant="outlined" sx={styles.rulesPaper}>
        {rules}
      </Paper>
    </Box>
  );
};

export default GroupTabsSection;