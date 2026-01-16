// src/components/StatsCard.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Avatar,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const IconAvatar = styled(Avatar)(({ theme, bgcolor }) => ({
  backgroundColor: `${bgcolor}20`,
  color: bgcolor,
  width: 56,
  height: 56,
}));

const TrendIndicator = ({ value }) => {
  const isPositive = parseFloat(value) > 0;
  
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {isPositive ? (
        <TrendingUp sx={{ color: '#10B981', fontSize: 16 }} />
      ) : (
        <TrendingDown sx={{ color: '#EF4444', fontSize: 16 }} />
      )}
      <Typography
        variant="caption"
        sx={{
          color: isPositive ? '#10B981' : '#EF4444',
          fontWeight: 500,
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
};

const StatsCard = ({ title, value, icon, color, trend, progress }) => {
  return (
    <StyledCard elevation={2}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  letterSpacing: 0.5,
                }}
              >
                {title}
              </Typography>
              <Typography variant="h4" fontWeight="700" sx={{ mt: 1 }}>
                {value.toLocaleString()}
              </Typography>
            </Box>
            <IconAvatar bgcolor={color}>
              {icon}
            </IconAvatar>
          </Box>
          
          {trend && (
            <Box>
              <TrendIndicator value={trend} />
            </Box>
          )}
          
          {progress !== undefined && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: `${color}20`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: color,
                  },
                }}
              />
            </Box>
          )}
        </Stack>
      </CardContent>
    </StyledCard>
  );
};

export default StatsCard;