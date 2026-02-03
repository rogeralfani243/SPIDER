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
      badgeColor: 'primary'
    },
    {
      id: 'country_priority',
      name: 'Country Priority',
      icon: <Flag />,
      description: 'Prioritizes content from your country',
      color: '#34C759',
      badge: 'Local',
      badgeColor: 'success'
    },
   
    {
      id: 'similar_users',
      name: 'Similar Users',
      icon: <Group />,
      description: 'Content liked by users with similar tastes',
      color: '#AF52DE',
      badge: 'Social',
      badgeColor: 'secondary'
    },
    {
      id: 'avoid_seen',
      name: 'Avoid Seen',
      icon: <Visibility />,
      description: 'Filters out content you have already viewed',
      color: '#FF3B30',
      badge: 'Clean',
      badgeColor: 'error'
    },
    {
      id: 'newest',
      name: 'Newest',
      icon: <AccessTime />,
      description: 'Chronological order - newest posts first',
      color: '#8E8E93',
      badge: 'Time',
      badgeColor: 'default'
    },
    {
      id: 'popular',
      name: 'Popular',
      icon: <TrendingUp />,
      description: 'Most liked and shared content',
      color: '#5856D6',
      badge: 'Trending',
      badgeColor: 'primary'
    },
    {
      id: 'top_rated',
      name: 'Top Rated',
      icon: <Star />,
      description: 'Highest rated content from the community',
      color: '#FFCC00',
      badge: 'Quality',
      badgeColor: 'warning'
    },
    {
      id: 'most_commented',
      name: 'Most Commented',
      icon: <ChatBubble />,
      description: 'Content with the most discussions',
      color: '#5AC8FA',
      badge: 'Engaging',
      badgeColor: 'info'
    }
  ];

  const currentAlgorithmData = algorithms.find(algo => algo.id === currentAlgorithm) || algorithms[0];
  const bgColor = `linear-gradient(
  135deg,
  rgb(10, 10, 10),
  rgb(60, 10, 10),
  rgb(180, 20, 20),
  rgb(255, 0, 80) 
)`
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
      width: isMobile ? '100vw' : 380,
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
            Current filter
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
              Filter
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Choose how content is sorted and recommended to you
            </Typography>
          </Box>

          {/* Algorithms list */}
          <Box sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, display: 'block', mb: 1 }}>
              Select a filter:
            </Typography>
            
            <List disablePadding>
              {algorithms.map((algorithm) => (
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
                    Current filter Details
                  </Typography>
                </Box>
                
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: theme.palette.background.paper }}>
                  <Typography variant="body2">
                    <Box component="span" fontWeight={600} color="#740000ff">
                      {algorithmInfo.name}
                    </Box>
                    {' '}— {algorithmInfo.description}
                  </Typography>
                  
                  {userContext && (
                    <Box mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        Personalized for your interests in {userContext.interests?.join(', ')}
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