import React from 'react';
import {
  Grid,
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { getPlatformIcon, getPlatformLabel } from '../../utils/constants';

const SocialLinksStep = ({ profile, handleOpenSocialLinkDialog, handleDeleteSocialLink }) => {
  const socialLinks = Array.isArray(profile.social_links) ? profile.social_links : [];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Social Links
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenSocialLinkDialog()}
            size="small"
          >
            Add Link
          </Button>
        </Box>

        {socialLinks.length === 0 ? (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              bgcolor: 'grey.50'
            }}
          >
            <LanguageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="body1" color="textSecondary" gutterBottom>
              No links added yet
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Add your website, social media profiles, or portfolio links
            </Typography>
          </Paper>
        ) : (
          <List>
            {socialLinks.map((link, index) => {
              if (!link || typeof link !== 'object') {
                return null;
              }
              
              return (
                <ListItem
                  key={index}
                  sx={{
                    borderBottom: '1px solid #eee',
                    '&:last-child': { borderBottom: 'none' },
                    bgcolor: 'white',
                    mb: 1,
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ mr: 2 }}>
                    {getPlatformIcon(link.platform || 'other')}
                  </Box>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" fontWeight="500">
                          {link.label || getPlatformLabel(link.platform || 'other')}
                        </Typography>
                        <Chip
                          label={getPlatformLabel(link.platform || 'other')}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <a 
                        href={link.url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#1976d2', textDecoration: 'none', fontSize: '0.875rem' }}
                      >
                        {link.url ? (link.url.length > 50 ? `${link.url.substring(0, 47)}...` : link.url) : 'No URL'}
                      </a>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleOpenSocialLinkDialog(index)}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteSocialLink(index)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}

        <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
          Tip: Add links to your portfolio, social media profiles, or other relevant websites
        </Typography>
      </Grid>
    </Grid>
  );
};

export default SocialLinksStep;