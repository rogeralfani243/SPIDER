// src/components/groups/steps/SettingsStep.jsx
import React from 'react';
import {
  Grid,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  People as PeopleIcon,
} from '@mui/icons-material';

/**
 * Step 2: Group Settings
 * Handles group settings like approval requirements, visibility, and max participants
 */
const SettingsStep = ({
  formData,
  onSwitchChange,
  onInputChange,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.requires_approval}
              onChange={onSwitchChange('requires_approval')}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body1">Require Approval to Join</Typography>
              <Typography variant="caption" color="text.secondary">
                {formData.requires_approval
                  ? 'New members must be approved by admin'
                  : 'Anyone can join without approval'}
              </Typography>
            </Box>
          }
        />
        <FormControlLabel
          control={
            <Switch
              checked={formData.is_visible}
              onChange={onSwitchChange('is_visible')}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body1">Visible in Group Discovery</Typography>
              <Typography variant="caption" color="text.secondary">
                {formData.is_visible
                  ? 'Group will appear in public listings'
                  : 'Group will be hidden from public discovery'}
              </Typography>
            </Box>
          }
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.can_anyone_invite}
              onChange={onSwitchChange('can_anyone_invite')}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body1">Anyone Can Invite Members</Typography>
              <Typography variant="caption" color="text.secondary">
                {formData.can_anyone_invite
                  ? 'All members can invite others'
                  : 'Only admins can invite new members'}
              </Typography>
            </Box>
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          type="number"
          label="Maximum Participants"
          value={formData.max_participants}
          onChange={onInputChange('max_participants')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PeopleIcon />
              </InputAdornment>
            ),
            inputProps: { min: 2, max: 1000 },
          }}
          helperText="Maximum number of members allowed (2-1000)"
        />
      </Grid>
    </Grid>
  );
};

export default SettingsStep;