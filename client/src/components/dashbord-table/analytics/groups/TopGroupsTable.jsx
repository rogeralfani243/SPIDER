// frontend/src/pages/dashboard/components/groups/TopGroupsTable.jsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  Avatar
} from '@mui/material';
import { Groups as GroupsIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';  // ✅ IMPORT MANQUANT AJOUTÉ

const TopGroupsTable = ({ data }) => {
  if (!data || data.length === 0) {
    return <Typography color="text.secondary">No group activity yet</Typography>;
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Group Name</TableCell>
            <TableCell align="center">Messages</TableCell>
            <TableCell align="center">Members</TableCell>
            <TableCell align="center">Activity</TableCell>
            <TableCell align="right">Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((group) => (
            <TableRow key={group.id} hover>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: '#00796b' }}>
                    <GroupsIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {group.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {group.id}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body1" fontWeight="bold">
                  {group.message_count || 0}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={group.members_count || 0}
                  size="small"
                  color="primary"
                />
              </TableCell>
              <TableCell align="center">
                {group.message_count > 100 ? (
                  <Chip label="🔥 Very Active" size="small" color="error" />
                ) : group.message_count > 50 ? (
                  <Chip label="⚡ Active" size="small" color="warning" />
                ) : (
                  <Chip label="💤 Regular" size="small" color="default" />
                )}
              </TableCell>
              <TableCell align="right">
                <Typography variant="caption" color="text.secondary">
                  {group.created_at ? format(parseISO(group.created_at), 'dd/MM/yyyy') : 'N/A'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TopGroupsTable;