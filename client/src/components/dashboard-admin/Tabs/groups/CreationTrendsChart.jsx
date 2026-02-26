import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Timeline as TimelineIcon } from '@mui/icons-material';
import {
  ComposedChart, Line, Bar, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const CreationTrendsChart = React.forwardRef(({ data }, ref) => {
  return (
    <Paper ref={ref} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <TimelineIcon sx={{ color: '#4F46E5' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Group Creation Trends
        </Typography>
      </Box>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="period" />
          <YAxis yAxisId="left" orientation="left" stroke="#4F46E5" />
          <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
          <Tooltip />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="new_groups"
            name="New Groups"
            stroke="#4F46E5"
            fill="#4F46E5"
            fillOpacity={0.1}
          />
          <Bar
            yAxisId="right"
            dataKey="public_groups"
            name="Public Groups"
            fill="#10B981"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Bar
            yAxisId="right"
            dataKey="private_groups"
            name="Private Groups"
            fill="#4F46E5"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="active_groups"
            name="Active Groups"
            stroke="#F59E0B"
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );
});

export default CreationTrendsChart;