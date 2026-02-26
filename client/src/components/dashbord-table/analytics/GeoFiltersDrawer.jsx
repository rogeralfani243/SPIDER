import React from 'react';
import {
  Drawer, Box, Typography, IconButton, TextField,
  InputAdornment, FormControl, InputLabel, Select,
  MenuItem, OutlinedInput, Checkbox, ListItemText,
  Slider, Button, Chip
} from '@mui/material';
import { FilterAlt, Clear, Search } from '@mui/icons-material';

const GeoFiltersDrawer = ({ 
  open, 
  onClose, 
  geographical, 
  filters, 
  setFilters 
}) => {
  const getAllCountries = () => {
    if (!geographical) return [];
    const countries = new Set();
    
    geographical.comments_by_country?.forEach(item => 
      countries.add(item.user__profile__country)
    );
    geographical.ratings_by_country?.forEach(item => 
      countries.add(item.user__profile__country)
    );
    geographical.feedback_by_country?.forEach(item => 
      countries.add(item.user__profile__country)
    );
    
    return Array.from(countries).filter(Boolean).sort();
  };

  const getAllCities = () => {
    if (!geographical) return [];
    const cities = new Set();
    
    geographical.comments_by_city?.forEach(item => 
      cities.add(item.user__profile__city)
    );
    geographical.ratings_by_city?.forEach(item => 
      cities.add(item.user__profile__city)
    );
    geographical.feedback_by_city?.forEach(item => 
      cities.add(item.user__profile__city)
    );
    
    return Array.from(cities).filter(Boolean).sort();
  };

  const handleChange = (field) => (event) => {
    setFilters(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSliderChange = (event, value) => {
    setFilters(prev => ({ ...prev, minInteractions: value }));
  };

  const clearFilters = () => {
    setFilters({
      selectedCountries: [],
      selectedCities: [],
      interactionType: 'all',
      minInteractions: 1,
      searchQuery: ''
    });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            <FilterAlt sx={{ mr: 1, verticalAlign: 'middle' }} />
            Geographical Filters
          </Typography>
          <IconButton onClick={onClose}>
            <Clear />
          </IconButton>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search country or city..."
          value={filters.searchQuery}
          onChange={handleChange('searchQuery')}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: filters.searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => handleChange('searchQuery')({ target: { value: '' } })}>
                  <Clear />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {/* Countries Filter */}
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Countries
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <Select
            multiple
            value={filters.selectedCountries}
            onChange={handleChange('selectedCountries')}
            input={<OutlinedInput />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {getAllCountries().map((country) => (
              <MenuItem key={country} value={country}>
                <Checkbox checked={filters.selectedCountries.indexOf(country) > -1} />
                <ListItemText primary={country} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Cities Filter */}
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Cities
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <Select
            multiple
            value={filters.selectedCities}
            onChange={handleChange('selectedCities')}
            input={<OutlinedInput />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {getAllCities().map((city) => (
              <MenuItem key={city} value={city}>
                <Checkbox checked={filters.selectedCities.indexOf(city) > -1} />
                <ListItemText primary={city} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Interaction Type */}
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Interaction Type
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <Select
            value={filters.interactionType}
            onChange={handleChange('interactionType')}
          >
            <MenuItem value="all">All Interactions</MenuItem>
            <MenuItem value="comments">Comments Only</MenuItem>
            <MenuItem value="ratings">Ratings Only</MenuItem>
            <MenuItem value="feedback">Feedback Only</MenuItem>
          </Select>
        </FormControl>

        {/* Minimum Interactions */}
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Minimum Interactions
        </Typography>
        <Box sx={{ px: 1, mb: 3 }}>
          <Slider
            value={filters.minInteractions}
            onChange={handleSliderChange}
            min={1}
            max={20}
            marks={[
              { value: 1, label: '1' },
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 20, label: '20' }
            ]}
            valueLabelDisplay="auto"
          />
        </Box>

        {/* Action Buttons */}
        <Box display="flex" gap={2}>
          <Button fullWidth variant="contained" onClick={onClose}>
            Apply Filters
          </Button>
          <Button fullWidth variant="outlined" onClick={clearFilters}>
            Clear All
          </Button>
        </Box>

        {/* Stats Summary */}
        <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Filter Summary
          </Typography>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Countries selected:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {filters.selectedCountries.length || 'All'}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Cities selected:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {filters.selectedCities.length || 'All'}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Interaction type:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {filters.interactionType === 'all' ? 'All' : filters.interactionType}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2">Minimum:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {filters.minInteractions} interactions
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default GeoFiltersDrawer;