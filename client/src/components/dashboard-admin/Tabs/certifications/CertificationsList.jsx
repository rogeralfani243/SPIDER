import React from 'react';
import {
  Box, Paper, Grid, Card, CardContent, Typography,
  FormControl, InputLabel, Select, MenuItem, TextField,
  Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip, Avatar,
  Badge, TablePagination, alpha
} from '@mui/material';
import {
  VerifiedUser as VerifiedIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  Whatshot as FireIcon,
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';

// Utility functions
const getCertIcon = (type) => {
  switch (type) {
    case 'premium': return <StarIcon fontSize="small" />;
    case 'verified': return <VerifiedIcon fontSize="small" />;
    case 'fire': return <FireIcon fontSize="small" />;
    case 'influencer': return <VerifiedIcon fontSize="small" />;
    default: return <VerifiedIcon fontSize="small" />;
  }
};

const getCertColor = (type) => {
  switch (type) {
    case 'premium': return '#FFD700';
    case 'verified': return '#1DA1F2';
    case 'fire': return '#FF5722';
    case 'influencer': return '#9C27B0';
    default: return '#9E9E9E';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'expired': return 'error';
    case 'revoked': return 'default';
    default: return 'default';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'active': return <CheckCircleIcon fontSize="small" />;
    case 'pending': return <ScheduleIcon fontSize="small" />;
    case 'expired': return <CancelIcon fontSize="small" />;
    case 'revoked': return <CancelIcon fontSize="small" />;
    default: return <ScheduleIcon fontSize="small" />;
  }
};

// Stats Cards Component
const StatsCards = ({ stats }) => {
  const statItems = [
    { label: 'Total', value: stats.total, icon: <VerifiedIcon fontSize="small" />, color: '#4F46E5' },
    { label: 'Active', value: stats.active, icon: <CheckCircleIcon fontSize="small" />, color: '#10B981' },
    { label: 'Pending', value: stats.pending, icon: <ScheduleIcon fontSize="small" />, color: '#F59E0B' },
    { label: 'Expired', value: stats.expired, icon: <CancelIcon fontSize="small" />, color: '#EF4444' }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statItems.map((item, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ borderRadius: 2, borderTop: 3, borderColor: item.color }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.icon} {item.label}
              </Typography>
              <Typography variant="h4" sx={{ color: item.color, fontWeight: 700 }}>
                {item.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Filters Component
const FiltersSection = ({ filters, onFilterChange, onApplyFilters }) => {
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#f9fafb' }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Certification Type</InputLabel>
            <Select
              value={filters.type}
              label="Certification Type"
              onChange={(e) => onFilterChange('type', e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="premium">Premium</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="fire">Fire</MenuItem>
              <MenuItem value="influencer">Influencer</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => onFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="revoked">Revoked</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            label="Search User"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Username or email..."
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button
            fullWidth
            variant="contained"
            onClick={onApplyFilters}
            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
          >
            Apply
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Table Row Component
const CertificationTableRow = ({ cert, onViewDetails, onEdit, onActivate, onRevoke }) => {
  return (
    <TableRow hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge
            color={cert.status === 'active' ? 'success' : 'default'}
            variant="dot"
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
    "& .MuiBadge-badge": {
      borderRadius: "50%"
    }
  }}
         >
            <Avatar
              src={cert.user.profile_image || ''}
              sx={{ 
                width: 40, 
                height: 40, 
                bgcolor: alpha(getCertColor(cert.certification_type?.name), 0.2) 
              }}
            >
              {cert.user?.username?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {cert.user?.username || 'Unknown User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {cert.user?.email || 'No email'}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          icon={getCertIcon(cert.certification_type?.name)}
          label={cert.certification_type?.name || 'Unknown'}
          size="small"
          sx={{
            bgcolor: alpha(getCertColor(cert.certification_type?.name), 0.1),
            color: getCertColor(cert.certification_type?.name),
            border: `1px solid ${alpha(getCertColor(cert.certification_type?.name), 0.3)}`,
            fontWeight: 600,
            px: 1
          }}
        />
      </TableCell>
      <TableCell>
        <Chip
          icon={getStatusIcon(cert.status)}
          label={cert.status || 'pending'}
          color={getStatusColor(cert.status)}
          size="small"
          sx={{ fontWeight: 600, textTransform: 'capitalize' }}
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {cert.created_at ? new Date(cert.created_at).toLocaleDateString() : 'N/A'}
        </Typography>
      </TableCell>
      <TableCell>
        {cert.expires_at ? (
          <Box>
            <Typography variant="body2">
              {new Date(cert.expires_at).toLocaleDateString()}
            </Typography>
            {cert.days_remaining !== undefined && (
              <Chip
                label={`${cert.days_remaining} days left`}
                size="small"
                color={cert.days_remaining < 30 ? 'warning' : 'success'}
                sx={{ mt: 0.5, height: 20, fontSize: '0.625rem' }}
              />
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Never expires
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton 
              size="small" 
              onClick={() => onViewDetails(cert)}
              sx={{ color: '#4F46E5' }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              onClick={() => onEdit(cert)}
              sx={{ color: '#F59E0B' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {cert.status === 'pending' && (
            <Tooltip title="Activate">
              <IconButton 
                size="small" 
                onClick={() => onActivate(cert)}
                sx={{ color: '#10B981' }}
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {cert.status === 'active' && (
            <Tooltip title="Revoke">
              <IconButton 
                size="small" 
                onClick={() => onRevoke(cert)}
                sx={{ color: '#EF4444' }}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Main Component
const CertificationsList = ({
  stats,
  filters,
  filteredCerts,
  page,
  rowsPerPage,
  onFilterChange,
  onApplyFilters,
  onViewDetails,
  onEdit,
  onActivate,
  onRevoke,
  onDelete,
  onChangePage,
  onChangeRowsPerPage
}) => {
  return (
    <>
      <StatsCards stats={stats} />
      <FiltersSection 
        filters={filters}
        onFilterChange={onFilterChange}
        onApplyFilters={onApplyFilters}
      />
      
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Certification</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Issued</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Expires</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No certifications found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCerts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((cert) => (
                    <CertificationTableRow
                      key={cert.id}
                      cert={cert}
                      onViewDetails={onViewDetails}
                      onEdit={onEdit}
                      onActivate={onActivate}
                      onRevoke={onRevoke}
                    />
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredCerts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onChangePage}
          onRowsPerPageChange={onChangeRowsPerPage}
          labelRowsPerPage="Rows per page"
        />
      </Paper>
    </>
  );
};

export default CertificationsList;