import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Refresh as RefreshIcon, Add as AddIcon } from '@mui/icons-material';

const PostsHeader = ({ postCount, boostedCount, onRefresh, onCreatePost }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      mb: 3, 
      flexWrap: 'wrap', 
      gap: 2 
    }}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Posts Management
        </Typography>
      
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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

export default PostsHeader;