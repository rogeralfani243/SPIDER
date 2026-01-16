import React from 'react';
import {
  Box,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  IconButton,
  Typography,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

/**
 * Step 1: Basic Information
 * Handles group name, description, type, category, and photo
 */
const BasicInfoStep = ({
  formData,
  categories,
  photoPreview,
  onInputChange,
  onPhotoChange,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="group-photo-upload"
            type="file"
            onChange={onPhotoChange}
          />
          <label htmlFor="group-photo-upload">
            <IconButton component="span">
              <Avatar
                src={photoPreview}
                sx={{
                  width: 120,
                  height: 120,
                  cursor: 'pointer',
                  border: '3px dashed',
                  borderColor: 'primary.main',
                  bgcolor: 'grey.100',
                }}
              >
                {!photoPreview && <PhotoCameraIcon sx={{ fontSize: 40 }} />}
              </Avatar>
            </IconButton>
          </label>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Click to upload group photo (optional)
          </Typography>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Group Name"
          value={formData.name}
          onChange={onInputChange('name')}
          helperText="Choose a descriptive name for your group"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Description"
          value={formData.description}
          onChange={onInputChange('description')}
          helperText="Describe the purpose and topics of your group"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel>Group Type</InputLabel>
          <Select
            value={formData.group_type}
            label="Group Type"
            onChange={onInputChange('group_type')}
          >
            <MenuItem value="group_public">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GroupIcon sx={{ mr: 1 }} />
                Public Group
              </Box>
            </MenuItem>
            <MenuItem value="group_private">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GroupIcon sx={{ mr: 1 }} />
                Private Group
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {formData.group_type === 'group_public' 
            ? 'Anyone can discover and request to join'
            : 'Only invited members can join'}
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select
            value={formData.category_id}
            label="Category"
            onChange={onInputChange('category_id')}
          >
            <MenuItem value="">
              <em>No Category</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: 8 }}>{category.icon}</span>
                  {category.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Helps users discover your group
        </Typography>
      </Grid>
    </Grid>
  );
};

export default BasicInfoStep;