import React from 'react';
import { Card, CardContent, Typography, Avatar, Box } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';

const StatCard = ({ title, value, subtitle, icon, color, trend, trendValue }) => {
  return (
    <Card sx={{ 
      height: '100%', 
      borderRadius: 2,
      borderTop: `3px solid ${color}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 20px -10px rgba(0,0,0,0.1)'
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: color, mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
            {trend === 'up' ? (
              <TrendingUpIcon sx={{ color: '#10B981', fontSize: 16 }} />
            ) : (
              <TrendingDownIcon sx={{ color: '#EF4444', fontSize: 16 }} />
            )}
            <Typography variant="caption" sx={{ 
              color: trend === 'up' ? '#10B981' : '#EF4444',
              fontWeight: 600
            }}>
              {trendValue}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              vs last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;