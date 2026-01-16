// src/components/groups/GroupSearchFilters.jsx
import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const GroupSearchFilters = ({ onSearch, initialFilters, categories }) => {
  const [filters, setFilters] = useState({
    q: initialFilters.q || '',
    category_id: initialFilters.category_id || '',
    min_rating: initialFilters.min_rating || 0,
    max_members: initialFilters.max_members || '',
    tags: initialFilters.tags || [],
    location: initialFilters.location || '',
  });
  
  const [tagInput, setTagInput] = useState('');

  const handleInputChange = (field) => (event) => {
    setFilters({ ...filters, [field]: event.target.value });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      setFilters({
        ...filters,
        tags: [...filters.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFilters({
      ...filters,
      tags: filters.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      q: '',
      category_id: '',
      min_rating: 0,
      max_members: '',
      tags: [],
      location: '',
    });
    setTagInput('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search"
            value={filters.q}
            onChange={handleInputChange('q')}
            placeholder="Group name, description..."
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Location"
            value={filters.location}
            onChange={handleInputChange('location')}
            placeholder="City, country..."
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category_id}
              label="Category"
              onChange={handleInputChange('category_id')}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Minimum Rating</InputLabel>
            <Select
              value={filters.min_rating}
              label="Minimum Rating"
              onChange={handleInputChange('min_rating')}
            >
              <MenuItem value={0}>Any Rating</MenuItem>
              <MenuItem value={5}>5 Stars</MenuItem>
              <MenuItem value={4}>4+ Stars</MenuItem>
              <MenuItem value={3}>3+ Stars</MenuItem>
              <MenuItem value={2}>2+ Stars</MenuItem>
              <MenuItem value={1}>1+ Star</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Max Members"
            type="number"
            value={filters.max_members}
            onChange={handleInputChange('max_members')}
            placeholder="e.g., 100"
            InputProps={{ inputProps: { min: 1 } }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Tags
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TextField
              fullWidth
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add tags (press Enter)"
              size="small"
            />
            <IconButton
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              sx={{ ml: 1 }}
            >
              <AddIcon />
            </IconButton>
          </Box>
          
          {filters.tags.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {filters.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClear}
            >
              Clear All
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
            >
              Apply Filters
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

export default GroupSearchFilters;