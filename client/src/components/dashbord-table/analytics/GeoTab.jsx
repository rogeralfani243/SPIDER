

import React, { useState } from 'react';
import { Grid, Card, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { BarChart, TableChart, Map as MapIcon, SaveAlt, People } from '@mui/icons-material';
import GeoChart from './GeoChart';
import GeoTable from './GeoTable';
import TopContributors from './TopContributors';
import { downloadChartAsPNG } from './downloadHelpers';
const GeoTab = ({ geographical, chartRefs, filters }) => {
  const [geoView, setGeoView] = useState('chart');
  
  if (!geographical) return null;

  const { 
    comments_by_country, 
    ratings_by_country, 
    feedback_by_country, 
    comments_by_city, 
    world_map_data 
  } = geographical;

  const handleDownloadChart = async (chartRef, filename) => {
    try {
        await downloadChartAsPNG(chartRef, filename);

    }catch (error) {
        console.error('Error downloading chart:', error);
    }

  }
  // Apply filters
  const filterGeoData = (data) => {
    if (!data) return [];
    let filtered = [...data];
    
    if (filters.selectedCountries.length > 0) {
      filtered = filtered.filter(item => 
        filters.selectedCountries.includes(item.user__profile__country)
      );
    }
    if (filters.minInteractions > 1) {
      filtered = filtered.filter(item => 
        (item.count || 0) >= filters.minInteractions
      );
    }
    return filtered;
  };

  const filteredComments = filterGeoData(comments_by_country);
  const filteredRatings = filterGeoData(ratings_by_country);
  const filteredFeedback = filterGeoData(feedback_by_country);
  const filteredCities = filterGeoData(comments_by_city);

  // Prepare chart data
  const topCountries = [...filteredComments, ...filteredRatings, ...filteredFeedback]
    .reduce((acc, item) => {
      const country = item.user__profile__country;
      if (!country) return acc;
      if (!acc[country]) {
        acc[country] = { comments: 0, ratings: 0, feedback: 0, total: 0 };
      }
      acc[country].comments += item.count || 0;
      acc[country].ratings += item.count || 0;
      acc[country].feedback += item.count || 0;
      acc[country].total += item.count || 0;
      return acc;
    }, {});

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={8}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }} ref={chartRefs.geo}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Geographical Distribution
            </Typography>
            <Box>
              <Tooltip title="Bar Chart">
                <IconButton size="small" onClick={() => setGeoView('chart')}>
                  <BarChart color={geoView === 'chart' ? 'primary' : 'inherit'} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Table View">
                <IconButton size="small" onClick={() => setGeoView('table')}>
                  <TableChart color={geoView === 'table' ? 'primary' : 'inherit'} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Map View">
                <IconButton size="small" onClick={() => setGeoView('map')}>
                  <MapIcon color={geoView === 'map' ? 'primary' : 'inherit'} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download as PNG">
                <IconButton size="small" onClick={() => handleDownloadChart(chartRefs.geo, 'geographical_distribution')}>
                  <SaveAlt />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Box sx={{ height: 420, position: 'relative' }}>
            {geoView === 'chart' && (
              <GeoChart topCountries={topCountries} />
            )}
            {geoView === 'table' && (
              <GeoTable 
                topCountries={topCountries} 
                filteredCities={filteredCities} 
              />
            )}
            {geoView === 'map' && (
              <Box sx={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Map view requires integration with mapping libraries
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2, height: 500, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            <People sx={{ mr: 1, verticalAlign: 'middle' }} />
            Top Contributors
          </Typography>
          <TopContributors worldMapData={world_map_data} />
        </Card>
      </Grid>
    </Grid>
  );
};

export default GeoTab;