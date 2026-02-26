import React from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { Comment as CommentIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { formatCompactNumber } from '../../../../utils/formatters.js';

const CommentsHeader = ({ totalComments, selectedCount, onBulkDelete, onRefresh }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CommentIcon /> Comments Management
        {totalComments > 0 && (
          <Chip 
            label={`${formatCompactNumber(totalComments)} total`}
            size="small"
            color="primary"
            sx={{ ml: 2 }}
          />
        )}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        {selectedCount > 0 && (
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={onBulkDelete}
          >
            Delete Selected ({selectedCount})
          </Button>
        )}
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </Box>
    </Box>
  );
};

export default CommentsHeader;