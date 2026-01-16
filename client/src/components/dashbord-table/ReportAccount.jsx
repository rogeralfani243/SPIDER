// ReportAccount.jsx - Version corrigée avec votre API
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  Card,
  CardContent,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Pagination,
  CircularProgress,
  useTheme,
  alpha,
  Tabs,
  Tab
} from '@mui/material';
import {
  Report as ReportIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  BarChart as BarChartIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { styled } from '@mui/material/styles';
import { reportApi } from '../services/api';

// Styled Components
const ReportCard = styled(Card)(({ theme, status }) => ({
  borderLeft: `4px solid ${getStatusColor(theme, status)}`,
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[3],
    transform: 'translateY(-1px)',
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  backgroundColor: alpha(getStatusColor(theme, status), 0.1),
  color: getStatusColor(theme, status),
  fontWeight: 600,
  border: `1px solid ${alpha(getStatusColor(theme, status), 0.3)}`,
}));

const ExpandableContent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

const ContentPreview = styled(Paper)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.875rem',
  wordBreak: 'break-word',
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 200,
  flexDirection: 'column',
}));

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

// Helper functions
const getStatusColor = (theme, status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return theme.palette.warning.main;
    case 'under_review':
      return theme.palette.info.main;
    case 'resolved':
      return theme.palette.success.main;
    case 'dismissed':
      return theme.palette.error.main;
    default:
      return theme.palette.text.secondary;
  }
};

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return <PendingIcon />;
    case 'under_review':
      return <WarningIcon />;
    case 'resolved':
      return <CheckCircleIcon />;
    case 'dismissed':
      return <CancelIcon />;
    default:
      return <WarningIcon />;
  }
};

const formatContentType = (type) => {
  const types = {
    'post': 'Post',
    'comment': 'Comment',
    'user': 'User Profile',
    'message': 'Message',
    'profile': 'Profile',
    'feedback': 'Feedback'
  };
  return types[type] || type;
};

