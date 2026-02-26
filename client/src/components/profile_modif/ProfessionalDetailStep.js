import React from 'react';
import {
  Grid,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  InputAdornment,
} from '@mui/material';
import {
  Category as CategoryIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

const ProfessionalDetailsStep = ({ 
  profile, 
  errors, 
  loading, 
  categories, 
  categoriesLoading, 
  handleInputChange,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControl fullWidth error={!!errors.category} disabled={loading || categoriesLoading}>
          <InputLabel>Category</InputLabel>
          <Select
            name="category"
            value={profile.category}
            onChange={handleInputChange}
            label="Category"
            startAdornment={
              <InputAdornment position="start">
                <CategoryIcon color="action" />
              </InputAdornment>
            }
          >
            <MenuItem value="">
              <em>Select a category</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.name}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
          {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
          {profile.category && (
            <FormHelperText>
              Current: {profile.category}
            </FormHelperText>
          )}
        </FormControl>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Bio"
          name="bio"
          value={profile.bio}
          onChange={handleInputChange}
          error={!!errors.bio}
          helperText={errors.bio}
          disabled={loading}
          multiline
          rows={4}
          placeholder="Tell us about your expertise, experience, and skills..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <DescriptionIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
    </Grid>
  );
};

export default ProfessionalDetailsStep;