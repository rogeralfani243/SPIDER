import React, { useState } from 'react';
import {
  Box,
  Chip,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Category as CategoryIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';

const GroupCategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = (direction) => {
    const container = document.getElementById('category-scroll-container');
    if (container) {
      const scrollAmount = 200;
      const newPosition = direction === 'right' 
        ? scrollPosition + scrollAmount
        : scrollPosition - scrollAmount;
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
          Categories
        </Typography>
        
        {scrollPosition > 0 && (
          <Tooltip title="Scroll left">
            <IconButton
              size="small"
              onClick={() => handleScroll('left')}
              sx={{ mr: 1 }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Tooltip title="Scroll right">
          <IconButton
            size="small"
            onClick={() => handleScroll('right')}
          >
            <ChevronRightIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        id="category-scroll-container"
        sx={{
          display: 'flex',
          overflowX: 'auto',
          py: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Chip
          label="All Categories"
          onClick={() => onSelectCategory('')}
          color={!selectedCategory ? 'primary' : 'default'}
          variant={!selectedCategory ? 'filled' : 'outlined'}
          sx={{ mr: 1, mb: 1, minWidth: 120 }}
        />
        
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: 4 }}>{category.icon}</span>
                {category.name} ({category.groups_count || 0})
              </Box>
            }
            onClick={() => onSelectCategory(category.id)}
            color={selectedCategory === category.id ? 'primary' : 'default'}
            variant={selectedCategory === category.id ? 'filled' : 'outlined'}
            sx={{ mr: 1, mb: 1, minWidth: 160 }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default GroupCategoryFilter;