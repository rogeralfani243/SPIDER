// src/components/groups/steps/DetailsStep.jsx
import React from 'react';
import {
  Grid,
  Typography,
  TextField,
  Box,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  Rule as RuleIcon,
} from '@mui/icons-material';

/**
 * Step 3: Additional Details
 * Handles tags, location, website, and group rules
 */
const DetailsStep = ({
  formData,
  tagInput,
  onInputChange,
  onAddTag,
  onRemoveTag,
  onTagInputChange,
  onTagKeyPress,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>
          Tags
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TextField
            fullWidth
            value={tagInput}
            onChange={onTagInputChange}
            onKeyPress={onTagKeyPress}
            placeholder="Add tags (press Enter)"
            size="small"
          />
          <IconButton
            onClick={onAddTag}
            disabled={!tagInput.trim()}
            sx={{ ml: 1 }}
          >
            <AddIcon />
          </IconButton>
        </Box>
        
        {formData.tags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {formData.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => onRemoveTag(tag)}
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        )}
        <Typography variant="caption" color="text.secondary">
          Tags help users discover your group (max 10 tags)
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Location"
          value={formData.location}
          onChange={onInputChange('location')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationIcon />
              </InputAdornment>
            ),
          }}
          placeholder="e.g., Paris, France"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Website"
          value={formData.website}
          onChange={onInputChange('website')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LanguageIcon />
              </InputAdornment>
            ),
          }}
          placeholder="https://example.com"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={6}
          label="Group Rules"
          value={formData.rules}
          onChange={onInputChange('rules')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                <RuleIcon />
              </InputAdornment>
            ),
          }}
          placeholder="List the rules for your group members..."
          helperText="Clear rules help maintain a positive community"
        />
      </Grid>
    </Grid>
  );
};

export default DetailsStep;