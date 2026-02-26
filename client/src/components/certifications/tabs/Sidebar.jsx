// components/Sidebar.jsx
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Verified as VerifiedIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Whatshot as FireIcon,
  TrendingUp as InfluencerIcon,
  Diamond as CrownIcon,
} from '@mui/icons-material';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(3),
}));

const Sidebar = ({ verificationStatus, fireEligibility }) => {
  const getCertificationProgress = () => {
    return [
      { 
        name: 'Verified', 
        value: verificationStatus?.status === 'approved' ? 100 : 0, 
        color: 'primary',
        icon: <VerifiedIcon /> 
      },
      { 
        name: 'Fire', 
        value: fireEligibility?.status === 'success' ? 100 : (fireEligibility?.score || 0), 
        color: 'error',
        icon: <FireIcon />
      },
      { 
        name: 'Influencer', 
        value: 0, 
        color: 'secondary',
        icon: <InfluencerIcon />
      },
      { 
        name: 'Premium', 
        value: 0, 
        color: 'warning',
        icon: <CrownIcon />
      },
    ];
  };

  return (
    <Box sx={{ position: 'sticky', top: 24 }}>
      {/* Quick Stats */}
      <StyledCard>
        <CardHeader
          title={<Typography variant="h6" fontWeight="bold">Certification Progress</Typography>}
        />
        <CardContent>
          {getCertificationProgress().map((cert, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                <Box sx={{ color: `${cert.color}.main` }}>
                  {cert.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">{cert.name}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {Math.min(cert.value, 100)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(cert.value, 100)} 
                color={cert.color}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ))}
        </CardContent>
      </StyledCard>



      {/* Benefits Card */}
      <StyledCard>
        <CardHeader
          title={<Typography variant="h6" fontWeight="bold">Benefits</Typography>}
        />
        <CardContent>
          <List disablePadding>
            {[
              'Increased credibility',
              'Enhanced visibility',
              'Access to exclusive features',
              'Priority support'
            ].map((benefit, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={benefit}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </StyledCard>
    </Box>
  );
};

export default Sidebar;