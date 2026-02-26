// src/components/dashboard-admin/components/Views/PaymentsView.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, TablePagination,
  Button, TextField, MenuItem, Select, FormControl,
  InputLabel, Grid, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert,
  Card, CardContent, LinearProgress,
  Tabs, Tab
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  BarChart as ChartIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useAdminData } from '../../../hooks/useAdminData';
import PaymentAnalytics from './payments/PayementAnalytics';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payments-tabpanel-${index}`}
      aria-labelledby={`payments-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PaymentsView = ({ payments: initialPayments, loading }) => {
  const { fetchPayments, adminApi, showSnackbar } = useAdminData();
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Payments state
  const [payments, setPayments] = useState(initialPayments || []);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    revenue: 0,
    avgAmount: 0
  });

  // Filtres
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });

  // Types de paiement
  const paymentTypes = [
    'certification',
    'post_boost',
    'subscription',
    'ad_campaign',
    'other'
  ];

  // Charger les paiements au montage
  useEffect(() => {
    fetchPayments();
  }, []);

  // Calculer les statistiques
  useEffect(() => {
    if (payments.length === 0) return;

    const total = payments.length;
    const completed = payments.filter(p => p.status === 'completed').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const failed = payments.filter(p => p.status === 'failed').length;
    
    const completedPayments = payments.filter(p => p.status === 'completed');
    const revenue = completedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const avgAmount = completed > 0 ? revenue / completed : 0;

    setStats({
      total,
      completed,
      pending,
      failed,
      revenue,
      avgAmount
    });
  }, [payments]);

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...payments];

    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(payment =>
        payment.user?.username?.toLowerCase().includes(searchLower) ||
        payment.user?.email?.toLowerCase().includes(searchLower) ||
        payment.payment_id?.toLowerCase().includes(searchLower) ||
        payment.stripe_payment_intent_id?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par statut
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(payment => payment.status === filters.status);
    }

    // Filtre par type
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(payment => payment.payment_type === filters.type);
    }

    // Filtre par date
    if (filters.dateFrom) {
      filtered = filtered.filter(payment => 
        new Date(payment.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(payment => 
        new Date(payment.created_at) <= new Date(filters.dateTo)
      );
    }

    // Filtre par montant
    if (filters.minAmount) {
      filtered = filtered.filter(payment => 
        parseFloat(payment.amount) >= parseFloat(filters.minAmount)
      );
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(payment => 
        parseFloat(payment.amount) <= parseFloat(filters.maxAmount)
      );
    }

    setFilteredPayments(filtered);
    setPage(0);
  }, [payments, filters]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  };

  const handleExport = async () => {
    try {
      const response = await adminApi.exportData('payments', 'csv');
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSnackbar('Payments exported successfully', 'success');
    } catch (error) {
      showSnackbar(`Error exporting payments: ${error.message}`, 'error');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckIcon color="success" />;
      case 'pending': return <PendingIcon color="warning" />;
      case 'failed': return <ErrorIcon color="error" />;
      default: return <PendingIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      case 'canceled': return 'default';
      default: return 'default';
    }
  };

  const getPaymentTypeLabel = (type) => {
    switch (type) {
      case 'certification': return 'Certification';
      case 'post_boost': return 'Post Boost';
      case 'subscription': return 'Subscription';
      case 'ad_campaign': return 'Ad Campaign';
      default: return type;
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Payments Management
          <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 0.5 }}>
            {activeTab === 0 ? `${filteredPayments.length} payments • ${formatCurrency(stats.revenue)} total revenue` : 'Payment Analytics & Insights'}
          </Typography>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchPayments()}
          >
            Refresh
          </Button>
          {activeTab === 0 && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export CSV
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs Navigation */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            bgcolor: 'white',
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#4F46E5'
              }
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#4F46E5',
              height: 3
            }
          }}
        >
          <Tab 
            icon={<PaymentIcon />} 
            iconPosition="start" 
            label="Payments List" 
          />
          <Tab 
            icon={<AnalyticsIcon />} 
            iconPosition="start" 
            label="Analytics Dashboard" 
          />
        </Tabs>

        {/* Payments List Tab */}
        <TabPanel value={activeTab} index={0}>
          {/* Statistiques */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={2}>
              <StatCard
                title="Total Payments"
                value={stats.total}
                icon={<PaymentIcon />}
                color="#2196f3"
                trend={0}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <StatCard
                title="Completed"
                value={stats.completed}
                icon={<CheckIcon />}
                color="#4caf50"
                trend={stats.completed > 0 ? (stats.completed / stats.total * 100).toFixed(1) : 0}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <StatCard
                title="Pending"
                value={stats.pending}
                icon={<PendingIcon />}
                color="#ff9800"
                trend={stats.pending > 0 ? (stats.pending / stats.total * 100).toFixed(1) : 0}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <StatCard
                title="Failed"
                value={stats.failed}
                icon={<ErrorIcon />}
                color="#f44336"
                trend={stats.failed > 0 ? (stats.failed / stats.total * 100).toFixed(1) : 0}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats.revenue)}
                icon={<MoneyIcon />}
                color="#9c27b0"
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <StatCard
                title="Avg. Amount"
                value={formatCurrency(stats.avgAmount)}
                icon={<TrendingIcon />}
                color="#00bcd4"
              />
            </Grid>
          </Grid>

          {/* Filtres avancés */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#f9fafb' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search payments..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="refunded">Refunded</MenuItem>
                    <MenuItem value="canceled">Canceled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    label="Type"
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {paymentTypes.map(type => (
                      <MenuItem key={type} value={type}>
                        {getPaymentTypeLabel(type)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="From Date"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="To Date"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={1}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FilterIcon />}
                  onClick={() => fetchPayments(filters)}
                  sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, minHeight: '40px' }}
                >
                  Filter
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Table des paiements */}
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Transaction</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">
                          No payments found. Try adjusting your filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((payment) => (
                        <TableRow key={payment.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {payment.stripe_payment_intent_id ? `PI-${payment.stripe_payment_intent_id.substring(0, 8)}` : `PAY-${payment.id}`}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                ID: {payment.id}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                src={payment.user?.profile?.image || ''}
                                sx={{ width: 32, height: 32 }}
                              >
                                {payment.user?.username?.[0]?.toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {payment.user?.username || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {payment.user?.email || ''}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getPaymentTypeLabel(payment.payment_type)}
                              size="small"
                              sx={{
                                bgcolor: payment.payment_type === 'certification' ? '#EEF2FF' : '#F3F4F6',
                                color: payment.payment_type === 'certification' ? '#4F46E5' : '#374151',
                                fontWeight: 600
                              }}
                            />
                            {payment.plan_type && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                                {payment.plan_type}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="bold" sx={{ color: '#4F46E5' }}>
                              {formatCurrency(payment.amount, payment.currency)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {payment.currency || 'USD'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getStatusIcon(payment.status)}
                              <Chip
                                label={payment.status}
                                color={getStatusColor(payment.status)}
                                size="small"
                                sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(payment.created_at).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(payment)}
                                sx={{ color: '#4F46E5' }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download Receipt">
                              <IconButton
                                size="small"
                                onClick={() => showSnackbar('Receipt download coming soon', 'info')}
                                sx={{ color: '#10B981' }}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredPayments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Payments per page:"
            />
          </Paper>
        </TabPanel>

        {/* Analytics Dashboard Tab */}
        <TabPanel value={activeTab} index={1}>
          <PaymentAnalytics />
        </TabPanel>
      </Paper>

      {/* Dialog de détails */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedPayment && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={700}>Payment Details</Typography>
                <Chip
                  label={selectedPayment.status}
                  color={getStatusColor(selectedPayment.status)}
                  icon={getStatusIcon(selectedPayment.status)}
                  sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Informations de base */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ fontWeight: 600 }}>
                    Transaction Information
                  </Typography>
                  <InfoGrid
                    items={[
                      { label: 'Transaction ID', value: selectedPayment.id },
                      { label: 'Payment Intent', value: selectedPayment.stripe_payment_intent_id || 'N/A' },
                      { label: 'Customer ID', value: selectedPayment.stripe_customer_id || 'N/A' },
                      { label: 'Payment Type', value: getPaymentTypeLabel(selectedPayment.payment_type) },
                      { label: 'Plan Type', value: selectedPayment.plan_type || 'N/A' },
                      { label: 'Created', value: new Date(selectedPayment.created_at).toLocaleString() },
                    ]}
                  />
                </Grid>

                {/* Informations utilisateur */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ fontWeight: 600 }}>
                    User Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      src={selectedPayment.user?.profile?.image || ''}
                      sx={{ width: 60, height: 60 }}
                    >
                      {selectedPayment.user?.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedPayment.user?.username}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {selectedPayment.user?.email}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        User ID: {selectedPayment.user?.id}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Informations de paiement */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ fontWeight: 600 }}>
                    Payment Information
                  </Typography>
                  <Card variant="outlined" sx={{ bgcolor: '#F9FAFB' }}>
                    <CardContent>
                      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#4F46E5', fontWeight: 700 }}>
                        {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">Currency:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedPayment.currency || 'USD'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">Payment Date:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleDateString() : 'Pending'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">Updated:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {new Date(selectedPayment.updated_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Informations supplémentaires */}
                {selectedPayment.metadata && Object.keys(selectedPayment.metadata).length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ fontWeight: 600 }}>
                      Additional Information
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F9FAFB' }}>
                      <pre style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                        {JSON.stringify(selectedPayment.metadata, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setDetailDialogOpen(false)}>
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => showSnackbar('Receipt download coming soon', 'info')}
                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
              >
                Download Receipt
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

// Composants d'aide
const StatCard = ({ title, value, icon, color, trend }) => (
  <Card sx={{ height: '100%', borderRadius: 2, borderTop: `3px solid ${color}` }}>
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ color, fontSize: 32, display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
        <Typography variant="h5" component="div" sx={{ color, fontWeight: 700 }}>
          {value}
        </Typography>
      </Box>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {title}
      </Typography>
      {trend > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="textSecondary">
            {trend}% of total
          </Typography>
          <LinearProgress
            variant="determinate"
            value={parseFloat(trend)}
            sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: `${color}20`, '& .MuiLinearProgress-bar': { bgcolor: color } }}
          />
        </Box>
      )}
    </CardContent>
  </Card>
);

const InfoGrid = ({ items }) => (
  <Grid container spacing={2}>
    {items.map((item, index) => (
      <Grid item xs={12} sm={6} key={index}>
        <Box sx={{ bgcolor: '#F9FAFB', p: 1.5, borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary" display="block">
            {item.label}
          </Typography>
          <Typography variant="body2" fontWeight="600">
            {item.value}
          </Typography>
        </Box>
      </Grid>
    ))}
  </Grid>
);

export default PaymentsView;