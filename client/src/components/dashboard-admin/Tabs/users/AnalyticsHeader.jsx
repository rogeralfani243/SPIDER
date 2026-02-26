import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { COLORS } from './UserGraphiq';

const AnalyticsHeader = ({ 
  capturing, 
  onRefresh, 
  onPrint, 
  onDownloadPDF, 
  onDownloadCSV 
}) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        mb: 4, 
        bgcolor: alpha(COLORS.primary, 0.04),
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(COLORS.primary, 0.1)
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.primary, mb: 1 }}>
            Users Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive analysis of user growth, activity, and engagement
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={onRefresh} 
              disabled={capturing} 
              sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Report">
            <IconButton 
              onClick={onPrint} 
              disabled={capturing}
              sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton 
              onClick={onDownloadPDF} 
              disabled={capturing}
              sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={onDownloadCSV}
            disabled={capturing}
            sx={{ 
              bgcolor: COLORS.primary,
              boxShadow: '0 4px 12px rgba(33,150,243,0.3)',
              '&:hover': { bgcolor: alpha(COLORS.primary, 0.9) }
            }}
          >
            Export CSV
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default AnalyticsHeader;