import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { BarChart as BarChartIcon } from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const GroupSizesChart = React.forwardRef(({ data }, ref) => {
  return (
    <Paper ref={ref} sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <BarChartIcon sx={{ color: '#4F46E5' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Group Size Distribution
        </Typography>
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="range" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" name="Groups" fill="#4F46E5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
});

export default GroupSizesChart;