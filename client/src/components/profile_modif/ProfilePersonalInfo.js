import React from 'react';
import {
  Grid,
  Box,
  Typography,
  TextField,
  Avatar,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material';

const PersonalInfoStep = ({ profile, errors, loading, previewImage, handleInputChange, handleImageChange }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="profile-image-upload"
            type="file"
            onChange={handleImageChange}
          />
          <label htmlFor="profile-image-upload">
            <IconButton component="span">
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  border: `3px solid`,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
                src={previewImage}
              >
                {!previewImage && <CameraIcon sx={{ fontSize: 40 }} />}
              </Avatar>
            </IconButton>
          </label>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            Click to change profile photo
          </Typography>
        </Box>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="First Name"
          name="first_name"
          value={profile.first_name}
          onChange={handleInputChange}
          error={!!errors.first_name}
          helperText={errors.first_name}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Last Name"
          name="last_name"
          value={profile.last_name}
          onChange={handleInputChange}
          error={!!errors.last_name}
          helperText={errors.last_name}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={profile.email}
          onChange={handleInputChange}
          error={!!errors.email}
          helperText={errors.email}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number"
          name="phone"
          value={profile.phone || ''}
          onChange={handleInputChange}
          error={!!errors.phone}
          helperText={errors.phone}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Birth Date"
          name="birth_date"
          type="date"
          value={profile.birth_date}
          onChange={handleInputChange}
          error={!!errors.birth_date}
          helperText={errors.birth_date}
          disabled={loading}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
    </Grid>
  );
};

export default PersonalInfoStep;