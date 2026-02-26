import React from 'react';
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
  FilterList as FilterIcon
} from '@mui/icons-material';

export const getActivityIcon = (type) => {
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

export const getActivityColor = (type) => {
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

export const getActivityTitle = (type, metadata = {}) => {
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

export const getActivityLabel = (type) => {
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