import React from 'react';
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Chip,
  alpha
} from '@mui/material';
import { CHART_COLORS } from './UserGraphiq';

const TopUsersTable = ({ users, metric }) => {
  return (
    <TableContainer sx={{ flex: 1 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 600, color: 'text.primary', bgcolor: alpha('#000', 0.02) } }}>
            <TableCell>User</TableCell>
            <TableCell align="right">Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user, index) => (
            <TableRow key={user.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      bgcolor: CHART_COLORS[index % CHART_COLORS.length],
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {user.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell align="right">
                <Chip 
                  label={user.count} 
                  size="small"
                  sx={{ 
                    bgcolor: alpha(CHART_COLORS[index % CHART_COLORS.length], 0.1),
                    color: CHART_COLORS[index % CHART_COLORS.length],
                    fontWeight: 700,
                    minWidth: 50
                  }} 
                />
              </TableCell>
            </TableRow>
          ))}
          {!users?.length && (
            <TableRow>
              <TableCell colSpan={2} align="center" sx={{ py: 6 }}>
                <Typography color="text.secondary">No data available</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TopUsersTable;