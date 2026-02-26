import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Alert,
  useTheme
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAdminData } from '../../../../hooks/useAdminData';
import useAdminApi from '../../../../hooks/useAdminApi';

// Import des sous-composants
import AnalyticsHeader from './AnalyticsHeader';
import KPICards from './KPICards';
import RegistrationChart from './RegistrationChart';
import AnalyticsChartsGrid from './AnalyticsChartsGrid';
import MonthlyTrendAndContributors from './MonthlyTrendAndContributors';
import AnalyticsLoading from './AnalyticsLoading';
import AnalyticsError from './AnalyticsError';
import ReportGenerator from './ReportGenerator';

// Constantes globales
export const COLORS = {
  primary: '#2196F3',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  purple: '#9C27B0',
  teal: '#00BCD4',
  pink: '#E91E63',
  indigo: '#3F51B5',
  amber: '#FFC107',
  cyan: '#00BCD4'
};

export const CHART_COLORS = [
  '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#E91E63', '#3F51B5', '#FFC107', '#795548'
];

const UsersAnalyticsView = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [chartType, setChartType] = useState('bar');
  const [geoType, setGeoType] = useState('country');
  const [activeMetric, setActiveMetric] = useState('posts');
  const [capturing, setCapturing] = useState(false);
  
  const [timeData, setTimeData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [geoData, setGeoData] = useState([]);
  const [topUsers, setTopUsers] = useState({
    by_posts: [],
    by_comments: [],
    by_reports: [],
    by_reports_received: []
  });
  const [summary, setSummary] = useState({});
  
  const timeChartRef = useRef(null);
  const geoChartRef = useRef(null);
  const statusChartRef = useRef(null);
  const activityChartRef = useRef(null);
  const monthlyChartRef = useRef(null);
  
  const { showSnackbar } = useAdminData();
  const { getUsersAnalytics } = useAdminApi();

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getUsersAnalytics({
        timeRange,
        geoType
      });
      
      if (response.status === 'success') {
        setTimeData(response.data.time_analytics || []);
        setStatusData(response.data.status_analytics || []);
        setMonthlyData(response.data.monthly_analytics || []);
        setActivityData(response.data.activity_analytics || []);
        setGeoData(response.data.geo_analytics || []);
        setTopUsers(response.data.top_users || {
          by_posts: [],
          by_comments: [],
          by_reports: [],
          by_reports_received: []
        });
        setSummary(response.data.summary || {});
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Error fetching analytics');
      showSnackbar('Error loading analytics data', 'error');
    } finally {
      setLoading(false);
    }
  }, [timeRange, geoType, getUsersAnalytics, showSnackbar]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Handle time range change
  const handleTimeRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  // Handle chart type change
  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  // Handle geo type change
  const handleGeoTypeChange = (event) => {
    setGeoType(event.target.value);
  };

  // Handle metric change
  const handleMetricChange = (event, newMetric) => {
    if (newMetric !== null) {
      setActiveMetric(newMetric);
    }
  };

  // Handlers pour les rapports
  const handlePrint = useCallback(() => {
    ReportGenerator.handlePrint({
      timeRange,
      geoType,
      timeData,
      geoData,
      statusData,
      activityData,
      monthlyData,
      topUsers,
      summary,
      timeChartRef,
      geoChartRef,
      statusChartRef,
      activityChartRef,
      monthlyChartRef,
      showSnackbar,
      setCapturing
    });
  }, [timeRange, geoType, timeData, geoData, statusData, activityData, monthlyData, topUsers, summary, showSnackbar]);

  const handleDownloadPDF = useCallback(() => {
    ReportGenerator.handleDownloadPDF({
      timeRange,
      geoType,
      summary,
      timeChartRef,
      geoChartRef,
      showSnackbar,
      setCapturing
    });
  }, [timeRange, geoType, summary, showSnackbar]);

  const handleDownloadCSV = useCallback(() => {
    ReportGenerator.handleDownloadCSV({
      timeData,
      statusData,
      activityData,
      geoData,
      monthlyData,
      summary,
      timeRange,
      geoType,
      showSnackbar
    });
  }, [timeData, statusData, activityData, geoData, monthlyData, summary, timeRange, geoType, showSnackbar]);

  if (loading) {
    return <AnalyticsLoading />;
  }

  if (error) {
    return <AnalyticsError error={error} onRetry={fetchAnalyticsData} />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <AnalyticsHeader 
        capturing={capturing}
        onRefresh={fetchAnalyticsData}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
        onDownloadCSV={handleDownloadCSV}
      />
      
      <KPICards summary={summary} />
      
      <RegistrationChart 
        timeData={timeData}
        timeRange={timeRange}
        chartType={chartType}
        onTimeRangeChange={handleTimeRangeChange}
        onChartTypeChange={handleChartTypeChange}
        chartRef={timeChartRef}
      />
      
      <AnalyticsChartsGrid 
        statusData={statusData}
        activityData={activityData}
        geoData={geoData}
        geoType={geoType}
        onGeoTypeChange={handleGeoTypeChange}
        statusChartRef={statusChartRef}
        activityChartRef={activityChartRef}
        geoChartRef={geoChartRef}
      />
      
      <MonthlyTrendAndContributors 
        monthlyData={monthlyData}
        topUsers={topUsers}
        activeMetric={activeMetric}
        onMetricChange={handleMetricChange}
        monthlyChartRef={monthlyChartRef}
      />
    </Box>
  );
};

export default UsersAnalyticsView;