import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Avatar,
  Rating,
  LinearProgress,
  Chip,
  Skeleton,
  IconButton,
  Container,
  useTheme,
  useMediaQuery,
  Divider,
  Stack,
  Paper,
    Button,
} from '@mui/material';
import {
  Star,
  StarBorder,
  StarHalf,
  LocationOn,
  Work,
  Person,
  ArrowBack,
  Phone,
  Email,
} from '@mui/icons-material';
import URL from '../../hooks/useUrl';
import '../../styles/CategoryProfiles.css';
import DashboardMain from '../dashboard_main';

const CategoryProfiles = () => {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryData, setCategoryData] = useState(null);

  const categoryName = location.state?.categoryName || 'Category';

  useEffect(() => {
    fetchCategoryProfiles();
  }, [categoryId]);

  const fetchCategoryProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      const apiUrl = `${URL}/api/profiles/category/${categoryId}/`;
      
      console.log('Fetching from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      console.log('Response status:', response.status);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', text.substring(0, 500));
        
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          if (response.status === 404) {
            throw new Error(`Category not found (404). Please check if the API endpoint exists.`);
          } else if (response.status === 500) {
            throw new Error('Server error (500). Please check the Django server logs.');
          } else {
            throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
          }
        } else {
          throw new Error('Unexpected response format from server');
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data.profiles) {
        setProfiles(data.profiles);
        setCategoryData(data);
      } else if (Array.isArray(data)) {
        setProfiles(data);
      } else {
        throw new Error('Unexpected data format from API');
      }
      
    } catch (err) {
      console.error('Error fetching category profiles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (profile) => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    } else if (profile.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    } else if (profile.last_name) {
      return profile.last_name.charAt(0).toUpperCase();
    } else {
      return profile.username?.substring(0, 2).toUpperCase() || '??';
    }
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleProfileClick = (profileId) => {
    window.location.href = `/profile/${profileId}`;
  };

  const renderRatingBar = (profile) => {
    const ratings = profile.ratings || {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };
    
    const totalRatings = Object.values(ratings).reduce((a, b) => a + b, 0);
    
    if (totalRatings === 0) {
      return (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            No ratings yet
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 1, width: '100%' }}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratings[star] || 0;
          const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
          
          return (
            <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ width: 20, mr: 1 }}>
                {star}★
              </Typography>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  flexGrow: 1,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: star >= 4 ? '#4CAF50' : star >= 3 ? '#FFC107' : '#F44336'
                  }
                }}
              />
              <Typography variant="caption" sx={{ ml: 1, minWidth: 30 }}>
                {count}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderProfileCard = (profile) => {
    const initials = getInitials(profile);
    const backgroundColor = getAvatarColor(profile.first_name || profile.last_name || profile.username);
    const avgRating = profile.avg_rating || 0;
    const totalRatings = profile.feedback_count || 0;

    return (
      <Card 
        sx={{ 
          mb: 2,
          borderRadius: 2,
          boxShadow: 2,
          '&:hover': {
            boxShadow: 6,
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease'
          },
          cursor: 'pointer',
          overflow: 'hidden',
          maxWidth: '100%'
        }}
        onClick={() => handleProfileClick(profile.id)}
      >
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Photo de profil */}
           <Grid item xs={3} sm={2} md={2}>
  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
    <Avatar
      sx={{
        width: isMobile ? 56 : 72,
        height: isMobile ? 56 : 72,
        bgcolor: backgroundColor,
        fontSize: isMobile ? '1.2rem' : '1.5rem',
        fontWeight: 'bold',
      }}
      src={profile.image || profile.image_url || undefined}
      alt={`${profile.first_name || profile.username}`}
    >
      {initials}
    </Avatar>
  </Box>
</Grid>
            {/* Nom et informations */}
            <Grid item xs={9} sm={10} md={10}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {/* Nom avec overflow hidden */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 0.5,
                  width: '100%'
                }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontSize:'15px',
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      maxWidth: isMobile ? '150px' : isTablet ? '200px' : '250px'
                    }}
                  >
                    {profile.first_name && profile.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : profile.username
                    }
                  </Typography>
                  {profile.category_name && (
                    <Chip
                      label={profile.category_name}
                      size="small"
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>

                {/* Localisation */}
                {profile.city && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      {profile.city}, {profile.country}
                    </Typography>
                  </Box>
                )}

                {/* Note moyenne */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating
                    value={avgRating}
                    precision={0.1}
                    readOnly
                    size="small"
                    icon={<Star sx={{ color: '#FFD700' }} />}
                    emptyIcon={<StarBorder sx={{ color: theme.palette.grey[300] }} />}
                  />
                  <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold' }}>
                    {avgRating.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
                  </Typography>
                </Box>

                {/* Barre de distribution des notes */}
                {renderRatingBar(profile)}
              </Box>
            </Grid>
          </Grid>

          {/* Bio */}
          {profile.bio && (
            <Box sx={{ mt: 2, pt: 1, borderTop: `1px solid ${theme.palette.grey[200]}` }}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: 1.4
                }}
              >
                {profile.bio}
              </Typography>
            </Box>
          )}

          {/* Tags/Informations supplémentaires */}
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {profile.phone && (
              <Chip
                icon={<Phone sx={{ fontSize: 14 }} />}
                label={profile.phone}
                size="small"
                variant="outlined"
              />
            )}
            {profile.email && (
              <Chip
                icon={<Email sx={{ fontSize: 14 }} />}
                label={profile.email}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderSkeleton = () => {
    return Array.from(new Array(5)).map((_, index) => (
      <Card key={index} sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={3} sm={2} md={2}>
              <Skeleton variant="circular" width="100%" height="100%" />
            </Grid>
            <Grid item xs={9} sm={10} md={10}>
              <Box sx={{ width: '100%' }}>
                <Skeleton width="60%" height={28} />
                <Skeleton width="40%" height={20} sx={{ mt: 1 }} />
                <Skeleton width="50%" height={24} sx={{ mt: 1 }} />
                <Box sx={{ mt: 2 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} width="100%" height={8} sx={{ mt: 0.5 }} />
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    ));
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 3
      }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Skeleton width={200} height={32} />
          </Box>
          {renderSkeleton()}
        </Container>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              ⚠️ Unable to Load Profiles
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button 
                variant="contained" 
                onClick={fetchCategoryProfiles}
              >
                Try Again
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Empty state
  if (profiles.length === 0) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 3
      }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5">
              {categoryName} Professionals
            </Typography>
          </Box>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              👥 No Profiles Found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              There are no professionals in this category at the moment.
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => navigate(-1)}
              startIcon={<ArrowBack />}
            >
              Browse Other Categories
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Main render
  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      py: 3
    }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={() => navigate(-1)} 
              sx={{ mr: 2 }}
              aria-label="Go back"
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                {categoryData?.category_name || categoryName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'} found
              </Typography>
            </Box>
          </Box>
          
          {categoryData?.description && (
            <Chip
              label={categoryData.description}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Liste des profils */}
        <Box>
          {profiles.map((profile) => (
            <React.Fragment key={profile.id}>
              {renderProfileCard(profile)}
            </React.Fragment>
          ))}
        </Box>

        {/* Footer avec statistiques */}
        {profiles.length > 0 && (
          <Paper sx={{ mt: 4, p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Category Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {profiles.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Profiles
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {Math.max(...profiles.map(p => p.avg_rating || 0)).toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Highest Rating
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {profiles.reduce((acc, p) => acc + (p.feedback_count || 0), 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Reviews
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {(profiles.reduce((acc, p) => acc + (p.avg_rating || 0), 0) / profiles.length).toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Average Rating
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default CategoryProfiles;