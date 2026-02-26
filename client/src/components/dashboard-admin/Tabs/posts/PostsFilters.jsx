import React, { useState, useEffect } from 'react';
import {
  Paper,
  Grid,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Avatar,
  Box
} from '@mui/material';
import {
  Search as SearchIcon,
  Category as CategoryIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

const PostsFilters = ({ posts, onFilterChange }) => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    author: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);

  useEffect(() => {
    // Extract unique categories and authors
    const uniqueCategories = {};
    const uniqueAuthors = {};

    posts.forEach(post => {
      if (post.category && post.category.id) {
        uniqueCategories[post.category.id] = {
          id: post.category.id,
          name: post.category.name
        };
      }

      if (post.user && post.user.id) {
        uniqueAuthors[post.user.id] = {
          id: post.user.id,
          name: post.user.username || post.user_name,
          avatar: post.user_profile_image || post.user.avatar
        };
      }
    });

    setCategories(Object.values(uniqueCategories));
    setAuthors(Object.values(uniqueAuthors));
  }, [posts]);

  useEffect(() => {
    let filtered = [...posts];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(post =>
        post.title?.toLowerCase().includes(searchLower) ||
        post.content?.toLowerCase().includes(searchLower) ||
        post.user?.username?.toLowerCase().includes(searchLower) ||
        post.user_name?.toLowerCase().includes(searchLower) ||
        post.category?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(post => 
        post.category?.id?.toString() === filters.category
      );
    }

    // Author filter
    if (filters.author) {
      filtered = filtered.filter(post =>
        post.user?.id?.toString() === filters.author ||
        post.user_id?.toString() === filters.author
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch(filters.sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'rating':
          aValue = a.calculated_rating || a.average_rating || 0;
          bValue = b.calculated_rating || b.average_rating || 0;
          break;
        case 'comments':
          aValue = a.comment_count || 0;
          bValue = b.comment_count || 0;
          break;
        case 'likes':
          aValue = a.like_count || 0;
          bValue = b.like_count || 0;
          break;
        case 'views':
          aValue = a.view_count || 0;
          bValue = b.view_count || 0;
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }
      
      return filters.sortOrder === 'asc' 
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });

    onFilterChange(filtered);
  }, [posts, filters, onFilterChange]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      author: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search posts..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat.id} value={cat.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon fontSize="small" />
                    {cat.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Author</InputLabel>
            <Select
              value={filters.author}
              label="Author"
              onChange={(e) => handleFilterChange('author', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {authors.map(author => (
                <MenuItem key={author.id} value={author.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={author.avatar}
                      sx={{ width: 24, height: 24 }}
                    >
                      {author.name?.[0]?.toUpperCase()}
                    </Avatar>
                    {author.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort by</InputLabel>
            <Select
              value={filters.sortBy}
              label="Sort by"
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <MenuItem value="created_at">Date</MenuItem>
              <MenuItem value="rating">Rating</MenuItem>
              <MenuItem value="comments">Comments</MenuItem>
              <MenuItem value="likes">Likes</MenuItem>
              <MenuItem value="views">Views</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={6} sm={4} md={1}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={clearFilters}
            sx={{ minHeight: '40px' }}
          >
            Clear
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PostsFilters;