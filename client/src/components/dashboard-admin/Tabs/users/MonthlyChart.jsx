import React from 'react';
import {
  Box,
  Typography
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { COLORS } from './UserGraphiq';

const MonthlyChart = ({ data }) => {
  if (!data.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
        <Typography color="text.secondary">No monthly data available</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <RechartsTooltip />
        <Area 
          type="monotone" 
          dataKey="count" 
          stroke={COLORS.primary} 
          fillOpacity={1} 
          fill="url(#colorMonthly)" 
          name="New Users"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default MonthlyChart;