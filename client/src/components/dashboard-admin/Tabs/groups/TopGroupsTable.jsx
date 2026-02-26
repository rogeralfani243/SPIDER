import React from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, alpha } from '@mui/material';
import { Group as GroupIcon } from '@mui/icons-material';

const GROUP_TYPE_COLORS = {
  group_public: '#10B981',
  group_private: '#4F46E5'
};

const TopGroupsTable = ({ data }) => {
  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <GroupIcon sx={{ color: '#4F46E5' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Top Groups by Engagement
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Group</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Members</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Messages</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Engagement</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((group, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {group.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={group.group_type === 'group_public' ? 'Public' : 'Private'}
                    size="small"
                    sx={{
                      bgcolor: alpha(GROUP_TYPE_COLORS[group.group_type] || '#6B7280', 0.1),
                      color: GROUP_TYPE_COLORS[group.group_type] || '#6B7280',
                      height: 20,
                      fontSize: '0.625rem'
                    }}
                  />
                </TableCell>
                <TableCell align="right">{group.member_count}</TableCell>
                <TableCell align="right">{group.message_count}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#4F46E5' }}>
                  {group.engagement_score}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TopGroupsTable;