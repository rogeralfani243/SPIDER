// src/components/RecentPosts.jsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
  Divider,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Grid,
  Avatar,
  useTheme,
  Tooltip,
  Alert,
  Paper,
  Rating as MuiRating,
  LinearProgress,
  Pagination
} from '@mui/material';
import {
  Create as CreateIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Comment as CommentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  TrendingUp as TrendingUpIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  EmojiEvents as TrophyIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  Videocam as VideoIcon,
  Audiotrack as AudioIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Collections as ImagesIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
const RecentPosts = ({ posts, total }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(5); // Nombre de posts par page
  const navigate = useNavigate();
  // Données sécurisées
  const safePosts = Array.isArray(posts) ? posts : [];
  const safeTotal = total || safePosts.length;

  // Options de tri améliorées
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Ratings' },
    { value: 'comments', label: 'Most Comments' },
    { value: 'reliable', label: 'Most Reliable' }
  ];

  // Options de filtre
  const filterOptions = [
    { value: 'all', label: 'All Posts', icon: <PublicIcon fontSize="small" /> },
    { value: 'published', label: 'Published', icon: <PublicIcon fontSize="small" /> },
    { value: 'draft', label: 'Drafts', icon: <LockIcon fontSize="small" /> },
    { value: 'archived', label: 'Archived', icon: <PublicIcon fontSize="small" /> }
  ];

  // Fonction pour détecter les types de médias dans un post
  const detectMediaTypes = (post) => {
    const mediaTypes = {
      hasImages: false,
      hasVideos: false,
      hasAudio: false,
      hasDocuments: false,
      hasLink: false,
      mediaCount: 0,
      mediaDetails: {
        images: 0,
        videos: 0,
        audio: 0,
        documents: 0
      }
    };

    // Vérifier l'image principale
    if (post.image_url) {
      mediaTypes.hasImages = true;
      mediaTypes.mediaCount += 1;
      mediaTypes.mediaDetails.images += 1;
    }

    // Vérifier les images supplémentaires (post_images)
    if (post.post_images && post.post_images.length > 0) {
      mediaTypes.hasImages = true;
      mediaTypes.mediaCount += post.post_images.length;
      mediaTypes.mediaDetails.images += post.post_images.length;
    }

    // Vérifier les fichiers (post_files)
    if (post.post_files && post.post_files.length > 0) {
      post.post_files.forEach(file => {
        switch (file.file_type) {
          case 'video':
            mediaTypes.hasVideos = true;
            mediaTypes.mediaCount += 1;
            mediaTypes.mediaDetails.videos += 1;
            break;
          case 'audio':
            mediaTypes.hasAudio = true;
            mediaTypes.mediaCount += 1;
            mediaTypes.mediaDetails.audio += 1;
            break;
          case 'document':
            mediaTypes.hasDocuments = true;
            mediaTypes.mediaCount += 1;
            mediaTypes.mediaDetails.documents += 1;
            break;
        }
      });
    }

    // Si vous avez le champ 'files' directement (PostListSerializer)
    if (post.files && post.files.length > 0) {
      post.files.forEach(file => {
        switch (file.file_type) {
          case 'video':
            mediaTypes.hasVideos = true;
            mediaTypes.mediaCount += 1;
            mediaTypes.mediaDetails.videos += 1;
            break;
          case 'audio':
            mediaTypes.hasAudio = true;
            mediaTypes.mediaCount += 1;
            mediaTypes.mediaDetails.audio += 1;
            break;
          case 'document':
            mediaTypes.hasDocuments = true;
            mediaTypes.mediaCount += 1;
            mediaTypes.mediaDetails.documents += 1;
            break;
          case 'image':
            mediaTypes.hasImages = true;
            mediaTypes.mediaCount += 1;
            mediaTypes.mediaDetails.images += 1;
            break;
        }
      });
    }

    // Vérifier si le post a un lien
    if (post.link) {
      mediaTypes.hasLink = true;
    }

    return mediaTypes;
  };

  // Fonction pour obtenir l'icône du type de média
  const getMediaIcon = (type) => {
    switch (type) {
      case 'video':
        return <VideoIcon fontSize="small" />;
      case 'audio':
        return <AudioIcon fontSize="small" />;
      case 'document':
        return <FileIcon fontSize="small" />;
      case 'image':
        return <ImageIcon fontSize="small" />;
      case 'link':
        return <LinkIcon fontSize="small" />;
      default:
        return <FileIcon fontSize="small" />;
    }
  };

  // Fonction pour obtenir le libellé du type de média
  const getMediaLabel = (type, count = 1) => {
    switch (type) {
      case 'video':
        return count > 1 ? `${count} videos` : 'video';
      case 'audio':
        return count > 1 ? `${count} audio files` : 'audio';
      case 'document':
        return count > 1 ? `${count} documents` : 'document';
      case 'image':
        return count > 1 ? `${count} images` : 'image';
      case 'link':
        return 'link';
      default:
        return count > 1 ? `${count} files` : 'file';
    }
  };

  // Fonction pour calculer la fiabilité d'une note
  const calculateRatingReliability = (avgRating, numRatings) => {
    if (numRatings === 0) return 0;
    
    // Plus il y a de ratings, plus la note est fiable
    const reliability = Math.min(numRatings / 10, 1); // 0 à 1
    
    // Bonus pour les posts avec beaucoup de ratings
    const volumeBonus = Math.log(numRatings + 1) * 0.2;
    
    return Math.min(reliability + volumeBonus, 1);
  };

  // Fonction pour calculer le score pondéré
  const calculateWeightedScore = (post) => {
    const avgRating = post.average_rating || 0;
    const numRatings = post.total_ratings || 0;
    
    if (numRatings === 0) return 0;
    
    // Bayesian-like score: combine rating and number of ratings
    const reliability = calculateRatingReliability(avgRating, numRatings);
    const weightedScore = avgRating * reliability;
    
    return weightedScore;
  };

  // Calculer le meilleur post avec logique améliorée
  const topRatedPost = useMemo(() => {
    if (safePosts.length === 0) return null;
    
    // Filtrer les posts avec au moins 1 rating
    const ratedPosts = safePosts.filter(post => (post.total_ratings || 0) > 0);
    
    if (ratedPosts.length === 0) {
      return null;
    }
    
    // Calculer le score pondéré pour chaque post
    const postsWithScore = ratedPosts.map(post => ({
      ...post,
      score: calculateWeightedScore(post),
      reliability: calculateRatingReliability(post.average_rating || 0, post.total_ratings || 0)
    }));
    
    // Trier par score pondéré (d'abord), puis par nombre de ratings (ensuite)
    postsWithScore.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // En cas d'égalité de score, utiliser le nombre de ratings
      return (b.total_ratings || 0) - (a.total_ratings || 0);
    });
    
    return postsWithScore[0] || null;
  }, [safePosts]);

  // Statistiques des posts
  const postsStats = useMemo(() => {
    const totalPosts = safeTotal;
    const published = safePosts.filter(p => p.status === 'published' || !p.status).length;
    const drafts = safePosts.filter(p => p.status === 'draft').length;
    const avgRating = safePosts.length > 0 ? 
      parseFloat((safePosts.reduce((sum, p) => sum + (p.average_rating || 0), 0) / safePosts.length).toFixed(1)) : 0;
    const totalRatings = safePosts.reduce((sum, p) => sum + (p.total_ratings || 0), 0);
    const totalComments = safePosts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
    
    // Posts bien notés (4+ étoiles avec au moins 2 ratings)
    const wellRatedPosts = safePosts.filter(p => 
      (p.average_rating || 0) >= 4 && (p.total_ratings || 0) >= 2
    ).length;
    
    return {
      total: totalPosts,
      published,
      drafts,
      avgRating,
      totalRatings,
      totalComments,
      wellRatedPosts
    };
  }, [safePosts, safeTotal]);

  // Filtrer et trier les posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = [...safePosts];
    
    // Filtre par recherche
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(post => {
        const matchesTitle = post.title?.toLowerCase().includes(searchLower);
        const matchesContent = post.content?.toLowerCase().includes(searchLower);
        const matchesCategory = post.category_details?.name?.toLowerCase().includes(searchLower);
        const matchesTags = post.tags?.some(tag => 
          typeof tag === 'string' ? tag.toLowerCase().includes(searchLower) : 
          tag.name?.toLowerCase().includes(searchLower)
        );
        
        return matchesTitle || matchesContent || matchesCategory || matchesTags;
      });
    }
    
    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(post => post.status === filterStatus);
    }
    
    // Trier
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'rating':
          // Trier par note moyenne, puis par nombre de ratings en cas d'égalité
          const ratingA = a.average_rating || 0;
          const ratingB = b.average_rating || 0;
          if (Math.abs(ratingB - ratingA) > 0.01) {
            return ratingB - ratingA;
          }
          // En cas d'égalité très proche, utiliser le nombre de ratings
          return (b.total_ratings || 0) - (a.total_ratings || 0);
        case 'popular':
          // Trier par nombre de ratings
          const ratingsA = a.total_ratings || 0;
          const ratingsB = b.total_ratings || 0;
          if (ratingsB !== ratingsA) return ratingsB - ratingsA;
          // En cas d'égalité, utiliser la note moyenne
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'comments':
          return (b.comments_count || 0) - (a.comments_count || 0);
        case 'reliable':
          // Trier par fiabilité (score pondéré)
          const scoreA = calculateWeightedScore(a);
          const scoreB = calculateWeightedScore(b);
          return scoreB - scoreA;
        default:
          return 0;
      }
    });
  }, [safePosts, searchQuery, filterStatus, sortBy]);

  // Pagination - Calculer les posts à afficher pour la page courante
  const currentPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    return filteredAndSortedPosts.slice(startIndex, endIndex);
  }, [filteredAndSortedPosts, currentPage, postsPerPage]);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredAndSortedPosts.length / postsPerPage);

  // Gestionnaires de pagination
  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleMenuOpen = (event, post) => {
    setAnchorEl(event.currentTarget);
    setSelectedPost(post);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPost(null);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1); // Réinitialiser à la première page quand on change le tri
    handleMenuClose();
  };

  const handleCreateNew = () => {
   navigate('/create-post/');
    // Navigation vers la création de post
  };

  const handleEditPost = (post) => {
    navigate(`/posts/edit/${post.id}`);
    // Navigation vers l'édition
  };

  const handleDeletePost = (post) => {
    console.log('Delete post:', post.id);
    // Confirmation et suppression
    handleMenuClose();
  };

  const handleViewPost = (post) => {
    navigate(`/user/${post.user_profile_id}/posts/${post.id}`);
    // Navigation vers la vue détaillée
  };

  const handleRatePost = (post, rating) => {
    console.log('Rate post:', post.id, 'with', rating, 'stars');
    // Appel API pour noter le post
  };

  // Indicateur de fiabilité de la note
  const renderRatingReliability = (post) => {
    const numRatings = post.total_ratings || 0;
    const avgRating = post.average_rating || 0;
    
    if (numRatings === 0) {
      return (
        <Typography variant="caption" color="text.disabled">
          No ratings yet
        </Typography>
      );
    }
    
    let reliabilityText = '';
    let reliabilityColor = '';
    
    if (numRatings >= 10) {
      reliabilityText = 'Very reliable';
      reliabilityColor = theme.palette.success.main;
    } else if (numRatings >= 5) {
      reliabilityText = 'Reliable';
      reliabilityColor = theme.palette.info.main;
    } else if (numRatings >= 3) {
      reliabilityText = 'Somewhat reliable';
      reliabilityColor = theme.palette.warning.main;
    } else {
      reliabilityText = 'Not reliable';
      reliabilityColor = theme.palette.error.main;
    }
    
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: reliabilityColor
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {reliabilityText}
        </Typography>
      </Box>
    );
  };

  // Fonction pour déterminer si un post est "bien noté"
  const isWellRated = (post) => {
    const avgRating = post.average_rating || 0;
    const numRatings = post.total_ratings || 0;
    return avgRating >= 4 && numRatings >= 2;
  };

  // Options de posts par page
  const postsPerPageOptions = [5, 10, 20, 50];

  // Composant pour afficher les badges de médias
  const MediaBadges = ({ post }) => {
    const mediaTypes = detectMediaTypes(post);
    
    if (mediaTypes.mediaCount === 0 && !mediaTypes.hasLink) {
      return null;
    }

    return (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
        {/* Badge pour le lien */}
        {mediaTypes.hasLink && (
          <Tooltip title="Contains external link">
            <Chip
              icon={getMediaIcon('link')}
              label="Link"
              size="small"
              variant="outlined"
              color="info"
              sx={{ height: 24 }}
            />
          </Tooltip>
        )}
        
        {/* Badge pour les images */}
        {mediaTypes.hasImages && (
          <Tooltip title={`${mediaTypes.mediaDetails.images} image${mediaTypes.mediaDetails.images > 1 ? 's' : ''}`}>
            <Chip
              icon={getMediaIcon('image')}
              label={`${mediaTypes.mediaDetails.images}`}
              size="small"
              variant="outlined"
              sx={{ height: 24 }}
            />
          </Tooltip>
        )}
        
        {/* Badge pour les vidéos */}
        {mediaTypes.hasVideos && (
          <Tooltip title={`${mediaTypes.mediaDetails.videos} video${mediaTypes.mediaDetails.videos > 1 ? 's' : ''}`}>
            <Chip
              icon={getMediaIcon('video')}
              label={`${mediaTypes.mediaDetails.videos}`}
              size="small"
              variant="outlined"
              color="error"
              sx={{ height: 24 }}
            />
          </Tooltip>
        )}
        
        {/* Badge pour les fichiers audio */}
        {mediaTypes.hasAudio && (
          <Tooltip title={`${mediaTypes.mediaDetails.audio} audio file${mediaTypes.mediaDetails.audio > 1 ? 's' : ''}`}>
            <Chip
              icon={getMediaIcon('audio')}
              label={`${mediaTypes.mediaDetails.audio}`}
              size="small"
              variant="outlined"
              color="success"
              sx={{ height: 24 }}
            />
          </Tooltip>
        )}
        
        {/* Badge pour les documents */}
        {mediaTypes.hasDocuments && (
          <Tooltip title={`${mediaTypes.mediaDetails.documents} document${mediaTypes.mediaDetails.documents > 1 ? 's' : ''}`}>
            <Chip
              icon={getMediaIcon('document')}
              label={`${mediaTypes.mediaDetails.documents}`}
              size="small"
              variant="outlined"
              color="warning"
              sx={{ height: 24 }}
            />
          </Tooltip>
        )}
        
        {/* Badge pour le total des médias */}
        {mediaTypes.mediaCount > 0 && (
          <Tooltip title={`Total: ${mediaTypes.mediaCount} media file${mediaTypes.mediaCount > 1 ? 's' : ''}`}>
            <Chip
              label={`${mediaTypes.mediaCount}`}
              size="small"
              variant="filled"
              sx={{ 
                height: 24,
                backgroundColor: theme.palette.grey[200],
                color: theme.palette.text.primary,
                fontWeight: 'bold'
              }}
            />
          </Tooltip>
        )}
      </Stack>
    );
  };

  return (
    <Box>
      {/* En-tête avec statistiques améliorées */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="700" color="primary">
                {postsStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Posts
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="700" color="success.main">
                {postsStats.wellRatedPosts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Well-Rated Posts
              </Typography>
              <Typography variant="caption" color="text.disabled">
                (4+ stars, 2+ ratings)
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="700" color="warning.main">
                {postsStats.avgRating.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg. Rating
              </Typography>
              <Box display="flex" justifyContent="center" mt={0.5}>
                <MuiRating
                  value={postsStats.avgRating}
                  precision={0.1}
                  readOnly
                  size="small"
                  emptyIcon={<StarBorderIcon fontSize="inherit" />}
                />
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="700" color="info.main">
                {postsStats.totalRatings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Ratings
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Across all posts
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Carte Top Rated Post améliorée */}
      {topRatedPost && (
        <Card sx={{ 
          mb: 4, 
          background: `linear-gradient(135deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main}20 100%)`,
          border: `1px solid ${theme.palette.warning.main}`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Badge de trophée */}
          <Box sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: theme.palette.warning.main,
            color: 'white',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.shadows[3]
          }}>
            <TrophyIcon />
          </Box>
          
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <StarIcon color="warning" />
              <Typography variant="subtitle1" fontWeight="600">
                Top Rated Post
              </Typography>
              <Chip
                label={`${topRatedPost.average_rating?.toFixed(1) || '0.0'}/5`}
                size="small"
                color="warning"
                icon={<StarIcon />}
              />
              <Chip
                label={`${topRatedPost.total_ratings || 0} rating${topRatedPost.total_ratings !== 1 ? 's' : ''}`}
                size="small"
                variant="outlined"
                icon={<PeopleIcon />}
              />
              
              {/* Badges de médias pour le top post */}
              <Box ml={1}>
                <MediaBadges post={topRatedPost} />
              </Box>
            </Box>
            
            <Grid container spacing={2}>
              {topRatedPost.image_url && (
                <Grid item xs={12} md={3}>
                  <Box
                    component="img"
                    src={topRatedPost.image_url}
                    alt={topRatedPost.title}
                    sx={{
                      width: '100%',
                      height: 150,
                      borderRadius: 2,
                      objectFit: 'cover',
                      boxShadow: theme.shadows[2]
                    }}
                  />
                </Grid>
              )}
              
              <Grid item xs={12} md={topRatedPost.image_url ? 9 : 12}>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  {topRatedPost.title || 'Untitled Post'}
                </Typography>
                
                {/* Lien si présent */}
                {topRatedPost.link && (
                  <Box mb={1}>
                    <Button
                      size="small"
                      startIcon={<LinkIcon />}
                      href={topRatedPost.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textTransform: 'none' }}
                    >
                      {topRatedPost.link.length > 50 
                        ? `${topRatedPost.link.substring(0, 50)}...` 
                        : topRatedPost.link}
                    </Button>
                  </Box>
                )}
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: 2
                  }}
                >
                  {topRatedPost.content || 'No content available'}
                </Typography>
                
                <Box display="flex" alignItems="center" gap={3}>
                  {/* Rating avec barre de confiance */}
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <MuiRating
                        value={topRatedPost.average_rating || 0}
                        precision={0.1}
                        readOnly
                        size="medium"
                        emptyIcon={<StarBorderIcon fontSize="inherit" />}
                      />
                      <Typography variant="body2" fontWeight="600">
                        {topRatedPost.average_rating?.toFixed(1) || '0.0'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        /5
                      </Typography>
                    </Box>
                    
                    {/* Barre de confiance */}
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Rating confidence
                        </Typography>
                        <Typography variant="caption" fontWeight="600">
                          {calculateRatingReliability(topRatedPost.average_rating || 0, topRatedPost.total_ratings || 0).toFixed(2)}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculateRatingReliability(topRatedPost.average_rating || 0, topRatedPost.total_ratings || 0) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: `${theme.palette.warning.main}30`,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: theme.palette.warning.main,
                            borderRadius: 3,
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  
                  {/* Statistiques */}
                  <Stack direction="row" spacing={2}>
                    <Box textAlign="center">
                      <Typography variant="h6" fontWeight="700">
                        {topRatedPost.total_ratings || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ratings
                      </Typography>
                    </Box>
                    
                    <Box textAlign="center">
                      <Typography variant="h6" fontWeight="700">
                        {topRatedPost.comments_count || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Comments
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Button
                    variant="contained"
                    color="warning"
                    endIcon={<OpenInNewIcon />}
                    onClick={() => handleViewPost(topRatedPost)}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    View Post
                  </Button>
                </Box>
                
                {/* Catégorie et date */}
                <Box display="flex" alignItems="center" gap={2} mt={2}>
                  {topRatedPost.category_details && (
                    <Chip
                      icon={<CategoryIcon />}
                      label={topRatedPost.category_details.name}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    Posted {topRatedPost.created_at ? formatDistanceToNow(new Date(topRatedPost.created_at), { addSuffix: true }) : 'recently'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Barre d'outils */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Réinitialiser à la première page quand on recherche
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={6} md={2}>
              <Button
                fullWidth
                startIcon={<FilterIcon />}
                onClick={() => {
                  setFilterStatus(filterStatus === 'published' ? 'all' : 'published');
                  setCurrentPage(1); // Réinitialiser à la première page quand on filtre
                }}
                variant={filterStatus === 'published' ? 'contained' : 'outlined'}
                size="small"
              >
                Filter
              </Button>
            </Grid>
            
            <Grid item xs={6} md={2}>
              <Button
                fullWidth
                startIcon={<SortIcon />}
                onClick={(e) => handleMenuOpen(e, null)}
                variant="outlined"
                size="small"
              >
                {sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort'}
              </Button>
            </Grid>
            
            <Grid item xs={12} md={4} textAlign="right">
              <Button
                variant="contained"
                startIcon={<CreateIcon />}
                onClick={handleCreateNew}
                sx={{ minWidth: 140 }}
              >
                New Post
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Menu de tri */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {sortOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={sortBy === option.value}
            onClick={() => handleSortChange(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Liste des posts avec pagination */}
      {currentPosts.length > 0 ? (
        <Stack spacing={3}>
          {currentPosts.map((post, index) => {
            const postDate = post.created_at ? new Date(post.created_at) : null;
            const timeAgo = postDate ? formatDistanceToNow(postDate, { addSuffix: true }) : 'Recently';
            const formattedDate = postDate ? format(postDate, 'MMM dd, yyyy') : '';
            const mediaTypes = detectMediaTypes(post);
            
            return (
              <Card 
                key={post.id || index} 
                elevation={2}
                sx={{
                  borderLeft: isWellRated(post) ? `4px solid ${theme.palette.success.main}` : 'none',
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
                            {/* Badge "Well Rated" */}
                            {isWellRated(post) && (
                              <Chip
                                label="Well Rated"
                                size="small"
                                color="success"
                                icon={<StarIcon />}
                              />
                            )}
                            
                            {/* Catégorie */}
                            {post.category_details && (
                              <Chip
                                icon={<CategoryIcon />}
                                label={post.category_details.name}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            
                            {/* Rating */}
                            {(post.average_rating || post.total_ratings > 0) && (
                              <Chip
                                icon={<StarIcon />}
                                label={`${post.average_rating?.toFixed(1) || '0.0'}/5`}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                            
                            {/* Badges de médias */}
                            <MediaBadges post={post} />
                            
                            <Typography variant="caption" color="text.secondary">
                              {formattedDate} • {timeAgo}
                            </Typography>
                          </Box>
                          
                          <Typography variant="h6" fontWeight="600" gutterBottom>
                            {post.title || 'Untitled Post'}
                          </Typography>
                          
                          {/* Lien si présent */}
                          {post.link && (
                            <Box mb={1}>
                              <Button
                                size="small"
                                startIcon={<LinkIcon />}
                                href={post.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ textTransform: 'none' }}
                              >
                                {post.link.length > 40 
                                  ? `${post.link.substring(0, 40)}...` 
                                  : post.link}
                              </Button>
                            </Box>
                          )}
                          
                          {post.image_url && (
                            <Box
                              component="img"
                              src={post.image_url}
                              alt={post.title}
                              sx={{
                                width: '100%',
                                maxHeight: 200,
                                objectFit: 'cover',
                                borderRadius: 1,
                                mb: 2,
                                cursor: 'pointer',
                                '&:hover': {
                                  opacity: 0.9
                                }
                              }}
                              onClick={() => handleViewPost(post)}
                            />
                          )}
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            paragraph
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {post.content || 'No content available'}
                          </Typography>
                        </Box>
                        
                     
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        {/* Statistiques du post */}
                        <Stack direction="row" spacing={3} alignItems="center">
                          {/* Rating avec fiabilité */}
                          <Tooltip title={`${post.average_rating?.toFixed(1) || '0.0'} stars from ${post.total_ratings || 0} ratings`}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <MuiRating
                                value={post.average_rating || 0}
                                precision={0.1}
                                readOnly
                                size="small"
                                emptyIcon={<StarBorderIcon fontSize="inherit" />}
                              />
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {post.average_rating?.toFixed(1) || '0.0'}/5
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ({post.total_ratings || 0})
                                </Typography>
                              </Box>
                            </Box>
                          </Tooltip>
                          
                          {/* Indicateur de fiabilité */}
                        { /*  {renderRatingReliability(post)} */}
                          
                          {/* Comments */}
                          <Tooltip title="Comments">
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <CommentIcon fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary">
                                {post.comments_count || 0}
                              </Typography>
                            </Box>
                          </Tooltip>
                          
                          {/* Votre note si existante */}
                          {post.user_rating && (
                            <Tooltip title="Your rating">
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <StarIcon fontSize="small" color="warning" />
                                <Typography variant="caption" color="text.secondary">
                                  You: {post.user_rating}/5
                                </Typography>
                              </Box>
                            </Tooltip>
                          )}
                          
                          {/* Total des médias */}
                          {mediaTypes.mediaCount > 0 && (
                            <Tooltip title={`Contains ${mediaTypes.mediaCount} media file${mediaTypes.mediaCount > 1 ? 's' : ''}`}>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <ImagesIcon fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                  {mediaTypes.mediaCount}
                                </Typography>
                              </Box>
                            </Tooltip>
                          )}
                        </Stack>
                        
                        {/* Actions */}
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditPost(post)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => handleViewPost(post)}>
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Grid>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <Grid item xs={12}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                          {post.tags.slice(0, 3).map((tag, tagIndex) => (
                            <Chip
                              key={tagIndex}
                              label={typeof tag === 'object' ? tag.name : tag}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {post.tags.length > 3 && (
                            <Chip
                              label={`+${post.tags.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      ) : (
        <Box textAlign="center" py={8}>
          <CreateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No posts found
          </Typography>
          <Typography variant="body2" color="text.disabled" paragraph>
            {searchQuery ? 'Try adjusting your search criteria' : 'Start by creating your first post'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<CreateIcon />}
            onClick={handleCreateNew}
          >
            Create Your First Post
          </Button>
        </Box>
      )}

      {/* Pagination améliorée */}
      {filteredAndSortedPosts.length > 0 && (
        <Box mt={4}>
          {/* Sélecteur de posts par page */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                Posts per page:
              </Typography>
              <select
                value={postsPerPage}
                onChange={(e) => {
                  setPostsPerPage(parseInt(e.target.value));
                  setCurrentPage(1); // Réinitialiser à la première page
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontSize: '14px'
                }}
              >
                {postsPerPageOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Showing {(currentPage - 1) * postsPerPage + 1} to{' '}
              {Math.min(currentPage * postsPerPage, filteredAndSortedPosts.length)} of{' '}
              {filteredAndSortedPosts.length} posts
            </Typography>
          </Box>
          
          {/* Contrôles de pagination */}
          <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
            {/* Première page */}
            <Tooltip title="First page">
              <span>
                <IconButton
                  onClick={handleFirstPage}
                  disabled={currentPage === 1}
                  size="small"
                >
                  <FirstPageIcon />
                </IconButton>
              </span>
            </Tooltip>
            
            {/* Page précédente */}
            <Tooltip title="Previous page">
              <span>
                <IconButton
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  size="small"
                >
                  <NavigateBeforeIcon />
                </IconButton>
              </span>
            </Tooltip>
            
            {/* Pagination avec numéros */}
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
              siblingCount={1}
              boundaryCount={1}
              sx={{
                '& .MuiPaginationItem-root': {
                  fontWeight: 500,
                },
                '& .Mui-selected': {
                  fontWeight: 'bold',
                }
              }}
            />
            
            {/* Page suivante */}
            <Tooltip title="Next page">
              <span>
                <IconButton
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  size="small"
                >
                  <NavigateNextIcon />
                </IconButton>
              </span>
            </Tooltip>
            
            {/* Dernière page */}
            <Tooltip title="Last page">
              <span>
                <IconButton
                  onClick={handleLastPage}
                  disabled={currentPage === totalPages}
                  size="small"
                >
                  <LastPageIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          
          {/* Indicateur de page */}
          <Box mt={2} textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Page {currentPage} of {totalPages}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Conseils */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Tip:</strong> Look for the media icons to quickly identify posts with videos, audio, 
          documents, or multiple images. Posts with more media content often provide richer information.
        </Typography>
      </Alert>
    </Box>
  );
};

export default RecentPosts;