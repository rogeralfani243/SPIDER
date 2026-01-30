import React from 'react';
import {
  Grid,
  TextField,
  FormHelperText,
  InputAdornment,
} from '@mui/material';
import {
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  LocationOn as LocationIcon,
  PinDrop as PinDropIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

const LocationStep = ({ profile, errors, loading, handleInputChange }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Street Address"
          name="address"
          value={profile.address}
          onChange={handleInputChange}
          error={!!errors.address}
          helperText={errors.address}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <HomeIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="City"
          name="city"
          value={profile.city}
          onChange={handleInputChange}
          error={!!errors.city}
          helperText={errors.city}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ApartmentIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="State/Province"
          name="state"
          value={profile.state}
          onChange={handleInputChange}
          error={!!errors.state}
          helperText={errors.state}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="ZIP/Postal Code"
          name="zip_code"
          value={profile.zip_code}
          onChange={handleInputChange}
          error={!!errors.zip_code}
          helperText={errors.zip_code}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PinDropIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Country"
          name="country"
          value={profile.country}
          onChange={handleInputChange}
          error={!!errors.country}
          helperText={errors.country}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PublicIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="General Location (Optional)"
          name="location"
          value={profile.location}
          onChange={handleInputChange}
          error={!!errors.location}
          helperText={errors.location}
          disabled={loading}
          placeholder="City, Country"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <BusinessIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <FormHelperText>
          This field is kept for compatibility
        </FormHelperText>
      </Grid>
    </Grid>
  );
};

export default LocationStep;