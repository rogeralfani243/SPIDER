import React, { useState, useRef } from 'react';
import { Typography, Box, Grid, Button, CircularProgress, Alert } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

import DownloadDialog from './/DownloadDialog';
import AnalyticsKPI from './AnalyticsKPI';
import CreationTrendsChart from './CreationTrendsChart';
import TypeDistributionChart from './TypeDistributionChart';
import StatusDistributionChart from './StatusDistributionChart';
import GeographicCharts from './GeographicCharts';
import GroupSizesChart from './GroupSizesChart';
import TopGroupsTable from './TopGroupsTable';

const GroupsAnalyticsTab = ({ analyticsData, loading, onRefresh }) => {
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  
  // Chart references for download
  const creationChartRef = useRef(null);
  const typesChartRef = useRef(null);
  const geographicChartRef = useRef(null);
  const statusChartRef = useRef(null);
  const sizesChartRef = useRef(null);

  const handleDownload = async (chartSelection, format, quality) => {
    try {
      const scale = quality === 1 ? 2 : quality === 2 ? 3 : 4;
      const charts = [];
      
      if (chartSelection === 'all' || chartSelection === 'creation') {
        if (creationChartRef.current) charts.push({ ref: creationChartRef, name: 'group-creation-trends' });
      }
      if (chartSelection === 'all' || chartSelection === 'types') {
        if (typesChartRef.current) charts.push({ ref: typesChartRef, name: 'group-types-distribution' });
      }
      if (chartSelection === 'all' || chartSelection === 'geographic') {
        if (geographicChartRef.current) charts.push({ ref: geographicChartRef, name: 'geographic-distribution' });
      }
      if (chartSelection === 'all' || chartSelection === 'engagement') {
        if (statusChartRef.current) charts.push({ ref: statusChartRef, name: 'status-distribution' });
      }
      if (chartSelection === 'all' || chartSelection === 'sizes') {
        if (sizesChartRef.current) charts.push({ ref: sizesChartRef, name: 'group-sizes' });
      }

      for (const chart of charts) {
        const canvas = await html2canvas(chart.ref.current, {
          scale: scale,
          backgroundColor: '#ffffff',
          allowTaint: true,
          useCORS: true,
          logging: false
        });
        
        canvas.toBlob((blob) => {
          saveAs(blob, `${chart.name}-${new Date().toISOString().split('T')[0]}.${format}`);
        }, `image/${format}`);
      }
    } catch (err) {
      console.error('Error downloading charts:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#4F46E5' }} />
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No analytics data available
      </Alert>
    );
  }

  const { 
    summary, 
    creation_trends, 
    type_distribution, 
    status_distribution, 
    country_stats, 
    city_stats, 
    top_groups, 
    group_sizes, 
    growth_metrics 
  } = analyticsData;

  return (
    <Box>
      {/* Header with download button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => setDownloadDialogOpen(true)}
          sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
        >
          Download Charts
        </Button>
      </Box>

      {/* KPI Cards */}
      <AnalyticsKPI summary={summary} />

      {/* Growth Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Growth Metrics
          </Typography>
        </Grid>
        <Grid item xs={4} sm={4} md={4}>
          <Box sx={{ bgcolor: '#EEF2FF', p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">Today</Typography>
            <Typography variant="h6" sx={{ color: '#4F46E5', fontWeight: 700 }}>
              +{growth_metrics?.today?.new_groups || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {growth_metrics?.today?.active_groups || 0} active
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4} sm={4} md={4}>
          <Box sx={{ bgcolor: '#F0FDF4', p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">This Week</Typography>
            <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 700 }}>
              +{growth_metrics?.this_week?.new_groups || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {growth_metrics?.this_week?.active_groups || 0} active
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4} sm={4} md={4}>
          <Box sx={{ bgcolor: '#FFFBEB', p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">This Month</Typography>
            <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 700 }}>
              +{growth_metrics?.this_month?.new_groups || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {growth_metrics?.this_month?.active_groups || 0} active
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Group Creation Trends Chart */}
      <CreationTrendsChart ref={creationChartRef} data={creation_trends} />

      {/* Group Types and Status Distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TypeDistributionChart 
            ref={typesChartRef} 
            data={type_distribution} 
            totalGroups={summary?.total_groups} 
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <StatusDistributionChart ref={statusChartRef} data={status_distribution} />
        </Grid>
      </Grid>

      {/* Geographic Distribution */}
      <GeographicCharts 
        ref={geographicChartRef}
        countryStats={country_stats} 
        cityStats={city_stats} 
      />

      {/* Group Sizes and Top Groups */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <GroupSizesChart ref={sizesChartRef} data={group_sizes} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TopGroupsTable data={top_groups} />
        </Grid>
      </Grid>

      {/* Download Dialog */}
      <DownloadDialog
        open={downloadDialogOpen}
        onClose={() => setDownloadDialogOpen(false)}
        onDownload={handleDownload}
      />
    </Box>
  );
};

export default GroupsAnalyticsTab;