import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Divider
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { COLORS } from './UserGraphiq';

const RegistrationChart = ({ 
  timeData, 
  timeRange, 
  chartType, 
  onTimeRangeChange, 
  onChartTypeChange,
  chartRef 
}) => {
  const renderRegistrationChart = () => {
    if (!timeData.length) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
          <Typography color="text.secondary">No registration data available</Typography>
        </Box>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
            />
            <RechartsTooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: 'none'
              }} 
            />
            <Legend 
              wrapperStyle={{ paddingTop: 20 }}
              iconType="circle"
            />
            <Bar dataKey="total" fill={COLORS.primary} name="Total Users" radius={[4, 4, 0, 0]} />
            <Bar dataKey="active" fill={COLORS.success} name="Active" radius={[4, 4, 0, 0]} />
            <Bar dataKey="inactive" fill={COLORS.warning} name="Inactive" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <RechartsTooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              borderRadius: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: 'none'
            }} 
          />
          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            iconType="circle"
          />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke={COLORS.primary} 
            name="Total Users" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="active" 
            stroke={COLORS.success} 
            name="Active" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="inactive" 
            stroke={COLORS.warning} 
            name="Inactive" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: 3, 
        border: '1px solid', 
        borderColor: 'divider'
      }} 
      ref={chartRef}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChartIcon sx={{ color: COLORS.primary }} /> User Registrations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            New user sign-ups over time
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={onTimeRangeChange}
            size="small"
            sx={{ bgcolor: 'background.paper' }}
          >
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="year">Year</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={onChartTypeChange}
            size="small"
            sx={{ bgcolor: 'background.paper' }}
          >
            <ToggleButton value="bar">
              <BarChartIcon />
            </ToggleButton>
            <ToggleButton value="line">
              <LineChartIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>
      <Divider sx={{ mb: 3 }} />
      {renderRegistrationChart()}
    </Paper>
  );
};

export default RegistrationChart;