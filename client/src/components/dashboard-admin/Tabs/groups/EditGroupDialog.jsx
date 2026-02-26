import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Grid, TextField, FormControl,
  InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Divider, Button
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

const EditGroupDialog = ({ open, group, formData, onClose, onFormChange, onSave }) => {
  if (!group) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>
          Edit Group
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {group.name || `Group ${group.id}`}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Group Name"
              name="name"
              value={formData.name || ''}
              onChange={onFormChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Description"
              name="description"
              value={formData.description || ''}
              onChange={onFormChange}
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Group Type</InputLabel>
              <Select
                name="group_type"
                value={formData.group_type || 'group_public'}
                onChange={onFormChange}
                label="Group Type"
              >
                <MenuItem value="group_public">Public</MenuItem>
                <MenuItem value="group_private">Private</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="is_active"
                value={formData.is_active !== undefined ? formData.is_active : true}
                onChange={(e) => onFormChange({
                  target: {
                    name: 'is_active',
                    value: e.target.value === 'true' || e.target.value === true
                  }
                })}
                label="Status"
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Max Members"
              name="max_participants"
              type="number"
              value={formData.max_participants || ''}
              onChange={onFormChange}
              InputProps={{ inputProps: { min: 0 } }}
              helperText="Leave empty for unlimited"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Location"
              name="location"
              value={formData.location || ''}
              onChange={onFormChange}
              placeholder="City, Country"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Website"
              name="website"
              value={formData.website || ''}
              onChange={onFormChange}
              placeholder="https://..."
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
              Join Settings
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  name="requires_approval"
                  checked={formData.requires_approval || false}
                  onChange={onFormChange}
                  color="primary"
                />
              }
              label="Requires Approval"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  name="can_anyone_invite"
                  checked={formData.can_anyone_invite !== false}
                  onChange={onFormChange}
                  color="primary"
                />
              }
              label="Anyone Can Invite"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  name="is_visible"
                  checked={formData.is_visible !== false}
                  onChange={onFormChange}
                  color="primary"
                />
              }
              label="Visible in Search"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="contained"
          onClick={onSave}
          startIcon={<SaveIcon />}
          sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditGroupDialog;