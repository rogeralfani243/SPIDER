// components/premium/UpgradeButton.jsx
import React from 'react';
import { Button, Chip, Box, Typography, Tooltip } from '@mui/material';
import { WorkspacePremium, Star, Verified } from '@mui/icons-material';
import { usePremiumStatus } from '../../../hooks/usePremiumStatus';

const UpgradeButton = ({ setActiveTab,variant = 'contained', size = 'small', showBadge = true }) => {
  const { isPremium, loading, daysRemaining, handleUpgrade } = usePremiumStatus();

  if (loading) {
    return (
      <Button 
        variant="outlined" 
        size={size} 
        disabled
        sx={{ opacity: 0.7 }}
      >
        Checking...
      </Button>
    );
  }

  // Si l'utilisateur est déjà premium
  if (isPremium) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Tooltip title={`Premium • ${daysRemaining} days remaining`}>
          <Chip
            icon={<Verified sx={{ color: '#ffd700 !important' }} />}
            label="PREMIUM"
            size="small"
            sx={{
              bgcolor: 'rgba(255, 215, 0, 0.1)',
              color: '#b8860b',
              fontWeight: 'bold',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              '& .MuiChip-icon': { color: '#ffd700' }
            }}
          />
        </Tooltip>
        {daysRemaining <= 7 && (
          <Button
            variant="text"
            size="small"
      onClick={() => setActiveTab(7)}
            sx={{ color: 'primary.main', fontSize: '0.75rem' }}
          >
            Renew
          </Button>
        )}
      </Box>
    );
  }

  // Si l'utilisateur n'est pas premium - Afficher le bouton d'upgrade
  return (
    <Button
      variant={variant}
      size={size}
      startIcon={<WorkspacePremium />}
           onClick={() => setActiveTab(7)}
      sx={{
        bgcolor: variant === 'contained' ? '#ffd700' : 'transparent',
        color: variant === 'contained' ? '#000' : '#ffd700',
        borderColor: '#ffd700',
        '&:hover': {
          bgcolor: variant === 'contained' ? '#ffc800' : 'rgba(255, 215, 0, 0.04)',
          borderColor: '#ffc800',
        },
        fontWeight: 600,
        ...(variant === 'outlined' && {
          border: '1px solid',
          '&:hover': {
            borderColor: '#ffc800',
          }
        })
      }}
    >
      {size === 'small' ? 'Upgrade' : 'Upgrade to Premium'}
    </Button>
  );
};

export default UpgradeButton;