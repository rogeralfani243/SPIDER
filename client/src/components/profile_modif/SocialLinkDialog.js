import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { PLATFORM_OPTIONS } from '../../utils/constants';

const SocialLinkDialog = ({
  open,
  socialLinkDialog,
  errors,
  handleCloseSocialLinkDialog,
  handleSocialLinkChange,
  handleSaveSocialLink,
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={handleCloseSocialLinkDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {socialLinkDialog.editingIndex !== null ? 'Edit Link' : 'Add New Link'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Platform</InputLabel>
              <Select
                name="platform"
                value={socialLinkDialog.link.platform}
                onChange={handleSocialLinkChange}
                label="Platform"
              >
                {PLATFORM_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {option.icon}
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Display Label (Optional)"
              name="label"
              value={socialLinkDialog.link.label}
              onChange={handleSocialLinkChange}
              placeholder="e.g., My Portfolio"
              helperText="Leave empty to use platform name"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="URL"
              name="url"
              value={socialLinkDialog.link.url}
              onChange={handleSocialLinkChange}
              placeholder="https://example.com"
              required
              error={!!errors.url}
              helperText={errors.url || "Must start with http:// or https://"}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseSocialLinkDialog}>Cancel</Button>
        <Button 
          onClick={handleSaveSocialLink} 
          variant="contained"
        >
          {socialLinkDialog.editingIndex !== null ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SocialLinkDialog;