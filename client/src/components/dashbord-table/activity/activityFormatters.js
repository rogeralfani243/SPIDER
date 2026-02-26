import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Rating
} from '@mui/material';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import CategoryIcon from '@mui/icons-material/Category';
import TagIcon from '@mui/icons-material/Tag';
import StarIcon from '@mui/icons-material/Star';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CommentIcon from '@mui/icons-material/Comment';

export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = parseISO(dateString);
    return format(date, "MM/dd/yyyy 'at' HH:mm", { locale: enUS });
  } catch (error) {
    return dateString;
  }
};

export const formatRelativeDate = (dateString) => {
  if (!dateString) return 'Recently';
  
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: enUS });
  } catch (error) {
    return 'Recently';
  }
};

export const renderStars = (stars) => {
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

export const renderPostInfo = (postData) => {
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

export const renderCommentInfo = (commentData) => {
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