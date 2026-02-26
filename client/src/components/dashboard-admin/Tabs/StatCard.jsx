
import React from 'react';
import {
  Card, CardContent, Typography, Box
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color, trend }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h3" component="div" sx={{ color }}>
            {value}
          </Typography>
          <Box sx={{ color, fontSize: 40 }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {trend > 0 ? (
              <TrendingUpIcon sx={{ color: '#4caf50', mr: 0.5 }} />
            ) : (
              <TrendingDownIcon sx={{ color: '#f44336', mr: 0.5 }} />
            )}
            <Typography variant="body2" color="text.secondary">
              {trend > 0 ? '+' : ''}{trend}% from last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;