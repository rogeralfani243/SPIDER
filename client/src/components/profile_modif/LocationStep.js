import React, { useEffect, useState } from 'react';
import {
  Grid,
  TextField,
  Autocomplete,
  InputAdornment,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  FormHelperText
} from '@mui/material';
import {
  Home,
  LocationOn,
  Apartment,
  Public,
  PinDrop,
  MyLocation,
  CheckCircle,
  Lock
} from '@mui/icons-material';
import { Country, State, City } from 'country-state-city';
import { useGeolocation } from '../../hooks/useGeolocation.js';

const LocationStep = ({ profile, errors, loading, handleInputChange }) => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [locationDetected, setLocationDetected] = useState(false);
  
  // ✅ Hook de géolocalisation
  const { 
    country: detectedCountry, 
    countryCode: detectedCountryCode,
    city: detectedCity,
    region: detectedRegion,
    loading: geoLoading,
    error: geoError,
    source 
  } = useGeolocation();

  /* ---------------- LOAD COUNTRIES ---------------- */
  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  /* ---------------- AUTO-DETECT LOCATION ---------------- */
  useEffect(() => {
    // Si la localisation est détectée et que le pays n'est pas encore défini
    if (detectedCountry && !profile.country && !locationDetected) {
      console.log('📍 Auto-detecting location:', detectedCountry);
      
      // Trouver le pays dans la liste
      const country = countries.find(c => 
        c.name.toLowerCase() === detectedCountry.toLowerCase() ||
        c.isoCode === detectedCountryCode
      );
      
      if (country) {
        // Mettre à jour automatiquement le pays
        handleInputChange({
          target: { name: 'country', value: country.name }
        });
        
        // Si la région/état est détectée
        if (detectedRegion) {
          const state = State.getStatesOfCountry(country.isoCode).find(s =>
            s.name.toLowerCase().includes(detectedRegion.toLowerCase())
          );
          
          if (state) {
            handleInputChange({
              target: { name: 'state', value: state.name }
            });
          }
        }
        
        // Si la ville est détectée
        if (detectedCity) {
          handleInputChange({
            target: { name: 'city', value: detectedCity }
          });
        }
        
        setLocationDetected(true);
      }
    }
  }, [detectedCountry, detectedCountryCode, detectedRegion, detectedCity, countries, profile.country, handleInputChange, locationDetected]);

  /* ---------------- LOAD STATES ---------------- */
  useEffect(() => {
    const selectedCountry = countries.find(
      (c) => c.name === profile.country
    );

    if (selectedCountry) {
      setStates(State.getStatesOfCountry(selectedCountry.isoCode));
      setCities([]);
    } else {
      setStates([]);
      setCities([]);
    }
  }, [profile.country, countries]);

  /* ---------------- LOAD CITIES ---------------- */
  useEffect(() => {
    const selectedCountry = countries.find(
      (c) => c.name === profile.country
    );
    const selectedState = states.find(
      (s) => s.name === profile.state
    );

    if (selectedCountry && selectedState) {
      setCities(
        City.getCitiesOfState(
          selectedCountry.isoCode,
          selectedState.isoCode
        )
      );
    } else {
      setCities([]);
    }
  }, [profile.state, profile.country, countries, states]);

  /* ---------------- HANDLERS ---------------- */
  const handleCountryChange = (_, value) => {
    // ✅ DÉSACTIVÉ - Le pays est automatiquement détecté
    // Ne rien faire - l'utilisateur ne peut pas changer le pays
  };

  const handleStateChange = (_, value) => {
    handleInputChange({
      target: { name: 'state', value: value?.name || '' }
    });
    handleInputChange({
      target: { name: 'city', value: '' }
    });
  };

  const handleCityChange = (_, value) => {
    handleInputChange({
      target: { name: 'city', value: value?.name || '' }
    });
  };

  const handleAddressChange = (e) => {
    handleInputChange(e);
  };

  const handleZipCodeChange = (e) => {
    handleInputChange(e);
  };

  // Trouver le pays sélectionné
  const selectedCountry = countries.find(c => c.name === profile.country);

  return (
    <Grid container spacing={3}>
      {/* Bannière de détection de localisation */}
      <Grid item xs={12}>
        {geoLoading ? (
          <Alert 
            icon={<CircularProgress size={20} />} 
            severity="info"
            sx={{ mb: 2 }}
          >
            Detecting your location...
          </Alert>
        ) : geoError ? (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
          >
            Could not detect your location. Please select manually.
          </Alert>
        ) : detectedCountry ? (
          <Alert 
            icon={<MyLocation />} 
            severity="success"
            sx={{ 
              mb: 2,
              bgcolor: 'success.light',
              color: 'success.contrastText'
            }}
            action={
              <Chip 
                label={`Detected via ${source === 'browser' ? 'GPS' : 'IP'}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
              />
            }
          >
            <Typography variant="body2">
              <strong>📍 Location detected:</strong> {detectedCity && `${detectedCity}, `}
              {detectedRegion && `${detectedRegion}, `}
              {detectedCountry}
            </Typography>
          </Alert>
        ) : null}
      </Grid>

      {/* ADDRESS - Éditable */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Street Address"
          name="address"
          value={profile.address || ''}
          onChange={handleAddressChange}
          error={!!errors.address}
          helperText={errors.address}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Home />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      {/* COUNTRY - AUTO-DÉTECTÉ, NON ÉDITABLE */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Country"
          value={profile.country || (geoLoading ? 'Detecting...' : '')}
          disabled={true} // ✅ TOUJOURS DÉSACTIVÉ
          error={!!errors.country}
          helperText={errors.country || "Automatically detected from your location"}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Public />
              </InputAdornment>
            ),
            endAdornment: profile.country && (
              <InputAdornment position="end">
                <Lock sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
            readOnly: true
          }}
          sx={{
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
              backgroundColor: '#f5f5f5'
            }
          }}
        />
      </Grid>

      {/* STATE / PROVINCE */}
      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={states}
          getOptionLabel={(option) => option.name}
          value={states.find(s => s.name === profile.state) || null}
          onChange={handleStateChange}
          disabled={!profile.country || loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="State / Province"
              error={!!errors.state}
              helperText={errors.state}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
      </Grid>

      {/* CITY */}
      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={cities}
          getOptionLabel={(option) => option.name}
          value={cities.find(c => c.name === profile.city) || null}
          onChange={handleCityChange}
          disabled={!profile.state || loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="City"
              error={!!errors.city}
              helperText={errors.city}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Apartment />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
      </Grid>

      {/* ZIP CODE */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="ZIP / Postal Code"
          name="zip_code"
          value={profile.zip_code || ''}
          onChange={handleZipCodeChange}
          error={!!errors.zip_code}
          helperText={errors.zip_code}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PinDrop />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      {/* Message d'information */}
      {profile.country && (
        <Grid item xs={12}>
          <FormHelperText sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
            Your country has been automatically set to {profile.country} based on your location.
            This helps us provide region-specific content.
          </FormHelperText>
        </Grid>
      )}
    </Grid>
  );
};

export default LocationStep;