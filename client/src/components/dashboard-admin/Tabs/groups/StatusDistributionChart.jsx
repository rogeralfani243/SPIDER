import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { BarChart as BarChartIcon } from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const StatusDistributionChart = React.forwardRef(({ data }, ref) => {
  // Transform data for chart
  const chartData = [
    { name: 'Active', count: data?.find(d => d.status === 'active')?.count || 0 },
    { name: 'Inactive', count: data?.find(d => d.status === 'inactive')?.count || 0 }
  ];

  return (
    <Paper ref={ref} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <BarChartIcon sx={{ color: '#4F46E5' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Status Distribution
        </Typography>
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="Groups" fill="#4F46E5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={1}>
          {chartData.map((item, index) => (
            <Grid item xs={6} key={index}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f9fafb', borderRadius: 1 }}>
                <Typography variant="caption" display="block" color="text.secondary">
                  {item.name}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {item.count}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
});

export default StatusDistributionChart;