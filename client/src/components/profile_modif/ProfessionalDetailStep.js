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
  Image as ImageIcon,
} from '@mui/icons-material';

const ProfessionalDetailsStep = ({ 
  profile, 
  errors, 
  loading, 
  categories, 
  categoriesLoading, 
  previewImageBio,
  handleInputChange,
  handleImageBioChange 
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
      
      <Grid item xs={12}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="bio-image-upload"
            type="file"
            onChange={handleImageBioChange}
          />
          <Typography variant="subtitle2" sx={{ mb: 2, alignSelf: 'flex-start' }}>
            Bio Image (Optional)
          </Typography>
          <label htmlFor="bio-image-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<ImageIcon />}
              sx={{ mb: 2 }}
            >
              Choose Bio Image
            </Button>
          </label>
          {previewImageBio && (
            <Box sx={{ mt: 2, width: '100%' }}>
              <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                Preview:
              </Typography>
              <img
                src={previewImageBio}
                alt="Bio preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  objectFit: 'cover'
                }}
              />
            </Box>
          )}
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            This image will be displayed in your profile bio section (max 5MB)
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default ProfessionalDetailsStep;