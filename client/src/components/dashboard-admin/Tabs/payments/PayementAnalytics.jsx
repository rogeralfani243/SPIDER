import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, TextField,
  Button, ToggleButton, ToggleButtonGroup, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, CircularProgress, Alert, Divider, Stack,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  Radio, RadioGroup, FormControlLabel, FormLabel,Avatar
} from '@mui/material';
import {
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  GetApp as GetAppIcon,
  Share as ShareIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, ComposedChart, Scatter
} from 'recharts';
import { useAdminData } from '../../../../hooks/useAdminData';
import useAdminApi from '../../../../hooks/useAdminApi';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

// Custom Dialog for Download Options
const DownloadDialog = ({ open, onClose, onDownload, chartRefs }) => {
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(2);
  const [selectedChart, setSelectedChart] = useState('all');

  const handleDownload = () => {
    onDownload(selectedChart, format, quality);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DownloadIcon sx={{ color: '#4F46E5' }} />
          <Typography variant="h6" fontWeight={700}>
            Download Charts
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Box>
            <FormLabel sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
              Select Charts
            </FormLabel>
            <RadioGroup value={selectedChart} onChange={(e) => setSelectedChart(e.target.value)}>
              <FormControlLabel value="all" control={<Radio />} label="All Charts" />
              <FormControlLabel value="revenue" control={<Radio />} label="Revenue Overview" />
              <FormControlLabel value="types" control={<Radio />} label="Payment Types" />
              <FormControlLabel value="geographic" control={<Radio />} label="Geographic Distribution" />
              <FormControlLabel value="status" control={<Radio />} label="Payment Status" />
              <FormControlLabel value="trends" control={<Radio />} label="Trends & Forecast" />
            </RadioGroup>
          </Box>

          <Box>
            <FormLabel sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
              Format
            </FormLabel>
            <RadioGroup row value={format} onChange={(e) => setFormat(e.target.value)}>
              <FormControlLabel value="png" control={<Radio />} label="PNG" />
              <FormControlLabel value="jpeg" control={<Radio />} label="JPEG" />
              <FormControlLabel value="webp" control={<Radio />} label="WebP" />
            </RadioGroup>
          </Box>

          <Box>
            <FormLabel sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
              Quality
            </FormLabel>
            <RadioGroup row value={quality} onChange={(e) => setQuality(Number(e.target.value))}>
              <FormControlLabel value={1} control={<Radio />} label="Standard" />
              <FormControlLabel value={2} control={<Radio />} label="HD" />
              <FormControlLabel value={3} control={<Radio />} label="4K" />
            </RadioGroup>
          </Box>

          <Button
            variant="contained"
            onClick={handleDownload}
            startIcon={<GetAppIcon />}
            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
          >
            Download
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

// KPI Card Component
const KPICard = ({ title, value, subtitle, icon, color, trend, trendValue }) => {
  return (
    <Card sx={{ 
      height: '100%', 
      borderRadius: 2,
      borderTop: `3px solid ${color}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 20px -10px rgba(0,0,0,0.1)'
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: color, mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
            {trend === 'up' ? (
              <TrendingUpIcon sx={{ color: '#10B981', fontSize: 16 }} />
            ) : (
              <TrendingDownIcon sx={{ color: '#EF4444', fontSize: 16 }} />
            )}
            <Typography variant="caption" sx={{ 
              color: trend === 'up' ? '#10B981' : '#EF4444',
              fontWeight: 600
            }}>
              {trendValue}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              vs last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Main Payment Analytics Component
const PaymentAnalytics = () => {
  const { showSnackbar } = useAdminData();
  const { fetchPaymentAnalytics } = useAdminApi();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  
  // Filter states
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [paymentType, setPaymentType] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  
  // Chart references for download
  const revenueChartRef = useRef(null);
  const typesChartRef = useRef(null);
  const geographicChartRef = useRef(null);
  const statusChartRef = useRef(null);
  const trendsChartRef = useRef(null);
  
  // Download dialog state
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  
  // Colors for charts
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
  const STATUS_COLORS = {
    completed: '#10B981',
    pending: '#F59E0B',
    failed: '#EF4444',
    refunded: '#8B5CF6',
    canceled: '#6B7280'
  };
  const PAYMENT_TYPE_COLORS = {
    certification: '#4F46E5',
    post_boost: '#F59E0B',
    other: '#6B7280'
  };

  // Fetch analytics data
  useEffect(() => {
    fetchData();
  }, [period, startDate, endDate, paymentType, country, city]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        period,
        start_date: startDate,
        end_date: endDate,
        payment_type: paymentType || undefined,
        country: country || undefined,
        city: city || undefined
      };
      
      const data = await fetchPaymentAnalytics(params);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching payment analytics:', err);
      setError('Failed to load payment analytics data');
      showSnackbar('Error loading analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle download with html2canvas
  const handleDownload = async (chartSelection, format, quality) => {
    try {
      const scale = quality === 1 ? 2 : quality === 2 ? 3 : 4;
      const charts = [];
      
      if (chartSelection === 'all' || chartSelection === 'revenue') {
        if (revenueChartRef.current) charts.push({ ref: revenueChartRef, name: 'revenue-overview' });
      }
      if (chartSelection === 'all' || chartSelection === 'types') {
        if (typesChartRef.current) charts.push({ ref: typesChartRef, name: 'payment-types' });
      }
      if (chartSelection === 'all' || chartSelection === 'geographic') {
        if (geographicChartRef.current) charts.push({ ref: geographicChartRef, name: 'geographic-distribution' });
      }
      if (chartSelection === 'all' || chartSelection === 'status') {
        if (statusChartRef.current) charts.push({ ref: statusChartRef, name: 'payment-status' });
      }
      if (chartSelection === 'all' || chartSelection === 'trends') {
        if (trendsChartRef.current) charts.push({ ref: trendsChartRef, name: 'trends-forecast' });
      }

      for (const chart of charts) {
        const canvas = await html2canvas(chart.ref.current, {
          scale: scale,
          backgroundColor: '#ffffff',
          allowTaint: true,
          useCORS: true,
          logging: false
        });
        
        canvas.toBlob((blob) => {
          saveAs(blob, `${chart.name}-${new Date().toISOString().split('T')[0]}.${format}`);
        }, `image/${format}`);
      }

      showSnackbar(`Downloaded ${charts.length} chart(s) successfully`, 'success');
    } catch (err) {
      console.error('Error downloading charts:', err);
      showSnackbar('Error downloading charts', 'error');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Get trend icon
  const getTrendIcon = (value) => {
    if (value > 0) return { icon: <TrendingUpIcon />, color: '#10B981', text: `+${value}%` };
    if (value < 0) return { icon: <TrendingDownIcon />, color: '#EF4444', text: `${value}%` };
    return { icon: null, color: '#6B7280', text: '0%' };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#4F46E5' }} />
      </Box>
    );
  }

  if (error || !analyticsData) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error || 'No data available'}
      </Alert>
    );
  }

  const { summary, time_series, by_payment_type, by_status, by_country, by_city, period_summary } = analyticsData;
  const trend = getTrendIcon(summary?.revenue_growth || 0);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with filters and download */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#4F46E5', mb: 1 }}>
            Payment Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive payment insights and metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            sx={{ borderColor: '#4F46E5', color: '#4F46E5' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => setDownloadDialogOpen(true)}
            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
          >
            Download Charts
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: '#f9fafb' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Period</InputLabel>
              <Select value={period} onChange={(e) => setPeriod(e.target.value)} label="Period">
                <MenuItem value="day">Daily</MenuItem>
                <MenuItem value="week">Weekly</MenuItem>
                <MenuItem value="month">Monthly</MenuItem>
                <MenuItem value="year">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Type</InputLabel>
              <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} label="Payment Type">
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="certification">Certification</MenuItem>
                <MenuItem value="post_boost">Post Boost</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <TextField
              fullWidth
              size="small"
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Filter"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <TextField
              fullWidth
              size="small"
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Filter"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value={formatCurrency(summary?.total_revenue)}
            subtitle={`${formatNumber(summary?.total_payments)} payments`}
            icon={<MoneyIcon />}
            color="#4F46E5"
            trend={summary?.revenue_growth > 0 ? 'up' : 'down'}
            trendValue={trend.text}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Completed Payments"
            value={formatNumber(summary?.completed_payments)}
            subtitle={`${summary?.conversion_rate}% conversion rate`}
            icon={<CheckIcon />}
            color="#10B981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Avg Payment Value"
            value={formatCurrency(summary?.avg_payment_value)}
            subtitle="Per transaction"
            icon={<CartIcon />}
            color="#F59E0B"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Unique Customers"
            value={formatNumber(summary?.unique_customers)}
            subtitle={`${formatCurrency(summary?.revenue_per_customer)} avg per customer`}
            icon={<PeopleIcon />}
            color="#8B5CF6"
          />
        </Grid>
      </Grid>

      {/* Period Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Period Summary
          </Typography>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ bgcolor: '#EEF2FF', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Today</Typography>
              <Typography variant="h6" sx={{ color: '#4F46E5', fontWeight: 700 }}>
                {formatCurrency(period_summary?.today?.amount || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {period_summary?.today?.payments || 0} payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ bgcolor: '#F1F5F9', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Yesterday</Typography>
              <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 700 }}>
                {formatCurrency(period_summary?.yesterday?.amount || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {period_summary?.yesterday?.payments || 0} payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ bgcolor: '#F0FDF4', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">This Week</Typography>
              <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 700 }}>
                {formatCurrency(period_summary?.this_week?.amount || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {period_summary?.this_week?.payments || 0} payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ bgcolor: '#FFFBEB', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">This Month</Typography>
              <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                {formatCurrency(period_summary?.this_month?.amount || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {period_summary?.this_month?.payments || 0} payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ bgcolor: '#FEF2F2', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">This Year</Typography>
              <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 700 }}>
                {formatCurrency(period_summary?.this_year?.amount || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {period_summary?.this_year?.payments || 0} payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue Trend Chart */}
      <Paper ref={revenueChartRef} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon sx={{ color: '#4F46E5' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Revenue Trend ({period}ly)
            </Typography>
          </Box>
          <Chip 
            label={`${time_series?.length || 0} periods`}
            size="small"
            sx={{ bgcolor: '#EEF2FF', color: '#4F46E5' }}
          />
        </Box>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={time_series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="period" />
            <YAxis yAxisId="left" orientation="left" stroke="#4F46E5" />
            <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
            <RechartsTooltip 
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(label) => `Period: ${label}`}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="amount"
              name="Revenue"
              stroke="#4F46E5"
              fill="#4F46E5"
              fillOpacity={0.1}
            />
            <Bar
              yAxisId="right"
              dataKey="payments"
              name="Number of Payments"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="average"
              name="Average Amount"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Paper>

      {/* Payment Types and Status Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper ref={typesChartRef} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <PieChartIcon sx={{ color: '#4F46E5' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Payment Types Distribution
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={by_payment_type}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total_amount"
                  nameKey="display_name"
                >
                  {by_payment_type?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PAYMENT_TYPE_COLORS[entry.type] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2 }}>
              {by_payment_type?.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: PAYMENT_TYPE_COLORS[item.type] || COLORS[index % COLORS.length] }} />
                    <Typography variant="body2">{item.display_name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(item.total_amount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.count} payments
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper ref={statusChartRef} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <BarChartIcon sx={{ color: '#4F46E5' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Payment Status Breakdown
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={by_status}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="display_name" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value, name) => {
                    if (name === 'total_amount') return formatCurrency(value);
                    return value;
                  }}
                />
                <Bar dataKey="count" name="Number of Payments" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_amount" name="Total Amount" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={1}>
                {by_status?.map((item, index) => (
                  <Grid item xs={6} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#f9fafb', borderRadius: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_COLORS[item.status] || COLORS[index % COLORS.length] }} />
                      <Box>
                        <Typography variant="caption" display="block">{item.display_name}</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {item.count} ({((item.count / summary?.total_payments) * 100).toFixed(1)}%)
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Geographic Analytics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper ref={geographicChartRef} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <PublicIcon sx={{ color: '#4F46E5' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Top Countries by Revenue
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={by_country?.slice(0, 10)} 
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="country" />
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total_amount" name="Revenue" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <LocationIcon sx={{ color: '#4F46E5' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Top Cities by Revenue
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Revenue</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Payments</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Customers</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {by_city?.slice(0, 10).map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{item.city}</TableCell>
                      <TableCell>{item.country}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#4F46E5' }}>
                        {formatCurrency(item.total_amount)}
                      </TableCell>
                      <TableCell align="right">{item.payments}</TableCell>
                      <TableCell align="right">{item.unique_users}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Trends and Forecast */}
      <Paper ref={trendsChartRef} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <TrendingUpIcon sx={{ color: '#4F46E5' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Performance Metrics
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#f9fafb', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Conversion Rate
                </Typography>
                <Typography variant="h3" sx={{ color: '#4F46E5', fontWeight: 700 }}>
                  {summary?.conversion_rate}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completed vs Total Payments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#f9fafb', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Revenue per Customer
                </Typography>
                <Typography variant="h3" sx={{ color: '#10B981', fontWeight: 700 }}>
                  {formatCurrency(summary?.revenue_per_customer)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Average lifetime value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#f9fafb', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Revenue Growth
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h3" sx={{ 
                    color: summary?.revenue_growth > 0 ? '#10B981' : '#EF4444', 
                    fontWeight: 700 
                  }}>
                    {summary?.revenue_growth > 0 ? '+' : ''}{summary?.revenue_growth}%
                  </Typography>
                  {summary?.revenue_growth > 0 ? (
                    <TrendingUpIcon sx={{ color: '#10B981', fontSize: 32 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: '#EF4444', fontSize: 32 }} />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  vs previous period
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Detailed Table */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Payment Types Detailed Breakdown
        </Typography>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Payment Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Count</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Average Amount</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Completion Rate</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>% of Revenue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {by_payment_type?.map((item, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: PAYMENT_TYPE_COLORS[item.type] || COLORS[index % COLORS.length] 
                      }} />
                      <Typography variant="body2" fontWeight={500}>
                        {item.display_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{formatNumber(item.count)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#4F46E5' }}>
                    {formatCurrency(item.total_amount)}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(item.avg_amount)}</TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`${item.completion_rate?.toFixed(1)}%`}
                      size="small"
                      sx={{ 
                        bgcolor: item.completion_rate > 80 ? '#D1FAE5' : '#FEF3C7',
                        color: item.completion_rate > 80 ? '#065F46' : '#92400E',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {((item.total_amount / summary?.total_revenue) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Download Dialog */}
      <DownloadDialog
        open={downloadDialogOpen}
        onClose={() => setDownloadDialogOpen(false)}
        onDownload={handleDownload}
        chartRefs={{
          revenue: revenueChartRef,
          types: typesChartRef,
          geographic: geographicChartRef,
          status: statusChartRef,
          trends: trendsChartRef
        }}
      />
    </Box>
  );
};

export default PaymentAnalytics;