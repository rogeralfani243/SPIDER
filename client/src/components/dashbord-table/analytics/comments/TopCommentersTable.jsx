import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Typography,
  Box,
  Chip
} from '@mui/material';

const TopCommentersTable = ({ data }) => {
  if (!data || data.length === 0) {
    return <Typography color="text.secondary">No commenters yet</Typography>;
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell align="center">Comments</TableCell>
            <TableCell align="center">Percentage</TableCell>
            <TableCell align="right">Activity</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((commenter, index) => {
            const totalComments = data.reduce((sum, c) => sum + (c.count || 0), 0);
            const percentage = ((commenter.count || 0) / totalComments * 100).toFixed(1);
            
            return (
              <TableRow key={commenter.user__id || index} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: '#1976d2' }}>
                      {commenter.user__username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {commenter.user__username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {commenter.user__id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="h6" fontWeight="bold">
                    {commenter.count || 0}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${percentage}%`}
                    size="small"
                    color={percentage > 20 ? 'success' : percentage > 10 ? 'primary' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={index === 0 ? '🏆 Top' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TopCommentersTable;