const ReportAccount = () => {
  const theme = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);
  const [stats, setStats] = useState({
    summary: {
      total: 0,
      pending: 0,
      under_review: 0,
      resolved: 0,
      dismissed: 0
    }
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });
  const [filters, setFilters] = useState({
    status: '',
    report_type: '',
    content_type: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    status: [],
    report_type: [],
    content_type: []
  });
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch user reports
  const fetchReports = async () => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);
      
      console.log('Fetching user reports...');
      
      // Utilisez l'endpoint correct de votre API
      const response = await reportApi.getUserReports();
      const data = response.data || response;
      
      console.log('Reports data received:', data);
      
      if (data.success === false) {
        throw new Error(data.error || 'Failed to load reports');
      }
      
      // Mettez à jour les rapports
      setReports(data.reports || []);
      
      // Mettez à jour les statistiques
      if (data.stats) {
        setStats(data.stats);
      } else {
        // Statistiques par défaut si non fournies
        const reportsCount = data.reports?.length || 0;
        setStats({
          summary: {
            total: data.total || reportsCount,
            pending: data.pending || 0,
            under_review: data.under_review || 0,
            resolved: data.resolved || 0,
            dismissed: data.dismissed || 0
          },
          by_report_type: data.by_report_type || {},
          by_content_type: data.by_content_type || {},
          recent_activity: data.recent_activity || {
            last_30_days: 0,
            last_7_days: 0,
            today: 0
          }
        });
      }
      
      // Mettez à jour les options de filtre si disponibles
      if (data.filters?.available) {
        setFilterOptions(data.filters.available);
      } else {
        // Options par défaut basées sur vos modèles Django
        setFilterOptions({
          status: [
            { value: 'pending', label: 'Pending' },
            { value: 'under_review', label: 'Under Review' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'dismissed', label: 'Dismissed' }
          ],
          report_type: [
            { value: 'spam', label: 'Spam' },
            { value: 'harassment', label: 'Harassment' },
            { value: 'hate_speech', label: 'Hate Speech' },
            { value: 'inappropriate', label: 'Inappropriate' },
            { value: 'copyright', label: 'Copyright' },
            { value: 'false_info', label: 'False Info' },
            { value: 'other', label: 'Other' }
          ],
          content_type: [
            { value: 'post', label: 'Post' },
            { value: 'comment', label: 'Comment' },
            { value: 'profile', label: 'Profile' },
            { value: 'message', label: 'Message' },
            { value: 'feedback', label: 'Feedback' }
          ]
        });
      }
      
      // Mettez à jour la pagination
      if (data.pagination) {
        setPagination(data.pagination);
      } else {
        setPagination({
          current_page: 1,
          total_count: data.total || data.reports?.length || 0,
          total_pages: 1,
          has_next: false,
          has_previous: false
        });
      }
      
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'Failed to load reports. Please try again.');
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Handle report expansion
  const handleExpandReport = (reportId) => {
    setExpandedReport(expandedReport === reportId ? null : reportId);
  };

  // Handle report detail view
  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: '',
      report_type: '',
      content_type: ''
    });
  };

  // Render loading state
  if (loading && !refreshing) {
    return (
      <LoadingContainer>
        <CircularProgress size={50} />
        <Typography variant="body1" sx={{ mt: 2, color: theme.palette.text.secondary }}>
          Loading your reports...
        </Typography>
      </LoadingContainer>
    );
  }

  //
  // Render empty state
  if (reports.length === 0 && !loading) {
    return (
      <Box textAlign="center" py={4}>
        <ReportIcon sx={{ fontSize: 60, color: theme.palette.text.secondary, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Reports Found
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          You haven't submitted any reports yet.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Reports help keep our community safe and respectful.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="My Reports" icon={<ReportIcon />} iconPosition="start" />
          <Tab label="Statistics" icon={<BarChartIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 ? (
        <>
          {/* Stats Summary */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <StatCard elevation={2}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {stats.summary.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Reports
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard elevation={2} sx={{ borderColor: 'warning.main' }}>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {stats.summary.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard elevation={2} sx={{ borderColor: 'info.main' }}>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {stats.summary.under_review}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Under Review
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard elevation={2} sx={{ borderColor: 'success.main' }}>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {stats.summary.resolved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Resolved
                </Typography>
              </StatCard>
            </Grid>
          </Grid>

          {/* Filter Section - Version simplifiée sans requête API pour le moment */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon /> Filters (Coming Soon)
              </Typography>
              {(filters.status || filters.report_type || filters.content_type) && (
                <Button size="small" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </Box>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Filter functionality will be available in the next update.
            </Alert>
            
            {/*
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    disabled
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {filterOptions.status.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={filters.report_type}
                    label="Report Type"
                    onChange={(e) => handleFilterChange('report_type', e.target.value)}
                    disabled
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {filterOptions.report_type.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Content Type</InputLabel>
                  <Select
                    value={filters.content_type}
                    label="Content Type"
                    onChange={(e) => handleFilterChange('content_type', e.target.value)}
                    disabled
                  >
                    <MenuItem value="">All Content</MenuItem>
                    {filterOptions.content_type.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            */}
          </Paper>

          {/* Reports List */}
          <Box>
            {reports.map((report) => (
              <ReportCard key={report.id} status={report.status} elevation={1}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <StatusChip
                          icon={getStatusIcon(report.status)}
                          label={report.status_display || report.status}
                          status={report.status}
                          size="small"
                        />
                        <Chip
                          label={report.content_type_display || formatContentType(report.content_type)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      
                      <Typography variant="h6" gutterBottom>
                        {report.report_type_display || report.report_type}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Reported {report.created_at ? formatDistanceToNow(new Date(report.created_at), { addSuffix: true }) : 'recently'}
                      </Typography>
                      
                      {/* Reported Content Preview */}
                      {report.reported_content && (
                        <ContentPreview elevation={0}>
                          <Typography variant="subtitle2" gutterBottom>
                            Reported Content:
                          </Typography>
                          <Typography variant="body2">
                            {report.reported_content.preview || 'No preview available'}
                          </Typography>
                          {report.reported_content.author && (
                            <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                              <PersonIcon fontSize="small" />
                              <Typography variant="caption">
                                By: {report.reported_content.author.username}
                              </Typography>
                            </Box>
                          )}
                        </ContentPreview>
                      )}
                      
                      {/* Reason for Report */}
                      {report.reason && (
                        <Box mt={2}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Reason:
                          </Typography>
                          <Typography variant="body2">
                            {report.reason.length > 150 ? `${report.reason.substring(0, 150)}...` : report.reason}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    <Stack direction="column" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleExpandReport(report.id)}
                      >
                        {expandedReport === report.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewDetails(report)}
                      >
                        Details
                      </Button>
                    </Stack>
                  </Box>
                  
                  {/* Expanded Content */}
                  {expandedReport === report.id && (
                    <ExpandableContent>
                      <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                        Report Details
                      </Typography>
                      
                      {/* Actions Taken */}
                      {report.actions && report.actions.length > 0 ? (
                        <Box mt={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            Actions Taken:
                          </Typography>
                          <Stack spacing={2}>
                            {report.actions.map((action, index) => (
                              <Box key={index} display="flex" alignItems="flex-start" gap={2}>
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.primary.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    flexShrink: 0
                                  }}
                                >
                                  {index + 1}
                                </Box>
                                <Box flex={1}>
                                  <Typography variant="body2" fontWeight="500">
                                    {action.action_type}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {action.performed_at ? formatDistanceToNow(new Date(action.performed_at), { addSuffix: true }) : ''}
                                  </Typography>
                                  {action.description && (
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                      {action.description}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No actions taken yet. Report is pending review.
                        </Typography>
                      )}
                      
                      {/* Additional Details */}
                      {(report.moderator_notes || report.action_taken || report.reviewer) && (
                        <Box mt={3}>
                          {report.moderator_notes && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                              <Typography variant="subtitle2">Moderator Notes:</Typography>
                              <Typography variant="body2">{report.moderator_notes}</Typography>
                            </Alert>
                          )}
                          
                          {report.action_taken && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                              <Typography variant="subtitle2">Action Taken:</Typography>
                              <Typography variant="body2">{report.action_taken}</Typography>
                            </Alert>
                          )}
                          
                          {report.reviewer && (
                            <Box p={2} bgcolor={alpha(theme.palette.info.main, 0.05)} borderRadius={1}>
                              <Typography variant="subtitle2" gutterBottom>
                                Assigned Reviewer:
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                <PersonIcon fontSize="small" />
                                <Typography variant="body2">
                                  {report.reviewer.username || 'Unknown'}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                    </ExpandableContent>
                  )}
                </CardContent>
              </ReportCard>
            ))}
          </Box>
        </>
      ) : (
        /* Statistics Tab */
        <Box>
          <Grid container spacing={3}>
            {/* Recent Activity */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon /> Recent Activity
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Today</Typography>
                    <Typography variant="h5">{stats.recent_activity?.today || 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Last 7 Days</Typography>
                    <Typography variant="h5">{stats.recent_activity?.last_7_days || 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Last 30 Days</Typography>
                    <Typography variant="h5">{stats.recent_activity?.last_30_days || 0}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Report Type Distribution */}
            {stats.by_report_type && Object.keys(stats.by_report_type).length > 0 && (
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    By Report Type
                  </Typography>
                  <Stack spacing={1}>
                    {Object.entries(stats.by_report_type).map(([type, data]) => (
                      <Box key={type} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {data.label || type}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="bold">
                            {data.count}
                          </Typography>
                          {data.percentage && (
                            <Typography variant="caption" color="text.secondary">
                              ({data.percentage}%)
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            )}

            {/* Content Type Distribution */}
            {stats.by_content_type && Object.keys(stats.by_content_type).length > 0 && (
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    By Content Type
                  </Typography>
                  <Stack spacing={1}>
                    {Object.entries(stats.by_content_type).map(([type, data]) => (
                      <Box key={type} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {data.label || formatContentType(type)}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="bold">
                            {data.count}
                          </Typography>
                          {data.percentage && (
                            <Typography variant="caption" color="text.secondary">
                              ({data.percentage}%)
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Actions Bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
        <Typography variant="body2" color="text.secondary">
          Showing {reports.length} of {stats.summary.total} reports
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Report Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedReport && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                {getStatusIcon(selectedReport.status)}
                <Typography variant="h6">
                  Report #{selectedReport.id} Details
                </Typography>
                <StatusChip
                  label={selectedReport.status_display || selectedReport.status}
                  status={selectedReport.status}
                  sx={{ ml: 2 }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Report Type
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedReport.report_type_display || selectedReport.report_type}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Content Type
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedReport.content_type_display || formatContentType(selectedReport.content_type)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reason
                  </Typography>
                  <Paper sx={{ p: 2, mt: 1, backgroundColor: theme.palette.background.default }}>
                    <Typography variant="body1">
                      {selectedReport.reason || 'No reason provided'}
                    </Typography>
                  </Paper>
                </Grid>
                
                {selectedReport.reported_content && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Reported Content
                    </Typography>
                    <ContentPreview sx={{ mt: 1 }}>
                      <Typography variant="body1" paragraph>
                        {selectedReport.reported_content.preview || 'No preview available'}
                      </Typography>
                      {selectedReport.reported_content.author && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon fontSize="small" />
                          <Typography variant="body2">
                            Author: {selectedReport.reported_content.author.username}
                          </Typography>
                          {selectedReport.reported_content.created_at && (
                            <Typography variant="caption" color="text.secondary">
                              • Created {formatDistanceToNow(new Date(selectedReport.reported_content.created_at), { addSuffix: true })}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </ContentPreview>
                  </Grid>
                )}
                
                {selectedReport.moderator_notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Moderator Notes
                    </Typography>
                    <Alert severity="info" sx={{ mt: 1 }}>
                      {selectedReport.moderator_notes}
                    </Alert>
                  </Grid>
                )}
                
                {selectedReport.action_taken && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Action Taken
                    </Typography>
                    <Alert severity="success" sx={{ mt: 1 }}>
                      {selectedReport.action_taken}
                    </Alert>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Report ID: {selectedReport.id} • Created: {format(new Date(selectedReport.created_at), 'PPpp')}
                    {selectedReport.updated_at && ` • Last Updated: ${format(new Date(selectedReport.updated_at), 'PPpp')}`}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Refreshing Overlay */}
      {refreshing && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default ReportAccount;