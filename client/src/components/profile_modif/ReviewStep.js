import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Divider,
  Box,
  Chip,
} from '@mui/material';
import { getPlatformIcon, getPlatformLabel } from '../../utils/constants';

const ReviewStep = ({ profile, previewImageBio }) => {
  const reviewSocialLinks = Array.isArray(profile.social_links) ? profile.social_links : [];

  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50' }}>
      <Typography variant="h6" gutterBottom color="primary">
        Review Your Information
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary">Personal Information</Typography>
          <Typography variant="body1">
            {profile.first_name} {profile.last_name}
          </Typography>
          <Typography variant="body2" color="textSecondary">{profile.email}</Typography>
          {profile.phone && (
            <Typography variant="body2" color="textSecondary">
              Phone: {profile.phone}
            </Typography>
          )}
          {profile.birth_date && (
            <Typography variant="body2" color="textSecondary">
              Born: {new Date(profile.birth_date).toLocaleDateString()}
            </Typography>
          )}
        </Grid>
        
        {reviewSocialLinks.length > 0 && (
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="textSecondary">Social Links</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {reviewSocialLinks.map((link, index) => (
                <Chip
                  key={index}
                  icon={getPlatformIcon(link.platform || 'other')}
                  label={link.label || getPlatformLabel(link.platform || 'other')}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          </Grid>
        )}
        
        {profile.category && (
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="textSecondary">Category</Typography>
            <Typography variant="body1">{profile.category}</Typography>
          </Grid>
        )}
        
        {profile.bio && (
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="textSecondary">Bio</Typography>
            <Typography variant="body1">{profile.bio}</Typography>
          </Grid>
        )}
        
        {previewImageBio && (
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="textSecondary">Bio Image</Typography>
            <img
              src={previewImageBio}
              alt="Bio"
              style={{
                maxWidth: '100%',
                maxHeight: '150px',
                borderRadius: '8px',
                objectFit: 'cover',
                marginTop: '8px'
              }}
            />
          </Grid>
        )}
        
        {(profile.address || profile.city || profile.state || profile.country) && (
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="textSecondary">Location</Typography>
            <Typography variant="body1">
              {[profile.address, profile.city, profile.state, profile.country]
                .filter(Boolean)
                .join(', ')}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default ReviewStep;