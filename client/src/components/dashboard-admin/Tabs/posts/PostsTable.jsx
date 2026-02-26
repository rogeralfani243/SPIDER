import React, { useState } from 'react';
import {
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Badge,
  CardMedia,
  Typography,
  LinearProgress,
  ButtonGroup
} from '@mui/material';
import {
  Visibility as ViewIcon,
  PhotoLibrary as GalleryIcon,
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Verified as VerifiedIcon,
  Bolt as BoltIcon,
  Star as StarIcon,
  Comment as CommentIcon,
  Visibility as ViewsIcon,
  Image as ImageIcon
} from '@mui/icons-material';

const PostsTable = ({ posts, onViewDetails, onOpenMedia, onGoToPost, onDelete }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getPostMedia = (post) => {
    const media = [];
    if (post.image_url) media.push({ url: post.image_url });
    if (post.post_images) media.push(...post.post_images);
    return media;
  };

  const calculateEngagement = (post) => {
    const likes = post.like_count || 0;
    const comments = post.comment_count || 0;
    const views = post.view_count || 1;
    return Math.round(((likes + comments) / views) * 100);
  };

  const calculateScore = (post) => {
    const baseScore = post.calculated_rating || post.average_rating || 0;
    const engagement = calculateEngagement(post) / 100;
    return (baseScore * 0.6 + engagement * 0.4).toFixed(1);
  };

  const getEngagementColor = (engagement) => {
    if (engagement > 50) return 'success';
    if (engagement > 20) return 'warning';
    return 'error';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 24) return `${diffHours}h`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d`;
    return date.toLocaleDateString();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell width="35%">Post & Category</TableCell>
              <TableCell width="15%">Author</TableCell>
              <TableCell width="15%">Metrics</TableCell>
              <TableCell width="10%">Score</TableCell>
              <TableCell width="10%">Date</TableCell>
              <TableCell width="15%" align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ImageIcon sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No posts found
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Try adjusting your filters or create a new post.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              posts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((post) => {
                  const engagement = calculateEngagement(post);
                  const score = calculateScore(post);
                  const mediaCount = getPostMedia(post).length;

                  return (
                    <TableRow 
                      key={post.id} 
                      hover 
                      sx={{ 
                        bgcolor: post.is_boosted ? 'rgba(255, 193, 7, 0.05)' : 'inherit',
                        borderLeft: post.is_sponsored ? '4px solid #9c27b0' : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          {mediaCount > 0 ? (
                            <Box sx={{ position: 'relative' }}>
                              <CardMedia
                                component="img"
                                image={getPostMedia(post)[0].url}
                                sx={{ 
                                  width: 70, 
                                  height: 70, 
                                  borderRadius: 1, 
                                  objectFit: 'cover',
                                  border: '1px solid',
                                  borderColor: 'grey.200'
                                }}
                                alt={post.title}
                              />
                              {mediaCount > 1 && (
                                <Badge
                                  badgeContent={`+${mediaCount - 1}`}
                                  color="primary"
                                  sx={{ position: 'absolute', top: -8, right: -8 }}
                                />
                              )}
                            </Box>
                          ) : (
                            <Box sx={{
                              width: 70,
                              height: 70,
                              borderRadius: 1,
                              bgcolor: 'grey.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px dashed',
                              borderColor: 'grey.300'
                            }}>
                              <ImageIcon sx={{ color: 'grey.400' }} />
                            </Box>
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                              <Typography variant="subtitle2" fontWeight="600" noWrap>
                                {post.title || 'Untitled Post'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                                {post.is_sponsored && (
                                  <Tooltip title="Sponsored">
                                    <VerifiedIcon fontSize="small" color="secondary" />
                                  </Tooltip>
                                )}
                                {post.is_boosted && (
                                  <Tooltip title="Boosted">
                                    <BoltIcon fontSize="small" color="warning" />
                                  </Tooltip>
                                )}
                              </Box>
                            </Box>
                            <Typography variant="caption" color="textSecondary" sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 1
                            }}>
                              {post.content?.substring(0, 120) || 'No content'}...
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                icon={<CategoryIcon fontSize="small" />}
                                label={post.category_name|| 'Uncategorized'}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 22 }}
                              />
                              {post.tags && post.tags.slice(0, 2).map((tag, index) => (
                                <Chip
                                  key={index}
                                  label={typeof tag === 'object' ? tag.name : tag}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={post.user?.avatar || post.image_profile || ''}
                            sx={{ width: 40, height: 40 }}
                          >
                            {post.user?.username?.[0]?.toUpperCase() || post.user_name?.[0]?.toUpperCase() || '?'}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight="600" noWrap>
                              {post.user?.user_username || post.user_username || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" noWrap>
                              ID: {post.user?.id || post.user_id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <StarIcon fontSize="small" color="warning" />
                              <Typography variant="body2" fontWeight="500">
                                {(post.calculated_rating || post.average_rating || 0).toFixed(1)}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="textSecondary">
                              ({post.calculated_rating_count || post.total_ratings || 0})
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CommentIcon fontSize="small" color="info" />
                              <Typography variant="body2">{post.comment_count || 0}</Typography>
                            </Box>
    </Box>
                       
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography 
                            variant="h5" 
                            fontWeight="bold"
                            color={score >= 4 ? 'success.main' : score >= 3 ? 'warning.main' : 'error.main'}
                          >
                            {score}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(engagement, 100)} 
                            color={getEngagementColor(engagement)}
                            sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                          />
                          <Typography variant="caption" color="textSecondary">
                            {engagement}% eng.
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" fontWeight="500">
                            {formatDate(post.created_at)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(post.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <ButtonGroup variant="outlined" size="small">
                          <Tooltip title="View details">
                            <IconButton
                              size="small"
                              onClick={() => onViewDetails(post)}
                              sx={{ borderRight: '1px solid', borderColor: 'divider' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View media">
                            <IconButton
                              size="small"
                              onClick={() => onOpenMedia(post)}
                              disabled={mediaCount === 0}
                              sx={{ borderRight: '1px solid', borderColor: 'divider' }}
                            >
                              <GalleryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Go to post">
                            <IconButton
                              size="small"
                              onClick={() => onGoToPost(post.id)}
                              sx={{ borderRight: '1px solid', borderColor: 'divider' }}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete(post)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ButtonGroup>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={posts.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Posts per page:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
      />
    </Paper>
  );
};

export default PostsTable;