import React, { useEffect, useState } from 'react';
import {
  Grid,
  TextField,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  Home,
  LocationOn,
  Apartment,
  Public,
  PinDrop,
} from '@mui/icons-material';

import { Country, State, City } from 'country-state-city';

const LocationStep = ({ profile, errors, loading, handleInputChange }) => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  /* ---------------- LOAD COUNTRIES ---------------- */
  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

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

  /* ---------------- HANDLERS (STRING ONLY) ---------------- */
  const handleCountryChange = (_, value) => {
    handleInputChange({
      target: { name: 'country', value: value?.name || '' },
    });
    handleInputChange({
      target: { name: 'state', value: '' },
    });
    handleInputChange({
      target: { name: 'city', value: '' },
    });
  };

  const handleStateChange = (_, value) => {
    handleInputChange({
      target: { name: 'state', value: value?.name || '' },
    });
    handleInputChange({
      target: { name: 'city', value: '' },
    });
  };

  const handleCityChange = (_, value) => {
    handleInputChange({
      target: { name: 'city', value: value?.name || '' },
    });
  };

  return (
    <Grid container spacing={3}>
      {/* ADDRESS */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Street Address"
          name="address"
          value={profile.address || ''}
          onChange={handleInputChange}
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

      {/* COUNTRY */}
      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={countries}
          getOptionLabel={(option) => option.name}
          value={countries.find(c => c.name === profile.country) || null}
          onChange={handleCountryChange}
          disabled={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Country"
              error={!!errors.country}
              helperText={errors.country}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Public />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
      </Grid>

      {/* STATE */}
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
          onChange={handleInputChange}
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
    </Grid>
  );
};

export default LocationStep;
