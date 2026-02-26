import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  Star as StarIcon,
  Comment as CommentIcon,
  Bolt as BoltIcon,
  PhotoLibrary as GalleryIcon
} from '@mui/icons-material';

const PostsStats = ({ posts }) => {
  const getPostMedia = (post) => {
    const media = [];
    if (post.image_url) media.push({ type: 'image' });
    if (post.post_images && post.post_images.length > 0) media.push(...post.post_images);
    if (post.post_files && post.post_files.length > 0) media.push(...post.post_files);
    return media;
  };

  const stats = [
    {
      label: 'Total Posts',
      value: posts.length,
      color: 'primary',
      icon: null
    },
    {
      label: 'Highly Rated (4+)',
      value: posts.filter(p => (p.calculated_rating || p.average_rating || 0) >= 4).length,
      color: 'success',
      icon: <StarIcon color="success" />
    },
    {
      label: 'Comments',
      value: posts.reduce((sum, post) => sum + (post.comment_count || 0), 0),
      color: 'secondary',
      icon: <CommentIcon color="secondary" />
    },
    {
      label: 'Boosted',
      value: posts.filter(p => p.is_sponsored || p.is_boosted).length,
      color: 'warning',
      icon: <BoltIcon color="warning" />
    },
    {
      label: 'With Media',
      value: posts.filter(p => getPostMedia(p).length > 0).length,
      color: 'info',
      icon: <GalleryIcon color="info" />
    }
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {stats.map((stat, index) => (
        <Grid item xs={6} sm={4} md={2} key={index}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            bgcolor: `${stat.color}.50` 
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 1,
              mb: 1 
            }}>
              {stat.icon}
              <Typography variant="h4" color={`${stat.color}.main`}>
                {stat.value}
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              {stat.label}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default PostsStats;