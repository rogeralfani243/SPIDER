// src/components/posts/AlgorithmSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Fade,
  Divider,
  useTheme,
  useMediaQuery,
  colors
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Recommend,
  Flag,
  NewReleases,
  Group,
  AccessTime,
  TrendingUp,
  Star,
  ChatBubble,
  Visibility,
  Info,
  CheckCircle
} from '@mui/icons-material';

/**
 * Algorithm Selector Component
 * 
 * A professional algorithm selection dropdown with theming support.
 * Allows users to switch between different content recommendation algorithms.
 * 
 * @param {string} currentAlgorithm - Currently selected algorithm ID
 * @param {function} onAlgorithmChange - Callback when algorithm changes
 * @param {object} algorithmInfo - Additional info about current algorithm
 * @param {object} userContext - User context/state information
 */
const AlgorithmSelector = ({ 
  currentAlgorithm, 
  onAlgorithmChange, 
  algorithmInfo, 
  userContext 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Algorithm definitions with icons, colors, and descriptions
  const algorithms = [
    {
      id: 'recommended',
      name: 'Recommended',
      icon: <Recommend />,
      description: 'Personalized recommendations based on your activity',
      color: theme.palette.primary.main,
      badge: 'Default',
      badgeColor: 'primary',
      type: 'algorithm' // Nouveau: type pour distinguer algorithm vs sort
    },
    {
      id: 'country_priority',
      name: 'Country Priority',
      icon: <Flag />,
      description: 'Prioritizes content from your country',
      color: '#34C759',
      badge: 'Local',
      badgeColor: 'success',
      type: 'algorithm'
    },
    {
      id: 'discovery_new',
      name: 'Discovery New',
      icon: <NewReleases />,
      description: 'Discover new content you haven\'t seen yet',
      color: '#FF9500',
      badge: 'Fresh',
      badgeColor: 'warning',
      type: 'algorithm'
    },
    {
      id: 'similar_users',
      name: 'Similar Users',
      icon: <Group />,
      description: 'Content liked by users with similar tastes',
      color: '#AF52DE',
      badge: 'Social',
      badgeColor: 'secondary',
      type: 'algorithm'
    },
    {
      id: 'avoid_seen',
      name: 'Avoid Seen',
      icon: <Visibility />,
      description: 'Filters out content you have already viewed',
      color: '#FF3B30',
      badge: 'Clean',
      badgeColor: 'error',
      type: 'algorithm'
    },
    {
      id: 'newest',
      name: 'Newest',
      icon: <AccessTime />,
      description: 'Chronological order - newest posts first',
      color: '#8E8E93',
      badge: 'Time',
      badgeColor: 'default',
      type: 'sort' // Nouveau: c'est un tri, pas un algorithme
    },
    {
      id: 'oldest',
      name: 'Oldest',
      icon: <AccessTime />,
      description: 'Chronological order - oldest posts first',
      color: '#8E8E93',
      badge: 'Time',
      badgeColor: 'default',
      type: 'sort'
    },
    {
      id: 'popular',
      name: 'Popular',
      icon: <TrendingUp />,
      description: 'Most liked and shared content',
      color: '#5856D6',
      badge: 'Trending',
      badgeColor: 'primary',
      type: 'sort'
    },
    {
      id: 'top_rated',
      name: 'Top Rated',
      icon: <Star />,
      description: 'Highest rated content from the community',
      color: '#FFCC00',
      badge: 'Quality',
      badgeColor: 'warning',
      type: 'sort'
    },
    {
      id: 'most_commented',
      name: 'Most Commented',
      icon: <ChatBubble />,
      description: 'Content with the most discussions',
      color: '#5AC8FA',
      badge: 'Engaging',
      badgeColor: 'info',
      type: 'sort'
    },
    {
      id: 'random',
      name: 'Random',
      icon: <AccessTime />,
      description: 'Completely random order',
      color: '#8E8E93',
      badge: 'Mix',
      badgeColor: 'default',
      type: 'sort'
    },
    {
      id: 'country',
      name: 'My Country',
      icon: <Flag />,
      description: 'Posts from your country first',
      color: '#34C759',
      badge: 'Local',
      badgeColor: 'success',
      type: 'sort'
    }
  ];

  const currentAlgorithmData = algorithms.find(algo => algo.id === currentAlgorithm) || algorithms[0];
  const bgColor = `linear-gradient(
    135deg,
    rgb(10, 10, 10),
    rgb(60, 10, 10),
    rgb(180, 20, 20),
    rgb(255, 0, 80) 
  )`;
  
  // Séparer les algorithmes et les tris pour l'affichage
  const algorithmAlgorithms = algorithms.filter(algo => algo.type === 'algorithm');
  const sortAlgorithms = algorithms.filter(algo => algo.type === 'sort');

  // Theme configuration for consistent styling
  const styles = {
    selectorButton: {
      minWidth: isMobile ? 'auto' : 240,
      px: 2,
      py: 1.5,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 2,
      backgroundColor: theme.palette.background.paper,
      '&:hover': {
        color:'#fff',
        backgroundColor: theme.palette.action.hover,
        borderColor: theme.palette.primary.main,
      }
    },
    algorithmIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      borderRadius: '50%',
      marginRight: 2
    },
    dropdown: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: 0,
      width: isMobile ? '100vw' : 420, // Augmenté pour plus d'espace
      maxWidth: '90vw',
      zIndex: theme.zIndex.modal,
      boxShadow: theme.shadows[8],
      borderRadius: theme.shape.borderRadius,
      overflow: 'hidden'
    },
    algorithmOption: {
      borderRadius: 1,
      mb: 0.5,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      }
    },
    activeAlgorithm: {
      backgroundColor: `${theme.palette.primary.main}10`,
      borderLeft: `3px solid ${theme.palette.primary.main}`,
    },
    sectionHeader: {
      px: 2,
      py: 1,
      backgroundColor: theme.palette.background.default,
      borderBottom: `1px solid ${theme.palette.divider}`,
    }
  };

  return (
    <Box position="relative" ref={dropdownRef}>
      {/* Main selector button */}
      <Button
        variant="outlined"
        onClick={() => setIsOpen(!isOpen)}
        sx={styles.selectorButton}
        fullWidth={isMobile}
        endIcon={isOpen ? <ExpandLess /> : <ExpandMore />}
        aria-label="Select recommendation algorithm"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Box sx={styles.algorithmIcon} style={{ backgroundColor: `${currentAlgorithmData.color}20` }}>
          {React.cloneElement(currentAlgorithmData.icon, { 
            sx: { color: currentAlgorithmData.color, fontSize: 20 } 
          })}
        </Box>
        <Box textAlign="left" flex={1}>
          <Typography variant="body2" color="text.secondary" fontSize={12}>
            {currentAlgorithmData.type === 'algorithm' ? 'Algorithm' : 'Sort by'}
          </Typography>
          <Typography variant="subtitle2" fontWeight={600}>
            {currentAlgorithmData.name}
          </Typography>
        </Box>
      </Button>

      {/* Dropdown menu */}
      <Fade in={isOpen}>
        <Paper sx={styles.dropdown} elevation={8}>
          {/* Header */}
          <Box sx={{ p: 3, background: bgColor, color: 'white' }}>
            <Typography variant="h6" fontWeight={600} color='white'>
              Filter & Sort
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Choose how content is sorted and recommended to you
            </Typography>
          </Box>

          {/* Algorithms list */}
          <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
            {/* Section: Recommendation Algorithms */}
            <Box sx={styles.sectionHeader}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                Recommendation Algorithms
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Intelligent sorting based on your preferences
              </Typography>
            </Box>
            
            <List disablePadding sx={{ p: 1 }}>
              {algorithmAlgorithms.map((algorithm) => (
                <ListItem 
                  key={algorithm.id} 
                  disablePadding
                  sx={{
                    ...styles.algorithmOption,
                    ...(currentAlgorithm === algorithm.id && styles.activeAlgorithm)
                  }}
                >
                  <ListItemButton
                    onClick={() => {
                      onAlgorithmChange(algorithm.id);
                      setIsOpen(false);
                    }}
                    selected={currentAlgorithm === algorithm.id}
                    aria-selected={currentAlgorithm === algorithm.id}
                    role="option"
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: `${algorithm.color}20`,
                          color: algorithm.color
                        }}
                      >
                        {algorithm.icon}
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {algorithm.name}
                          </Typography>
                          {algorithm.badge && (
                            <Chip 
                              label={algorithm.badge} 
                              size="small" 
                              color={algorithm.badgeColor}
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {algorithm.description}
                        </Typography>
                      }
                      secondaryTypographyProps={{ variant: 'body2' }}
                    />

                    {currentAlgorithm === algorithm.id && (
                      <CheckCircle sx={{ color: algorithm.color, ml: 1 }} />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            <Divider />

            {/* Section: Simple Sorting */}
            <Box sx={styles.sectionHeader}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                Simple Sorting
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Basic sorting options
              </Typography>
            </Box>
            
            <List disablePadding sx={{ p: 1 }}>
              {sortAlgorithms.map((algorithm) => (
                <ListItem 
                  key={algorithm.id} 
                  disablePadding
                  sx={{
                    ...styles.algorithmOption,
                    ...(currentAlgorithm === algorithm.id && styles.activeAlgorithm)
                  }}
                >
                  <ListItemButton
                    onClick={() => {
                      onAlgorithmChange(algorithm.id);
                      setIsOpen(false);
                    }}
                    selected={currentAlgorithm === algorithm.id}
                    aria-selected={currentAlgorithm === algorithm.id}
                    role="option"
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: `${algorithm.color}20`,
                          color: algorithm.color
                        }}
                      >
                        {algorithm.icon}
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {algorithm.name}
                          </Typography>
                          {algorithm.badge && (
                            <Chip 
                              label={algorithm.badge} 
                              size="small" 
                              color={algorithm.badgeColor}
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {algorithm.description}
                        </Typography>
                      }
                      secondaryTypographyProps={{ variant: 'body2' }}
                    />

                    {currentAlgorithm === algorithm.id && (
                      <CheckCircle sx={{ color: algorithm.color, ml: 1 }} />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Algorithm information section */}
          {algorithmInfo && (
            <>
              <Divider />
              <Box sx={{ p: 2, backgroundColor: theme.palette.background.default }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Info sx={{ color: "#740000ff" }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Current {currentAlgorithmData.type === 'algorithm' ? 'Algorithm' : 'Sort'} Details
                  </Typography>
                </Box>
                
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: theme.palette.background.paper }}>
                  <Typography variant="body2">
                    <Box component="span" fontWeight={600} color="#740000ff">
                      {currentAlgorithmData.name}
                    </Box>
                    {' '}— {algorithmInfo.description || currentAlgorithmData.description}
                  </Typography>
                  
                  {userContext?.country && currentAlgorithmData.id === 'country' && (
                    <Box mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        Showing posts from: {userContext.country}
                      </Typography>
                    </Box>
                  )}
                  
                  {userContext?.is_authenticated && !userContext?.is_authenticated && (
                    <Box mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        Sign in for personalized recommendations
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            </>
          )}
        </Paper>
      </Fade>
    </Box>
  );
};

export default AlgorithmSelector;