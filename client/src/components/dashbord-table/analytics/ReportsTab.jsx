import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { Report, CheckCircle, Pending, Cancel } from '@mui/icons-material';
import CountUp from 'react-countup';

const ReportsTab = ({ reports }) => {
  if (!reports) return null;

  const { overview, made, received } = reports;

  return (
    <Grid container spacing={3}>
      {/* Overview Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Reports Made
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                <CountUp end={overview?.reports_made || 0} duration={2} />
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Reports Received
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                <CountUp end={overview?.reports_received || 0} duration={2} />
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Pending Reports
              </Typography>
              <Box display="flex" alignItems="center">
                <Typography variant="h3" fontWeight="bold" sx={{ mr: 1 }}>
                  <CountUp end={overview?.pending_reports_received || 0} duration={2} />
                </Typography>
                <Pending color="warning" />
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Resolved Reports
              </Typography>
              <Box display="flex" alignItems="center">
                <Typography variant="h3" fontWeight="bold" sx={{ mr: 1 }}>
                  <CountUp end={overview?.resolved_reports_received || 0} duration={2} />
                </Typography>
                <CheckCircle color="success" />
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Reports Made - By Type */}
      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Reports Made by Type
          </Typography>
          <Box sx={{ mt: 2 }}>
            {made?.by_type?.map((item) => (
              <Box
                key={item.report_type}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ py: 1, borderBottom: '1px solid #f0f0f0' }}
              >
                <Typography variant="body2">{item.report_type}</Typography>
                <Chip label={item.count} size="small" color="primary" />
              </Box>
            ))}
          </Box>
        </Card>
      </Grid>

      {/* Reports Received - By Status */}
      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Reports Received by Status
          </Typography>
          <Box sx={{ mt: 2 }}>
            {received?.by_status?.map((item) => (
              <Box
                key={item.status}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ py: 1, borderBottom: '1px solid #f0f0f0' }}
              >
                <Typography variant="body2">{item.status}</Typography>
                <Chip 
                  label={item.count} 
                  size="small" 
                  color={
                    item.status === 'resolved' ? 'success' :
                    item.status === 'pending' ? 'warning' : 'default'
                  } 
                />
              </Box>
            ))}
          </Box>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ReportsTab;