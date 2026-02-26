import React from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid } from '@mui/material';
import { Public as PublicIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const GeographicCharts = React.forwardRef(({ countryStats, cityStats }, ref) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={6}>
        <Paper ref={ref} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <PublicIcon sx={{ color: '#4F46E5' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Top Countries
            </Typography>
          </Box>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={countryStats?.slice(0, 10)} 
              layout="vertical"
              margin={{ left: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="country" />
              <Tooltip />
              <Bar dataKey="total_users" name="Users" fill="#4F46E5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <LocationIcon sx={{ color: '#4F46E5' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Top Cities
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Users</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cityStats?.slice(0, 10).map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{item.city}</TableCell>
                    <TableCell>{item.country}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#4F46E5' }}>
                      {item.total_users}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
});

export default GeographicCharts;