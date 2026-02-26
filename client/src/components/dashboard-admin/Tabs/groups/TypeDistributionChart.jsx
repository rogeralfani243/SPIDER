import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { PieChart as PieChartIcon } from '@mui/icons-material';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#10B981', '#4F46E5'];
const GROUP_TYPE_COLORS = {
  group_public: '#10B981',
  group_private: '#4F46E5'
};

const TypeDistributionChart = React.forwardRef(({ data, totalGroups }, ref) => {
  // Transform data for pie chart
  const pieData = data?.map(item => ({
    name: item.group_type === 'group_public' ? 'Public' : 'Private',
    value: item.count,
    color: GROUP_TYPE_COLORS[item.group_type]
  })) || [];

  return (
    <Paper ref={ref} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <PieChartIcon sx={{ color: '#4F46E5' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Group Types Distribution
        </Typography>
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            dataKey="value"
            nameKey="name"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <Box sx={{ mt: 2 }}>
        {data?.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: GROUP_TYPE_COLORS[item.group_type] || COLORS[index % COLORS.length] 
              }} />
              <Typography variant="body2">
                {item.group_type === 'group_public' ? 'Public' : 'Private'}
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={600}>
              {item.count} ({((item.count / totalGroups) * 100).toFixed(1)}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
});

export default TypeDistributionChart;