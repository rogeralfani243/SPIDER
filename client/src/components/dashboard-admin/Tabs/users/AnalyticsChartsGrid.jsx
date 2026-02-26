import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import {
  PieChart as PieChartIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { COLORS } from './UserGraphiq';
import PieChartComponent from './PieChartComponent';

const AnalyticsChartsGrid = ({ 
  statusData, 
  activityData, 
  geoData, 
  geoType, 
  onGeoTypeChange,
  statusChartRef,
  activityChartRef,
  geoChartRef 
}) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={4}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: 'divider',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
          ref={statusChartRef}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PieChartIcon sx={{ color: COLORS.purple }} /> User Status
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ flex: 1, width:'600px',height:'280px', '@media(max-width:946px)':{width:'350px'} }}>
            <PieChartComponent data={statusData} height={280} />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: 'divider',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
          ref={activityChartRef}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PieChartIcon sx={{ color: COLORS.success }} /> User Activity
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ flex: 1, width:'600px',height:'280px', '@media(max-width:946px)':{width:'350px'} }}>
            <PieChartComponent data={activityData}  height={400} />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: 'divider',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
          ref={geoChartRef}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PublicIcon sx={{ color: COLORS.teal }} /> Geographic
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select 
                value={geoType} 
                onChange={onGeoTypeChange}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="country">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PublicIcon fontSize="small" /> Country
                  </Box>
                </MenuItem>
                <MenuItem value="city">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" /> City
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ flex: 1 }}>
            <PieChartComponent data={geoData} height={280} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AnalyticsChartsGrid;