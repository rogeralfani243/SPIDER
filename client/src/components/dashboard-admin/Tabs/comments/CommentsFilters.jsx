import React, { useState } from 'react';
import {
  Paper,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Menu,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

const CommentsFilters = ({
  localSearch,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  ordering,
  onOrderingChange,
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);

  const handleFilterChange = (key, value) => {
    onFilterChange(key, value);
    setFilterMenuAnchor(null);
  };

  return (
    <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search comments, users, posts..."
              value={localSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: localSearch && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={onClearSearch}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Order By</InputLabel>
              <Select
                value={ordering}
                label="Order By"
                onChange={(e) => onOrderingChange(e.target.value)}
              >
                <MenuItem value="-created_at">Newest First</MenuItem>
                <MenuItem value="created_at">Oldest First</MenuItem>
                <MenuItem value="-likes_count">Most Liked</MenuItem>
                <MenuItem value="-replies_count">Most Replies</MenuItem>
                <MenuItem value="-total_comments_count">Most Discussed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
              fullWidth
            >
              More Filters
            </Button>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant="text"
              onClick={onClearFilters}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <MenuItem>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.has_media === 'true'}
                onChange={(e) => handleFilterChange('has_media', e.target.checked ? 'true' : '')}
              />
            }
            label="Has Media"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.is_hidden === 'true'}
                onChange={(e) => handleFilterChange('is_hidden', e.target.checked ? 'true' : '')}
              />
            }
            label="Hidden"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.is_spam === 'true'}
                onChange={(e) => handleFilterChange('is_spam', e.target.checked ? 'true' : '')}
              />
            }
            label="Spam"
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default CommentsFilters;