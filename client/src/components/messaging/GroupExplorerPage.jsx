// src/components/groups/GroupExplorePage.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Card,
  CardMedia,
  Fade,
  Pagination,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  alpha,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
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
  GroupWork as GroupWorkIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { groupAPI } from '../../hooks/messaging/messagingApi';
import GroupCategoryFilter from './Groups/GroupCategoryFilter';
import GroupSearchFilters from './Groups/GroupSearchFilters';
import DashboardMain from '../dashboard_main';
import { GroupCard } from './Groups/GroupCard';

const GroupExplorePage = () => {
  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]); // Stocke tous les groupes sans filtre
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    maxMembers: '',
    tags: [],
    location: '',
  });
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [myGroupsOnly, setMyGroupsOnly] = useState(false); // Nouvel état

  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadGroups();
  }, [page, sortBy, selectedCategory, minRating, searchTrigger]); // Retirer myGroupsOnly des dépendances

  // Effet pour filtrer les groupes quand myGroupsOnly change
  useEffect(() => {
    if (myGroupsOnly) {
      // Filtrer les groupes où is_member est true
      const filteredGroups = allGroups.filter(group => group.is_member === true);
      setGroups(filteredGroups);
      setTotalCount(filteredGroups.length);
      setTotalPages(Math.ceil(filteredGroups.length / 12));
    } else {
      // Utiliser tous les groupes
      setGroups(allGroups);
      if (allGroups.length > 0) {
        const count = allGroups.length;
        setTotalCount(count);
        setTotalPages(Math.ceil(count / 12));
      }
    }
  }, [myGroupsOnly, allGroups]);

  const loadCategories = async () => {
    try {
      const response = await groupAPI.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setCategories([]);
    }
  };

  const loadGroups = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        page,
        limit: 12,
        sort: sortBy,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      if (minRating > 0) params.min_rating = minRating;
      
      // NE PAS envoyer my_groups_only au backend
      
      const response = await groupAPI.exploreGroups(params);
      
      const results = response.data.results || response.data || [];
      const pages = response.data.pages || Math.ceil((response.data.count || 0) / 12) || 1;
      const count = response.data.count || results.length || 0;
      
      // Stocker tous les groupes
      setAllGroups(results);
      
      // Filtrer si myGroupsOnly est activé
      if (myGroupsOnly) {
        const filteredGroups = results.filter(group => group.is_member === true);
        setGroups(filteredGroups);
        setTotalCount(filteredGroups.length);
        setTotalPages(Math.ceil(filteredGroups.length / 12));
      } else {
        setGroups(results);
        setTotalCount(count);
        setTotalPages(pages);
      }
      
    } catch (err) {
      console.error('Error loading groups:', err);
      setError(err.response?.data?.error || 'Failed to load groups. Please try again.');
      setGroups([]);
      setAllGroups([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchTrigger(prev => prev + 1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('popular');
    setMinRating(0);
    setMyGroupsOnly(false); // Réinitialiser ce filtre aussi
    setAdvancedFilters({
      maxMembers: '',
      tags: [],
      location: '',
    });
    setPage(1);
    setSearchTrigger(prev => prev + 1);
  };

  const handleAdvancedSearch = async (filters) => {
    setAdvancedFilters(filters);
    setPage(1);
    setShowFilters(false);
    
    try {
      // Ne pas inclure my_groups_only dans les filtres avancés
      const response = await groupAPI.searchGroupsAdvanced(filters);
      const results = response.data.results || response.data || [];
      const count = response.data.count || results.length || 0;
      
      // Stocker tous les groupes
      setAllGroups(results);
      
      // Filtrer si myGroupsOnly est activé
      if (myGroupsOnly) {
        const filteredGroups = results.filter(group => group.is_member === true);
        setGroups(filteredGroups);
        setTotalCount(filteredGroups.length);
      } else {
        setGroups(results);
        setTotalCount(count);
      }
      
      setTotalPages(Math.ceil((myGroupsOnly ?   0 : count) / 12));
    } catch (err) {
      console.error('Advanced search error:', err);
      setError(err.response?.data?.error || 'Search failed');
      setGroups([]);
      setAllGroups([]);
    }
  };

  const primaryGradient = 'linear-gradient(135deg, rgb(10, 10, 10), rgb(60, 10, 10), rgb(180, 20, 20), rgb(255, 0, 80))';

  const handleGroupClick = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

const handleJoinRequest = async (groupId) => {
  try {
    const response = await groupAPI.requestToJoin(groupId);
    
    // Le backend retourne {'success': True, 'message': '...'}
    // Utiliser response.data.message au lieu de response.data.success
    let message = response.data.message || 'Join request sent successfully!';
    
    // Si jamais message n'est pas défini, on utilise un fallback
    if (!message && response.data.success === true) {
      message = 'Request sent successfully!';
    }
    
    alert(message);
    setSearchTrigger(prev => prev + 1);
  } catch (err) {
    // Pour les erreurs, utiliser response.data.error
    let errorMessage = err.response?.data?.error || 
                      err.response?.data?.detail || 
                      'Failed to send join request';
    
    alert(errorMessage);
  }
};

  // Fonction pour compter combien de groupes l'utilisateur a rejoint
  const countMyGroups = () => {
    return allGroups.filter(group => group.is_member === true).length;
  };

  return (
    <>

      
      <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh',marginTop:'3em' }}>
        {/* Header */}
        <Box sx={{ 
          mb: 6, 
          px: { xs: 2, md: 0 }
        }}>
          <Typography 
            variant="h2" 
            gutterBottom 
            sx={{ 
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '2.75rem' },
              letterSpacing: '-0.5px',
              background: primaryGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Explore Groups
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.25rem' },
              maxWidth: '600px',
              lineHeight: 1.6
            }}
          >
            Discover and join amazing communities
          </Typography>
        </Box>

        {/* Search and Filter Bar */}
        <Paper sx={{ mb: 4, p: 2, borderRadius: 2, elevation: 2 }}>
          <form onSubmit={handleSearch}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Search groups by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSearchQuery('');
                          setSearchTrigger(prev => prev + 1);
                        }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                size="medium"
                sx={{ flex: 2, minWidth: 300 }}
              />
              
              <FormControl size="medium" sx={{ minWidth: 150 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="popular">Most Popular</MenuItem>
                  <MenuItem value="recent">Most Recent</MenuItem>
                  <MenuItem value="rating">Highest Rated</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="medium" sx={{ minWidth: 150 }}>
                <InputLabel>Min Rating</InputLabel>
                <Select
                  value={minRating}
                  label="Min Rating"
                  onChange={(e) => setMinRating(e.target.value)}
                >
                  <MenuItem value={0}>Any Rating</MenuItem>
                  <MenuItem value={4}>4+ Stars</MenuItem>
                  <MenuItem value={3}>3+ Stars</MenuItem>
                  <MenuItem value={2}>2+ Stars</MenuItem>
                  <MenuItem value={1}>1+ Star</MenuItem>
                </Select>
              </FormControl>
              
              {/* Nouveau checkbox pour My Groups Only */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                minWidth: 180,
                pl: 1,
                borderLeft: 1,
                borderColor: 'divider',
                height: 56
              }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={myGroupsOnly}
                      onChange={(e) => {
                        setMyGroupsOnly(e.target.checked);
                        setPage(1);
                        // Pas besoin de retrigger l'API, on filtre côté frontend
                      }}
                      icon={<GroupIcon />}
                      checkedIcon={<GroupWorkIcon color="primary" />}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span>My groups only</span>
                      {!myGroupsOnly && allGroups.length > 0 && (
                        <Chip 
                          label={countMyGroups()} 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                  }
                  sx={{ 
                    m: 0,
                    '& .MuiTypography-root': {
                      fontWeight: 500,
                      color: myGroupsOnly ? 'primary.main' : 'text.secondary'
                    }
                  }}
                />
              </Box>
              
              <Button
                type="submit"
                variant="contained-search"
                color="primary"
                disabled={loading}
                sx={{ height: 56, px: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Box>
          </form>

          {showFilters && (
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <GroupSearchFilters
                onSearch={handleAdvancedSearch}
                initialFilters={advancedFilters}
                categories={categories}
              />
            </Box>
          )}
        </Paper>

        {/* Categories */}
        {categories.length > 0 && !myGroupsOnly && ( // Masquer les catégories si on filtre par "My groups only"
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Browse by Category
            </Typography>
            <GroupCategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(categoryId) => {
                setSelectedCategory(categoryId);
                setPage(1);
                setSearchTrigger(prev => prev + 1);
              }}
            />
          </Box>
        )}

        {/* Results Count and Clear Filters */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="body1" fontWeight="500">
            {myGroupsOnly ? (
              <>
                {totalCount} of your group{totalCount !== 1 ? 's' : ''}
                <Chip 
                  label="My Groups" 
                  size="small" 
                  color="primary" 
                  icon={<GroupWorkIcon />}
                  sx={{ ml: 1 }}
                />
              </>
            ) : (
              <>
                {totalCount} group{totalCount !== 1 ? 's' : ''} found
                {selectedCategory && categories.length > 0 && (
                  <span style={{ color: 'primary.main', marginLeft: 8 }}>
                    in "{categories.find(c => c.id == selectedCategory)?.name}"
                  </span>
                )}
              </>
            )}
          </Typography>
          {(selectedCategory || minRating > 0 || searchQuery || myGroupsOnly) && (
            <Button
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              size="small"
              variant="outlined"
            >
              Clear Filters
            </Button>
          )}
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
            <CircularProgress size={60} />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => setSearchTrigger(prev => prev + 1)}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Groups Grid */}
        {!loading && !error && (
          <>
            {groups.length > 0 ? (
              <>
                {myGroupsOnly && (
                  <Box sx={{ mb: 3, p: 2, backgroundColor: 'primary.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="primary.contrastText">
                      <GroupWorkIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Showing only groups where you are a member ({totalCount} group{totalCount !== 1 ? 's' : ''})
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                  gap: 3,
                  '@media (max-width: 900px)': {
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  },
                  '@media (max-width: 600px)': {
                    gridTemplateColumns: '1fr',
                  },
                }}>
                  {groups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      onClick={handleGroupClick}
                      onJoinRequest={handleJoinRequest}
                      isHovered={hoveredCard === group.id}
                      onMouseEnter={() => setHoveredCard(group.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      showMembershipStatus={myGroupsOnly}
                    />
                  ))}
                </Box>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(e, value) => setPage(value)}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 12,
                backgroundColor: 'background.paper',
                borderRadius: 2,
                boxShadow: 1
              }}>
                {myGroupsOnly ? (
                  <>
                    <GroupWorkIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3, opacity: 0.5 }} />
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                      You are not a member of any groups
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                      {searchQuery || selectedCategory ? 
                        'No groups matching your search where you are a member' : 
                        'Start exploring and join some amazing communities!'}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => setMyGroupsOnly(false)}
                      sx={{ mt: 2 }}
                    >
                      Explore All Groups
                    </Button>
                  </>
                ) : (
                  <>
                    <GroupIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3, opacity: 0.5 }} />
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                      No groups found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                      {searchQuery || selectedCategory || minRating > 0 
                        ? 'Try adjusting your search filters or search terms'
                        : 'No groups are currently available. Be the first to create one!'}
                    </Typography>
                    <Button
                      variant="contained-create"
                      onClick={() => navigate('/groups/create')}
                      sx={{ mt: 2 }}
                    >
                      Create New Group
                    </Button>
                  </>
                )}
              </Box>
            )}
          </>
        )}
      </Container>
    </>
  );
};

export default GroupExplorePage;