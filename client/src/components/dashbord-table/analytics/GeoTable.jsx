
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box
} from '@mui/material';
import { Language, LocationCity } from '@mui/icons-material';

const GeoTable = ({ topCountries, filteredCities }) => {
  return (
    <TableContainer sx={{ maxHeight: 420, overflow: 'auto' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>Country / City</TableCell>
            <TableCell align="right">Comments</TableCell>
            <TableCell align="right">Ratings</TableCell>
            <TableCell align="right">Feedback</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Countries */}
          {Object.entries(topCountries)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 10)
            .map(([country, data]) => (
              <TableRow key={country} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    <Language sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    {country}
                  </Typography>
                </TableCell>
                <TableCell align="right">{data.comments}</TableCell>
                <TableCell align="right">{data.ratings}</TableCell>
                <TableCell align="right">{data.feedback}</TableCell>
                <TableCell align="right">
                  <Chip label={data.total} size="small" color="primary" />
                </TableCell>
              </TableRow>
            ))}
          
          {/* Cities */}
          {filteredCities
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map((item) => (
              <TableRow key={item.user__profile__city} hover>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    <LocationCity sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    {item.user__profile__city} ({item.user__profile__country})
                  </Typography>
                </TableCell>
                <TableCell align="right">{item.count}</TableCell>
                <TableCell align="right">-</TableCell>
                <TableCell align="right">-</TableCell>
                <TableCell align="right">
                  <Chip label={item.count} size="small" color="secondary" />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GeoTable;