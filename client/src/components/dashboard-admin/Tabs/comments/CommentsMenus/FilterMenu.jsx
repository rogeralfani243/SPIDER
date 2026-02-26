// src/components/dashboard-admin/Tabs/comments/CommentsMenus/FilterMenu.jsx
import React from 'react';
import {
  Menu,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Typography,
  Box,
  Radio,
  RadioGroup,
  FormControl,
  Button,
  FormLabel
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AttachFile as AttachFileIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  PushPin as PushPinIcon
} from '@mui/icons-material';

const FilterMenu = ({
  anchorEl,
  open,
  onClose,
  filters,
  onFilterChange
}) => {
  const handleCheckboxChange = (key) => (event) => {
    onFilterChange(key, event.target.checked ? 'true' : '');
  };

  const handleDateFilterChange = (value) => {
    onFilterChange('date_range', value);
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 280, maxHeight: 500 }
      }}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon fontSize="small" /> Filter Comments
        </Typography>
      </Box>
      <Divider />

      {/* Media Filters */}
      <MenuItem>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.has_media === 'true'}
              onChange={handleCheckboxChange('has_media')}
              icon={<AttachFileIcon />}
              checkedIcon={<AttachFileIcon color="primary" />}
            />
          }
          label="Has Media"
        />
      </MenuItem>
      <MenuItem sx={{ pl: 4 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.has_image === 'true'}
              onChange={handleCheckboxChange('has_image')}
              size="small"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ImageIcon fontSize="small" color="primary" /> Images
            </Box>
          }
        />
      </MenuItem>
      <MenuItem sx={{ pl: 4 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.has_video === 'true'}
              onChange={handleCheckboxChange('has_video')}
              size="small"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <VideoIcon fontSize="small" color="secondary" /> Videos
            </Box>
          }
        />
      </MenuItem>
      <MenuItem sx={{ pl: 4 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.has_file === 'true'}
              onChange={handleCheckboxChange('has_file')}
              size="small"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AttachFileIcon fontSize="small" /> Files
            </Box>
          }
        />
      </MenuItem>

      <Divider />

      {/* Status Filters */}
      <MenuItem>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.is_hidden === 'true'}
              onChange={handleCheckboxChange('is_hidden')}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <VisibilityOffIcon fontSize="small" color="warning" /> Hidden
            </Box>
          }
        />
      </MenuItem>
      <MenuItem>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.is_spam === 'true'}
              onChange={handleCheckboxChange('is_spam')}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <WarningIcon fontSize="small" color="error" /> Spam
            </Box>
          }
        />
      </MenuItem>
      <MenuItem>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.is_pinned === 'true'}
              onChange={handleCheckboxChange('is_pinned')}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PushPinIcon fontSize="small" color="success" /> Pinned
            </Box>
          }
        />
      </MenuItem>

      <Divider />

      {/* Comment Type */}
      <MenuItem>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.is_reply === 'true'}
              onChange={handleCheckboxChange('is_reply')}
            />
          }
          label="Replies only"
        />
      </MenuItem>
      <MenuItem>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.is_root === 'true'}
              onChange={handleCheckboxChange('is_root')}
            />
          }
          label="Root comments only"
        />
      </MenuItem>

      <Divider />

      {/* Date Range */}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="textSecondary">
          Date Range
        </Typography>
        <RadioGroup
          value={filters.date_range || ''}
          onChange={(e) => handleDateFilterChange(e.target.value)}
        >
          <FormControlLabel value="today" control={<Radio size="small" />} label="Today" />
          <FormControlLabel value="yesterday" control={<Radio size="small" />} label="Yesterday" />
          <FormControlLabel value="last_7_days" control={<Radio size="small" />} label="Last 7 days" />
          <FormControlLabel value="last_30_days" control={<Radio size="small" />} label="Last 30 days" />
          <FormControlLabel value="" control={<Radio size="small" />} label="All time" />
        </RadioGroup>
      </Box>

      <Divider />

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
        <Button size="small" onClick={() => onFilterChange('reset', null)}>
          Reset
        </Button>
        <Button size="small" variant="contained" onClick={onClose}>
          Apply
        </Button>
      </Box>
    </Menu>
  );
};

export default FilterMenu;