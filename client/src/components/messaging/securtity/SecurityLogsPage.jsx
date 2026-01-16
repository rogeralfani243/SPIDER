// src/components/security/SecurityLogsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  LinearProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  AccountCircle as AccountCircleIcon,
  Public as PublicIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { securityService } from './SecurityInterceptor';
import { styled } from '@mui/material/styles';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const SecurityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    setLoading(true);
    try {
      securityService.loadViolations();
      const allLogs = securityService.violations;
      setLogs(allLogs);
      setFilteredLogs(allLogs);
      setStats(securityService.getSecurityStats());
    } catch (error) {
      console.error('Error loading security logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredLogs(logs);
      return;
    }
    
    const filtered = logs.filter(log => 
      log.path.toLowerCase().includes(term.toLowerCase()) ||
      log.reason.toLowerCase().includes(term.toLowerCase()) ||
      log.userId.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredLogs(filtered);
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all security logs?')) {
      securityService.reset();
      loadLogs();
    }
  };

  const getSeverityColor = (reason) => {
    if (reason.includes('blocked') || reason.includes('malicious')) {
      return 'error';
    } else if (reason.includes('admin') || reason.includes('unauthorized')) {
      return 'warning';
    }
    return 'info';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading security logs...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
        <SecurityIcon sx={{ verticalAlign: 'middle', mr: 2 }} />
        Security Logs & Monitoring
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Violations
              </Typography>
              <Typography variant="h4">
                {stats?.totalViolations || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Today's Violations
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats?.todaysViolations || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Unique Users
              </Typography>
              <Typography variant="h4">
                {stats?.uniqueUsers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Blocked IPs
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats?.blockedIPs || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: '300px' }}
        />
        
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadLogs}
          variant="outlined"
        >
          Refresh
        </Button>
        
        <Button
          startIcon={<DeleteIcon />}
          onClick={handleClearLogs}
          variant="outlined"
          color="error"
        >
          Clear All
        </Button>
      </Box>

      {/* Logs Table */}
      <TableContainer component={Paper} sx={{ maxHeight: '600px' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell><strong>Timestamp</strong></TableCell>
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Path</strong></TableCell>
              <TableCell><strong>Reason</strong></TableCell>
              <TableCell><strong>Severity</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No security violations logged
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log, index) => (
                <StyledTableRow key={index}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimelineIcon fontSize="small" color="action" />
                      {formatDate(log.timestamp)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountCircleIcon fontSize="small" color="action" />
                      {log.userId || 'anonymous'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {log.path}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.reason.includes('blocked') ? 'HIGH' : 'MEDIUM'}
                      color={getSeverityColor(log.reason)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => setSelectedLog(log)}
                      title="View details"
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Log Details Dialog */}
      <Dialog
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
      >
        {selectedLog && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                Security Violation Details
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedLog.timestamp)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {selectedLog.userId || 'anonymous'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {selectedLog.ip || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Path Attempted
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {selectedLog.path}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reason
                  </Typography>
                  <Alert severity={getSeverityColor(selectedLog.reason)} sx={{ mt: 1 }}>
                    {selectedLog.reason}
                  </Alert>
                </Grid>
                
                {selectedLog.userAgent && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      User Agent
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {selectedLog.userAgent}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedLog(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Footer Info */}
      <Alert 
        severity="info" 
        sx={{ mt: 3 }}
        icon={<PublicIcon />}
      >
        <Typography variant="body2">
          Security logs are stored locally in your browser. For persistent logging across devices,
          enable server-side logging in system settings.
        </Typography>
      </Alert>
    </Box>
  );
};

export default SecurityLogsPage;