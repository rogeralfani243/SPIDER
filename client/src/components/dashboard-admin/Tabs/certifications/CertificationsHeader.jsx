import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

const CertificationsHeader = ({ activeTab, filteredCertsCount, onRefresh, onClearFilters }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#4F46E5', mb: 1 }}>
          Certifications Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {activeTab === 0 ? `${filteredCertsCount} certifications found` : 'Analytics & Insights'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          sx={{ borderColor: '#4F46E5', color: '#4F46E5' }}
        >
          Refresh
        </Button>
        {activeTab === 0 && (
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default CertificationsHeader;