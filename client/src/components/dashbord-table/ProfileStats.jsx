// src/components/ProfileStats.jsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Paper,
  Divider,
  Stack,
  useTheme,
  Tab,
  Tabs,
  CircularProgress,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { format, subDays } from 'date-fns';

const ProfileStats = ({ stats, chartData }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // Données par défaut si stats est null
  const safeStats = stats || {};
  const safeChartData = chartData || {};

  // Données pour le graphique à barres (activité par jour)
  const chartDataByDay = safeChartData.my_reports_per_day || Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM dd'),
    count: Math.floor(Math.random() * 10)
  }));

  // Données pour le graphique circulaire (par type)
  const chartDataByType = Object.entries(safeChartData.my_reports_by_type || {}).map(([key, value]) => ({
    name: value.label || key,
    value: value.count || 0
  }));

  // Données pour la timeline
  const timelineData = safeChartData.my_reports_by_status || {};

  // Couleurs pour les graphiques
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  // Statistiques de résumé
  const summaryStats = [
    {
      label: 'Total Reports',
      value: safeStats.my_reports?.total || 0,
      change: '+12%',
      trend: 'up',
      icon: <BarChartIcon />
    },
    {
      label: 'Resolved',
      value: safeStats.my_reports_by_status?.resolved || 0,
      change: '+8%',
      trend: 'up',
      icon: <TrendingUpIcon />
    },
    {
      label: 'Pending',
      value: safeStats.my_reports_by_status?.pending || 0,
      change: '-3%',
      trend: 'down',
      icon: <InfoIcon />
    },
    {
      label: 'Avg. Resolution Time',
      value: safeStats.success_rate?.average_resolution_time || '24h',
      change: '-2h',
      trend: 'down',
      icon: <TimelineIcon />
    }
  ];

  // Taux de réussite
  const successRate = safeStats.success_rate?.resolved_percentage || 0;

  // Fonction pour exporter les données
  const handleExport = () => {
    const dataStr = JSON.stringify({
      stats: safeStats,
      chartData: safeChartData,
      exportedAt: new Date().toISOString()
    }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `profile-stats-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simuler un rafraîchissement
    setTimeout(() => setLoading(false), 1000);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête avec options */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="700">
          Detailed Statistics
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Data">
            <IconButton onClick={handleExport}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Statistiques de résumé */}
      <Grid container spacing={3} mb={4}>
        {summaryStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper 
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2,
                borderLeft: `4px solid ${COLORS[index % COLORS.length]}`,
                '&:hover': {
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" fontWeight="700" mt={1}>
                    {stat.value}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    {stat.trend === 'up' ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="error" fontSize="small" />
                    )}
                    <Typography 
                      variant="caption" 
                      color={stat.trend === 'up' ? 'success.main' : 'error.main'}
                      fontWeight="500"
                    >
                      {stat.change}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      from last month
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    backgroundColor: `${COLORS[index % COLORS.length]}15`,
                    borderRadius: '50%',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {React.cloneElement(stat.icon, {
                    sx: { color: COLORS[index % COLORS.length] }
                  })}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Taux de réussite */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6" fontWeight="600">
              Resolution Success Rate
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Percentage of reports successfully resolved
            </Typography>
          </Box>
          <Chip 
            label={`${successRate.toFixed(1)}%`} 
            color={successRate > 80 ? 'success' : successRate > 60 ? 'warning' : 'error'}
            size="medium"
          />
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={successRate}
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor: theme.palette.action.disabledBackground,
            '& .MuiLinearProgress-bar': {
              borderRadius: 6,
            }
          }}
        />
        <Grid container spacing={2} mt={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Target: 90%
            </Typography>
          </Grid>
          <Grid item xs={6} textAlign="right">
            <Typography variant="caption" color="text.secondary">
              Current: {successRate.toFixed(1)}%
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Onglets pour les graphiques */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="Analytics Charts"
          subheader="Visual representation of your profile statistics"
          action={
            <Tabs 
              value={activeTab} 
              onChange={(e, v) => setActiveTab(v)}
              sx={{ minHeight: 'auto' }}
            >
              <Tab 
                label="Activity" 
                icon={<BarChartIcon fontSize="small" />}
                sx={{ minHeight: 'auto', py: 1 }}
              />
              <Tab 
                label="Distribution" 
                icon={<PieChartIcon fontSize="small" />}
                sx={{ minHeight: 'auto', py: 1 }}
              />
              <Tab 
                label="Timeline" 
                icon={<TimelineIcon fontSize="small" />}
                sx={{ minHeight: 'auto', py: 1 }}
              />
            </Tabs>
          }
          sx={{ pb: 0 }}
        />
        <Divider />
        <CardContent sx={{ pt: 3 }}>
          {activeTab === 0 && (
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="date" 
                    stroke={theme.palette.text.secondary}
                    tick={{ fill: theme.palette.text.secondary }}
                  />
                  <YAxis 
                    stroke={theme.palette.text.secondary}
                    tick={{ fill: theme.palette.text.secondary }}
                  />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: theme.shape.borderRadius
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    name="Daily Reports"
                    fill={theme.palette.primary.main}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}

          {activeTab === 1 && (
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartDataByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartDataByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}

          {activeTab === 2 && (
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="date" 
                    stroke={theme.palette.text.secondary}
                    tick={{ fill: theme.palette.text.secondary }}
                  />
                  <YAxis 
                    stroke={theme.palette.text.secondary}
                    tick={{ fill: theme.palette.text.secondary }}
                  />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: theme.shape.borderRadius
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Report Trend"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Statistiques détaillées */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Reports by Type"
              subheader="Distribution of your submitted reports"
            />
            <Divider />
            <CardContent>
              {chartDataByType.length > 0 ? (
                <Stack spacing={2}>
                  {chartDataByType.map((item, index) => (
                    <Box key={index}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">
                          {item.name}
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {item.value}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(item.value / Math.max(...chartDataByType.map(d => d.value))) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: `${COLORS[index % COLORS.length]}30`,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: COLORS[index % COLORS.length],
                            borderRadius: 4,
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Alert severity="info">
                  No report type data available
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Status Overview"
              subheader="Current status of your reports"
            />
            <Divider />
            <CardContent>
              {Object.keys(timelineData).length > 0 ? (
                <Stack spacing={2}>
                  {Object.entries(timelineData).map(([status, data], index) => (
                    <Box key={status}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                          <Typography variant="body2">
                            {data.label || status}
                          </Typography>
                        </Box>
                        <Chip 
                          label={data.count || 0} 
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Alert severity="info">
                  No status data available
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Conseils et suggestions */}
      <Paper sx={{ p: 3, mt: 4, borderRadius: 2, bgcolor: 'info.light' }}>
        <Box display="flex" gap={2}>
          <InfoIcon color="info" />
          <Box>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Tips for Better Statistics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Submit detailed reports with clear descriptions
              • Follow up on pending reports regularly
              • Provide additional information when requested
              • Review resolved reports for learning
              • Maintain a consistent reporting schedule
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfileStats;