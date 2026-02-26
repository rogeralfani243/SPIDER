import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Box, Typography, Button, Stack, RadioGroup,
  Radio, FormControlLabel, FormLabel
} from '@mui/material';
import {
  Download as DownloadIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';

const DownloadDialog = ({ open, onClose, onDownload }) => {
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(2);
  const [selectedChart, setSelectedChart] = useState('all');

  const handleDownload = () => {
    onDownload(selectedChart, format, quality);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DownloadIcon sx={{ color: '#4F46E5' }} />
          <Typography variant="h6" fontWeight={700}>
            Download Charts
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Box>
            <FormLabel sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
              Select Charts
            </FormLabel>
            <RadioGroup value={selectedChart} onChange={(e) => setSelectedChart(e.target.value)}>
              <FormControlLabel value="all" control={<Radio />} label="All Charts" />
              <FormControlLabel value="creation" control={<Radio />} label="Group Creation Trends" />
              <FormControlLabel value="types" control={<Radio />} label="Group Types" />
              <FormControlLabel value="geographic" control={<Radio />} label="Geographic Distribution" />
              <FormControlLabel value="engagement" control={<Radio />} label="Engagement Metrics" />
              <FormControlLabel value="sizes" control={<Radio />} label="Group Sizes" />
            </RadioGroup>
          </Box>

          <Box>
            <FormLabel sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
              Format
            </FormLabel>
            <RadioGroup row value={format} onChange={(e) => setFormat(e.target.value)}>
              <FormControlLabel value="png" control={<Radio />} label="PNG" />
              <FormControlLabel value="jpeg" control={<Radio />} label="JPEG" />
              <FormControlLabel value="webp" control={<Radio />} label="WebP" />
            </RadioGroup>
          </Box>

          <Box>
            <FormLabel sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
              Quality
            </FormLabel>
            <RadioGroup row value={quality} onChange={(e) => setQuality(Number(e.target.value))}>
              <FormControlLabel value={1} control={<Radio />} label="Standard" />
              <FormControlLabel value={2} control={<Radio />} label="HD" />
              <FormControlLabel value={3} control={<Radio />} label="4K" />
            </RadioGroup>
          </Box>

          <Button
            variant="contained"
            onClick={handleDownload}
            startIcon={<GetAppIcon />}
            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
          >
            Download
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadDialog;