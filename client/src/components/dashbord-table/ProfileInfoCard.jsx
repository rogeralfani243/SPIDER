// src/components/ProfileInfoCard.jsx
import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Grid,
  Chip,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
  Cake as BirthdayIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const ProfileInfoCard = ({ user, profile, stats }) => {
  const theme = useTheme();
  
  const infoSections = [
    {
      title: 'Basic Information',
      icon: <PersonIcon />,
      items: [
        { label: 'Username', value: user?.username, icon: '@' },
        { label: 'Email', value: user?.email, icon: <EmailIcon fontSize="small" /> },
        { label: 'Full Name', value: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(), icon: <PersonIcon fontSize="small" /> },
      ]
    },
    {
      title: 'Profile Details',
      icon: <PersonIcon />,
      items: [
        { label: 'Location', value: profile?.location, icon: <LocationIcon fontSize="small" /> },
        { label: 'Website', value: profile?.website, icon: <WebsiteIcon fontSize="small" /> },
        { label: 'Birth Date', value: profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString() : null, icon: <BirthdayIcon fontSize="small" /> },
      ].filter(item => item.value)
    },
    {
      title: 'Account Information',
      icon: <CalendarIcon />,
      items: [
        { label: 'Joined', value: user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : null, icon: <CalendarIcon fontSize="small" /> },
        { label: 'Last Login', value: user?.last_login ? new Date(user.last_login).toLocaleDateString() : null, icon: <AccessTimeIcon fontSize="small" /> },
        { label: 'Status', value: user?.is_active ? 'Active' : 'Inactive', icon: <Chip size="small" label={user?.is_active ? 'Active' : 'Inactive'} color={user?.is_active ? 'success' : 'error'} /> },
      ].filter(item => item.value)
    }
  ];

  return (
    <Box>
      {infoSections.map((section, sectionIndex) => (
        <Box key={sectionIndex} mb={sectionIndex < infoSections.length - 1 ? 3 : 0}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            {section.icon}
            <Typography variant="subtitle1" fontWeight="600">
              {section.title}
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {section.items.map((item, itemIndex) => (
              <Grid item xs={12} sm={6} key={itemIndex}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ color: 'text.secondary', minWidth: 24 }}>
                    {item.icon}
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {item.label}
                    </Typography>
                    {typeof item.value === 'string' || typeof item.value === 'number' ? (
                      <Typography variant="body2" fontWeight="500">
                        {item.value}
                      </Typography>
                    ) : (
                      item.value
                    )}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
          
          {sectionIndex < infoSections.length - 1 && (
            <Divider sx={{ mt: 3 }} />
          )}
        </Box>
      ))}
      
      {/* Profile Completion Progress */}
      {stats?.profile?.completion !== undefined && (
        <Box mt={3} p={2} bgcolor="action.hover" borderRadius={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" fontWeight="500">
              Profile Completion
            </Typography>
            <Typography variant="body2" fontWeight="600" color="primary">
              {Math.round(stats.profile.completion)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={stats.profile.completion}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" mt={1} display="block">
            Complete your profile to unlock all features
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProfileInfoCard;