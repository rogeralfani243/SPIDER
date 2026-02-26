import React from 'react';
import { Box, Pagination, Stack } from '@mui/material';

const CommentsPagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
      <Stack spacing={2}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => onPageChange(value)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Stack>
    </Box>
  );
};

export default CommentsPagination;