import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  alpha
} from '@mui/material';
import {
  FilterList as FilterIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const ActivityFilters = ({ 
  activityTypes, 
  filter, 
  onFilterChange,
  getActivityLabel 
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Header avec titre et badge de filtre actif */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 1.5 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 1,
              bgcolor: alpha('#e54646ff', 0.08),
              color: '#e54646ff'
            }}
          >
            <FilterIcon sx={{ fontSize: 16 }} />
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 600, 
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.7rem'
            }}
          >
            Filter Activities
          </Typography>
        </Box>

        {filter && filter !== 'all' && (
          <Button
            size="small"
            onClick={() => onFilterChange('all')}
            sx={{
              minWidth: 'auto',
              height: 24,
              px: 1,
              fontSize: '0.7rem',
              fontWeight: 500,
              color: 'text.disabled',
              textTransform: 'none',
              '&:hover': {
                color: '#EF4444',
                bgcolor: alpha('#EF4444', 0.04)
              }
            }}
          >
            ✕ Clear filter
          </Button>
        )}
      </Box>

      {/* Filter Chips Container */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap',
          p: 1.5,
          bgcolor: '#F8FAFC',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: alpha('#e54646ff', 0.3),
            bgcolor: '#FFFFFF'
          }
        }}
      >
        {activityTypes.map((type) => {
          const isActive = filter === type.key;
          
          return (
            <Chip
              key={type.key}
              icon={type.icon}
              label={type.label}
              onClick={() => onFilterChange(type.key)}
              size="small"
              sx={{
                height: 32,
                px: 0.5,
                borderRadius: 1.5,
                fontWeight: 500,
                fontSize: '0.75rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                
                // Style actif
                ...(isActive && {
                  background: 'linear-gradient(135deg, #e54646ff 0%, #7e0c04ff 100%)',
                  color: 'white',
                  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
                  border: 'none',
                  '& .MuiChip-icon': {
                    color: 'white !important',
                  },
                  '&:hover': {
                    background: 'linear-gradient(135deg,  #e54646ff 0%, #7e0c04ff 100%)',
                    boxShadow: '0 6px 14px rgba(79, 70, 229, 0.35)',
                    transform: 'translateY(-1px)',
                  }
                }),
                
                // Style inactif
                ...(!isActive && {
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: alpha('#e54646ff', 0.15),
                  color: '#64748B',
                  '& .MuiChip-icon': {
                    color: alpha('#e54646ff', 0.7),
                    transition: 'color 0.2s ease',
                  },
                  '&:hover': {
                    bgcolor: alpha('#e54646ff', 0.04),
                    borderColor: alpha('#e54646ff', 0.4),
                    color: '#c03737ff',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    '& .MuiChip-icon': {
                      color: '#e54646ff',
                    }
                  }
                })
              }}
            />
          );
        })}
      </Box>

      {/* Active Filter Indicator */}
      {filter && filter !== 'all' && (
        <Box 
          sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 1, 
            mt: 1.5,
            px: 1.5,
            py: 0.8,
            bgcolor: alpha('#e54646ff', 0.04),
            borderRadius: 1.5,
            borderLeft: '3px solid',
            borderLeftColor: '#e54646ff',
            animation: 'slideIn 0.2s ease',
            '@keyframes slideIn': {
              from: {
                opacity: 0,
                transform: 'translateX(-10px)'
              },
              to: {
                opacity: 1,
                transform: 'translateX(0)'
              }
            }
          }}
        >
          <FilterIcon sx={{ fontSize: 14, color: '#e54646ff' }} />
          <Typography variant="caption" sx={{ color: '#e54646ff', fontWeight: 600 }}>
            Active:
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 500 }}>
            {activityTypes.find(t => t.key === filter)?.label || filter}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', ml: 0.5 }}>
            • {filter} activities
          </Typography>
        </Box>
      )}

      {/* Divider subtil */}
      <Divider 
        sx={{ 
          mt: 3,
          borderColor: alpha('#e54646ff', 0.1),
          '&::after': {
            content: '""',
            display: 'block',
            width: 50,
            height: 2,
            bgcolor: alpha('#e54646ff', 0.2),
            borderRadius: 1,
            mt: -0.5
          }
        }} 
      />
    </Box>
  );
};

ActivityFilters.propTypes = {
  activityTypes: PropTypes.array.isRequired,
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  getActivityLabel: PropTypes.func.isRequired
};

export default ActivityFilters;