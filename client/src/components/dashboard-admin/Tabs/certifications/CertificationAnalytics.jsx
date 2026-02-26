import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
  TextField,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Collapse,
  Badge
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  InsertChart as LineChartIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  CheckCircle as ActiveIcon,
  Cancel as ExpiredIcon,
  HourglassEmpty as PendingIcon,
  Block as RevokedIcon,
  VerifiedUser as VerifiedIcon,
  Whatshot as FireIcon,
  Star as PremiumIcon,
  People as InfluencerIcon,
  Map as MapIcon,
  ShowChart as ShowChartIcon,
  TableChart as TableChartIcon,
  SaveAlt as SaveAltIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { useAdminData } from '../../../../hooks/useAdminData';
import useAdminApi from '../../../../hooks/useAdminApi';
import html2canvas from 'html2canvas';
import { format, parseISO } from 'date-fns';

// Color palette for charts - Matching backend colors
const COLORS = {
  primary: '#4F46E5',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  gray: '#6B7280',
  premium: '#FFD700',
  fire: '#FF5722',
  verified: '#1DA1F2',
  influencer: '#9C27B0',
  active: '#10B981',
  expired: '#EF4444',
  pending: '#F59E0B',
  revoked: '#6B7280'
};

const CHART_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#FFD700', '#FF5722', '#1DA1F2', '#9C27B0', '#6B7280', '#8B5CF6'];

const CertificationAnalyticsView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states - Matching backend parameters exactly
  const [filters, setFilters] = useState({
    time_range: 'month',
    start_date: '',
    end_date: '',
    country: '',
    city: '',
    state: '',
    certification_type: '',
    status: '',
    group_by: 'time',
    chart_type: 'line'
  });

  // UI states
  const [activeTimeChart, setActiveTimeChart] = useState('monthly');
  const [geoView, setGeoView] = useState('countries');
  const [distributionView, setDistributionView] = useState('type');

  // Refs for chart capture
  const summaryRef = useRef(null);
  const timeChartRef = useRef(null);
  const geoChartRef = useRef(null);
  const distributionChartRef = useRef(null);

  const { showSnackbar } = useAdminData();
  const { getCertificationAnalytics } = useAdminApi();

  // ===========================================
  // EXTRACT COUNTRIES FROM TOP USERS - SOLUTION PRINCIPALE
  // ===========================================
  const getCountriesFromTopUsers = () => {
    if (!analyticsData?.summary?.top_users) return [];
    
    const countryCount = {};
    
    analyticsData.summary.top_users.forEach(user => {
      const location = user.location;
      if (!location || location === 'N/A') return;
      
      // Format: "City, State, Country" ou "City, Country"
      const parts = location.split(',').map(p => p.trim());
      const country = parts[parts.length - 1]; // Dernier élément = pays
      
      if (country) {
        countryCount[country] = (countryCount[country] || 0) + 1;
      }
    });
    
    return Object.entries(countryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // ===========================================
  // EXTRACT CITIES FROM TOP USERS - SOLUTION PRINCIPALE
  // ===========================================
  const getCitiesFromTopUsers = () => {
    if (!analyticsData?.summary?.top_users) return [];
    
    const cityCount = {};
    
    analyticsData.summary.top_users.forEach(user => {
      const location = user.location;
      if (!location || location === 'N/A') return;
      
      // Format: "City, State, Country"
      const [city] = location.split(',').map(p => p.trim());
      
      if (city) {
        cityCount[city] = (cityCount[city] || 0) + 1;
      }
    });
    
    return Object.entries(cityCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // ===========================================
  // GET UNIQUE COUNTRIES - PRIORITÉ AUX TOP USERS
  // ===========================================
  const getUniqueCountries = () => {
    // D'abord essayer les top_users (données réelles complètes)
    const countriesFromUsers = getCountriesFromTopUsers().map(c => c.name);
    if (countriesFromUsers.length > 0) {
      return countriesFromUsers;
    }
    
    // Fallback: données du backend (limitées à 10)
    if (analyticsData?.geographic?.countries?.labels) {
      return analyticsData.geographic.countries.labels;
    }
    
    return [];
  };

  // ===========================================
  // GET UNIQUE CITIES - PRIORITÉ AUX TOP USERS
  // ===========================================
  const getUniqueCities = () => {
    // D'abord essayer les top_users (données réelles complètes)
    const citiesFromUsers = getCitiesFromTopUsers().map(c => c.name);
    if (citiesFromUsers.length > 0) {
      return citiesFromUsers;
    }
    
    // Fallback: données du backend (limitées à 10)
    if (analyticsData?.geographic?.cities?.labels) {
      return analyticsData.geographic.cities.labels.map(label => label.split(', ')[0]);
    }
    
    return [];
  };

  // ===========================================
  // GET GEO CHART DATA - PRIORITÉ AUX TOP USERS
  // ===========================================
  const getGeoChartData = () => {
    switch (geoView) {
      case 'countries':
        // D'abord les pays des top_users
        const countriesFromUsers = getCountriesFromTopUsers();
        if (countriesFromUsers.length > 0) {
          return countriesFromUsers;
        }
        // Fallback: données du backend
        if (analyticsData?.geographic?.countries?.labels) {
          return analyticsData.geographic.countries.labels.map((label, index) => ({
            name: label,
            value: analyticsData.geographic.countries.data[index] || 0
          }));
        }
        break;
        
      case 'cities':
        // D'abord les villes des top_users
        const citiesFromUsers = getCitiesFromTopUsers();
        if (citiesFromUsers.length > 0) {
          return citiesFromUsers;
        }
        // Fallback: données du backend
        if (analyticsData?.geographic?.cities?.labels) {
          return analyticsData.geographic.cities.labels.map((label, index) => ({
            name: label.split(', ')[0],
            fullName: label,
            value: analyticsData.geographic.cities.data[index] || 0
          }));
        }
        break;
        
      case 'continents':
        // Fallback: données du backend uniquement
        if (analyticsData?.geographic?.continents?.labels) {
          return analyticsData.geographic.continents.labels.map((label, index) => ({
            name: label,
            value: analyticsData.geographic.continents.data[index] || 0
          }));
        }
        break;
    }
    
    return [];
  };

  // Certification types
  const certificationTypes = [
    { value: '', label: 'All Types' },
    { value: 'premium', label: 'Premium', color: COLORS.premium },
    { value: 'fire', label: 'Fire', color: COLORS.fire },
    { value: 'verified', label: 'Verified', color: COLORS.verified },
    { value: 'influencer', label: 'Influencer', color: COLORS.influencer }
  ];

  // Status options matching backend
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active', color: COLORS.active },
    { value: 'expired', label: 'Expired', color: COLORS.error },
    { value: 'pending', label: 'Pending', color: COLORS.warning },
    { value: 'revoked', label: 'Revoked', color: COLORS.gray }
  ];

  // Time range options
  const timeRanges = [
    { value: 'day', label: 'Last 24 Hours' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'year', label: 'Last 365 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Group by options
  const groupByOptions = [
    { value: 'time', label: 'Time' },
    { value: 'country', label: 'Country' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'type', label: 'Certification Type' },
    { value: 'status', label: 'Status' },
    { value: 'all', label: 'All' }
  ];

  // Fetch analytics data from backend
  const fetchAnalyticsData = useCallback(async (appliedFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean filters - remove empty values
      const cleanFilters = Object.fromEntries(
        Object.entries(appliedFilters).filter(([_, value]) => value !== '' && value !== null)
      );
      
      const response = await getCertificationAnalytics(cleanFilters);
      
      if (response?.status === 'success') {
        setAnalyticsData(response);
        showSnackbar('Analytics data updated successfully', 'success');
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Error fetching certification analytics');
      showSnackbar('Error loading analytics data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, getCertificationAnalytics, showSnackbar]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Handle filter changes
  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleTimeRangeChange = (event, newRange) => {
    if (newRange) {
      setFilters(prev => ({
        ...prev,
        time_range: newRange,
        ...(newRange !== 'custom' && { start_date: '', end_date: '' })
      }));
    }
  };

  const handleClearFilters = () => {
    setFilters({
      time_range: 'month',
      start_date: '',
      end_date: '',
      country: '',
      city: '',
      state: '',
      certification_type: '',
      status: '',
      group_by: 'time',
      chart_type: 'line'
    });
    fetchAnalyticsData({
      time_range: 'month',
      group_by: 'time',
      chart_type: 'line'
    });
    showSnackbar('Filters cleared', 'info');
  };

  const handleApplyFilters = () => {
    fetchAnalyticsData(filters);
    setShowFilters(false);
    showSnackbar('Filters applied', 'success');
  };

  // Chart capture function
  const captureChartAsImage = async (element) => {
    if (!element) return null;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        useCORS: true
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing chart:', error);
      return null;
    }
  };

  // Generate custom pie chart image for print
  const generatePieChartImage = (data, title, dataKey = 'value', nameKey = 'name') => {
    if (!data || data.length === 0) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 24px "Roboto", Arial, sans-serif';
    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 50);
    
    ctx.font = '14px "Roboto", Arial, sans-serif';
    ctx.fillStyle = '#6B7280';
    ctx.fillText(`Generated: ${format(new Date(), 'PPP p')}`, canvas.width / 2, 80);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 50;
    const radius = Math.min(centerX, centerY) - 120;
    
    let startAngle = 0;
    const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);
    
    data.slice(0, 8).forEach((item, index) => {
      const value = item[dataKey] || 0;
      const sliceAngle = (value / total) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = CHART_COLORS[index % CHART_COLORS.length];
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      const labelAngle = startAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      ctx.font = 'bold 14px "Roboto", Arial, sans-serif';
      ctx.fillStyle = '#1F2937';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const percentage = ((value / total) * 100).toFixed(1);
      ctx.fillText(`${item[nameKey] || 'N/A'} (${percentage}%)`, labelX, labelY);
      
      startAngle = endAngle;
    });
    
    const legendX = 50;
    let legendY = canvas.height - 220;
    
    ctx.font = 'bold 16px "Roboto", Arial, sans-serif';
    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'left';
    ctx.fillText('Top Locations:', legendX, legendY);
    legendY += 30;
    
    data.slice(0, 8).forEach((item, index) => {
      ctx.fillStyle = CHART_COLORS[index % CHART_COLORS.length];
      ctx.fillRect(legendX, legendY - 12, 20, 20);
      
      ctx.font = '14px "Roboto", Arial, sans-serif';
      ctx.fillStyle = '#374151';
      ctx.fillText(`${item[nameKey] || 'N/A'}: ${item[dataKey]} certifications`, legendX + 30, legendY);
      
      legendY += 28;
    });
    
    ctx.font = '12px "Roboto", Arial, sans-serif';
    ctx.fillStyle = '#9CA3AF';
    ctx.textAlign = 'center';
    ctx.fillText('Spider Admin Dashboard - Certification Analytics', canvas.width / 2, canvas.height - 30);
    
    return canvas.toDataURL('image/png');
  };

  // Print handler
  const handlePrint = useCallback(async () => {
    setCapturing(true);
    showSnackbar('Preparing certification report for printing...', 'info');
    
    try {
      const timeChartImage = await captureChartAsImage(timeChartRef.current);
      
      let geoChartImage = null;
      const geoChartData = getGeoChartData();
      if (geoChartData.length > 0) {
        geoChartImage = generatePieChartImage(
          geoChartData,
          `Certifications by ${geoView.charAt(0).toUpperCase() + geoView.slice(1)}`
        );
      }
      
      let distributionImage = null;
      if (analyticsData?.charts?.distribution) {
        const distData = distributionView === 'type' 
          ? analyticsData.charts.distribution.by_type
          : analyticsData.charts.distribution.by_status;
        const formattedDistData = distData.labels.map((label, index) => ({
          name: label,
          value: distData.data[index] || 0
        }));
        distributionImage = generatePieChartImage(
          formattedDistData,
          `Certifications by ${distributionView === 'type' ? 'Type' : 'Status'}`
        );
      }
      
      const summaryImage = await captureChartAsImage(summaryRef.current);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showSnackbar('Please allow pop-ups to print', 'warning');
        setCapturing(false);
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Certification Analytics Report</title>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Roboto', Arial, sans-serif; padding: 40px; background: white; color: #1F2937; margin: 0; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; }
              .header h1 { color: #1F2937; font-size: 32px; margin: 0; }
              .header p { color: #6B7280; font-size: 14px; margin: 10px 0 0; }
              .section { margin: 40px 0; page-break-inside: avoid; }
              .section-title { color: #1F2937; font-size: 24px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; margin-bottom: 20px; }
              .chart-container { margin: 20px 0; text-align: center; background: white; padding: 20px; border: 1px solid #E5E7EB; border-radius: 12px; }
              .chart-image { max-width: 100%; height: auto; border-radius: 8px; }
              .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
              .summary-card { border: 1px solid #E5E7EB; padding: 20px; border-radius: 12px; background: #F9FAFB; text-align: center; }
              .summary-card h3 { margin: 0 0 10px 0; color: #6B7280; font-size: 14px; font-weight: 500; }
              .summary-card p { margin: 0; font-size: 32px; font-weight: 700; color: #1F2937; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
              th { background: #4F46E5; color: white; font-weight: 500; padding: 12px; text-align: left; }
              td { padding: 12px; border-bottom: 1px solid #E5E7EB; }
              .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 20px; }
              @media print { body { print-color-adjust: exact; } th { background: #4F46E5 !important; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📊 Certification Analytics Report</h1>
              <p>
                Generated on: ${format(new Date(), 'PPP p')} | 
                Time Range: <strong>${filters.time_range}</strong> |
                ${filters.country ? `Country: <strong>${filters.country}</strong> |` : ''}
                ${filters.city ? `City: <strong>${filters.city}</strong>` : ''}
              </p>
            </div>

            ${summaryImage ? `
              <div class="section">
                <h2 class="section-title">📈 Summary Statistics</h2>
                <div class="chart-container">
                  <img src="${summaryImage}" alt="Summary Statistics" class="chart-image" />
                </div>
              </div>
            ` : ''}

            ${timeChartImage ? `
              <div class="section">
                <h2 class="section-title">📅 Certifications by ${activeTimeChart}</h2>
                <div class="chart-container">
                  <img src="${timeChartImage}" alt="Time Analytics Chart" class="chart-image" />
                </div>
              </div>
            ` : ''}

            ${geoChartImage ? `
              <div class="section">
                <h2 class="section-title">🌍 Certifications by ${geoView}</h2>
                <div class="chart-container">
                  <img src="${geoChartImage}" alt="Geographic Analytics Chart" class="chart-image" />
                </div>
              </div>
            ` : ''}

            ${distributionImage ? `
              <div class="section">
                <h2 class="section-title">📊 Certifications by ${distributionView === 'type' ? 'Type' : 'Status'}</h2>
                <div class="chart-container">
                  <img src="${distributionImage}" alt="Distribution Chart" class="chart-image" />
                </div>
              </div>
            ` : ''}

            <div class="footer">
              <p>Generated by Spider Admin Dashboard - Certification Analytics</p>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      showSnackbar('Print preview ready', 'success');
    } catch (error) {
      console.error('Error generating print:', error);
      showSnackbar('Error preparing print view', 'error');
    } finally {
      setCapturing(false);
    }
  }, [analyticsData, filters, activeTimeChart, geoView, distributionView, showSnackbar]);

  // Download as PDF
  const handleDownloadPDF = useCallback(async () => {
    setCapturing(true);
    showSnackbar('Generating PDF report...', 'info');
    
    try {
      const jsPDF = (await import('jspdf')).default;
      const summaryImage = await captureChartAsImage(summaryRef.current);
      const timeChartImage = await captureChartAsImage(timeChartRef.current);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.text('Certification Analytics', 20, 25);
      
      pdf.setFontSize(12);
      pdf.text(`Generated: ${format(new Date(), 'PPP p')}`, 20, 55);
      pdf.text(`Time Range: ${filters.time_range}`, 20, 62);
      
      if (summaryImage) {
        pdf.addPage();
        pdf.setFontSize(20);
        pdf.setTextColor(79, 70, 229);
        pdf.text('Summary Statistics', 20, 20);
        const imgWidth = 170;
        const imgHeight = (imgWidth * 3) / 4;
        pdf.addImage(summaryImage, 'PNG', 20, 35, imgWidth, imgHeight);
      }
      
      if (timeChartImage) {
        pdf.addPage();
        pdf.setFontSize(20);
        pdf.setTextColor(79, 70, 229);
        pdf.text(`Certifications by ${activeTimeChart}`, 20, 20);
        const imgWidth = 170;
        const imgHeight = (imgWidth * 3) / 4;
        pdf.addImage(timeChartImage, 'PNG', 20, 35, imgWidth, imgHeight);
      }
      
      pdf.save(`certification-analytics-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
      showSnackbar('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showSnackbar('Error generating PDF', 'error');
    } finally {
      setCapturing(false);
    }
  }, [analyticsData, filters, activeTimeChart, showSnackbar]);

  // Download as CSV
  const handleDownloadCSV = useCallback(() => {
    if (!analyticsData) return;
    
    try {
      // Geographic data CSV - Utiliser les pays des top_users
      const countriesData = getCountriesFromTopUsers();
      if (countriesData.length > 0) {
        let geoCsv = 'Country,Total Certifications\n';
        countriesData.forEach(item => {
          geoCsv += `${item.name},${item.value}\n`;
        });
        
        const geoBlob = new Blob([geoCsv], { type: 'text/csv' });
        const geoUrl = window.URL.createObjectURL(geoBlob);
        const geoLink = document.createElement('a');
        geoLink.href = geoUrl;
        geoLink.download = `certifications-geo-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        geoLink.click();
      }
      
      // Top users CSV
      if (analyticsData.summary?.top_users) {
        let usersCsv = 'Username,User ID,Location,Certification Count\n';
        analyticsData.summary.top_users.forEach(user => {
          usersCsv += `${user.username},${user.user_id},${user.location},${user.certification_count}\n`;
        });
        
        const usersBlob = new Blob([usersCsv], { type: 'text/csv' });
        const usersUrl = window.URL.createObjectURL(usersBlob);
        const usersLink = document.createElement('a');
        usersLink.href = usersUrl;
        usersLink.download = `certifications-top-users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        usersLink.click();
      }
      
      showSnackbar('CSV files downloaded successfully', 'success');
    } catch (error) {
      console.error('Error generating CSV:', error);
      showSnackbar('Error generating CSV files', 'error');
    }
  }, [analyticsData, showSnackbar]);

  // ===========================================
  // RENDER TIME CHART - USING BACKEND DATA
  // ===========================================
  const renderTimeChart = () => {
    if (!analyticsData?.charts?.time_series) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography color="textSecondary">No time series data available</Typography>
        </Box>
      );
    }

    const timeSeries = analyticsData.charts.time_series;
    let chartData = [];

    switch (activeTimeChart) {
      case 'monthly':
        chartData = timeSeries.monthly.labels.map((label, index) => ({
          period: label,
          total: timeSeries.monthly.datasets[0]?.data[index] || 0,
          premium: timeSeries.monthly.datasets[1]?.data[index] || 0,
          fire: timeSeries.monthly.datasets[2]?.data[index] || 0,
          verified: timeSeries.monthly.datasets[3]?.data[index] || 0,
          influencer: timeSeries.monthly.datasets[4]?.data[index] || 0
        }));
        break;
      case 'daily':
        chartData = timeSeries.daily.labels.map((label, index) => ({
          period: label,
          value: timeSeries.daily.data[index] || 0
        }));
        break;
      case 'weekly':
        chartData = timeSeries.weekly.labels.map((label, index) => ({
          period: label,
          value: timeSeries.weekly.data[index] || 0
        }));
        break;
      case 'yearly':
        chartData = timeSeries.yearly.labels.map((label, index) => ({
          period: label,
          value: timeSeries.yearly.data[index] || 0
        }));
        break;
      case 'hourly':
        chartData = timeSeries.hourly.labels.map((label, index) => ({
          period: label,
          value: timeSeries.hourly.data[index] || 0
        }));
        break;
      case 'weekday':
        chartData = timeSeries.weekday.labels.map((label, index) => ({
          period: label,
          value: timeSeries.weekday.data[index] || 0
        }));
        break;
    }

    switch (filters.chart_type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {activeTimeChart === 'monthly' ? (
                <>
                  <Bar dataKey="total" fill={COLORS.primary} name="Total" />
                  <Bar dataKey="premium" fill={COLORS.premium} name="Premium" />
                  <Bar dataKey="fire" fill={COLORS.fire} name="Fire" />
                  <Bar dataKey="verified" fill={COLORS.verified} name="Verified" />
                  <Bar dataKey="influencer" fill={COLORS.influencer} name="Influencer" />
                </>
              ) : (
                <Bar dataKey="value" fill={COLORS.primary} name="Certifications" />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {activeTimeChart === 'monthly' ? (
                <>
                  <Line type="monotone" dataKey="total" stroke={COLORS.primary} name="Total" />
                  <Line type="monotone" dataKey="premium" stroke={COLORS.premium} name="Premium" />
                  <Line type="monotone" dataKey="fire" stroke={COLORS.fire} name="Fire" />
                  <Line type="monotone" dataKey="verified" stroke={COLORS.verified} name="Verified" />
                  <Line type="monotone" dataKey="influencer" stroke={COLORS.influencer} name="Influencer" />
                </>
              ) : (
                <Line type="monotone" dataKey="value" stroke={COLORS.primary} name="Certifications" />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ period, value }) => `${period}: ${value}`}
                outerRadius={150}
                dataKey={activeTimeChart === 'monthly' ? 'total' : 'value'}
                nameKey="period"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  // ===========================================
  // RENDER GEOGRAPHIC CHART - USING TOP USERS DATA
  // ===========================================
  const renderGeoChart = () => {
    const chartData = getGeoChartData();
    
    if (chartData.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography color="textSecondary">No geographic data available</Typography>
        </Box>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, value, percent }) => 
              `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
            }
            outerRadius={150}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // ===========================================
  // RENDER DISTRIBUTION CHART - USING BACKEND DATA
  // ===========================================
  const renderDistributionChart = () => {
    if (!analyticsData?.charts?.distribution) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography color="textSecondary">No distribution data available</Typography>
        </Box>
      );
    }

    const distribution = analyticsData.charts.distribution;
    const chartData = distributionView === 'type' ? distribution.by_type : distribution.by_status;
    
    const formattedData = chartData.labels.map((label, index) => ({
      name: label,
      value: chartData.data[index] || 0,
      color: chartData.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
            outerRadius={100}
            dataKey="value"
            nameKey="name"
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Get status chip props
  const getStatusChipProps = (status) => {
    switch (status) {
      case 'active':
        return { color: 'success', icon: <ActiveIcon />, label: 'Active' };
      case 'expired':
        return { color: 'error', icon: <ExpiredIcon />, label: 'Expired' };
      case 'pending':
        return { color: 'warning', icon: <PendingIcon />, label: 'Pending' };
      case 'revoked':
        return { color: 'default', icon: <RevokedIcon />, label: 'Revoked' };
      default:
        return { color: 'default', icon: null, label: status };
    }
  };

  if (loading && !analyticsData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} sx={{ color: COLORS.primary }} />
          <Typography variant="body1" sx={{ mt: 2, color: '#6B7280' }}>
            Loading certification analytics...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert 
          severity="error" 
          variant="filled"
          sx={{ borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchAnalyticsData()} sx={{ color: 'white' }}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #e54646ff 0%, #971313ff 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Certification Analytics
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Comprehensive overview of certification performance and distribution
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              {filters.country && (
                <Chip 
                  label={`Country: ${filters.country}`} 
                  size="small"
                  onDelete={() => {
                    setFilters(prev => ({ ...prev, country: '' }));
                    fetchAnalyticsData({ ...filters, country: '' });
                  }}
                  sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              )}
              {filters.city && (
                <Chip 
                  label={`City: ${filters.city}`} 
                  size="small"
                  onDelete={() => {
                    setFilters(prev => ({ ...prev, city: '' }));
                    fetchAnalyticsData({ ...filters, city: '' });
                  }}
                  sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Toggle Filters">
              <Badge color="error" variant="dot" invisible={!filters.country && !filters.city}>
                <IconButton 
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
                >
                  <FilterIcon />
                </IconButton>
              </Badge>
            </Tooltip>
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={() => fetchAnalyticsData()} 
                disabled={capturing}
                sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Report">
              <IconButton 
                onClick={handlePrint} 
                disabled={capturing}
                sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadCSV}
              disabled={capturing}
              sx={{ bgcolor: 'white', color: COLORS.primary }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={handleDownloadPDF}
              disabled={capturing}
              sx={{ bgcolor: 'white', color: COLORS.primary }}
            >
              PDF
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Filters Panel - USING TOP USERS DATA */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #E5E7EB' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              <FilterIcon sx={{ mr: 1, verticalAlign: 'middle', color: COLORS.primary }} />
              Filters
            </Typography>
            <Button startIcon={<ClearIcon />} onClick={handleClearFilters} size="small">
              Clear All
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {/* Time Range */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Time Range</InputLabel>
                <Select value={filters.time_range} onChange={handleTimeRangeChange} label="Time Range">
                  {timeRanges.map(range => (
                    <MenuItem key={range.value} value={range.value}>{range.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Custom Date Range */}
            {filters.time_range === 'custom' && (
              <>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth size="small" label="Start Date" type="date" 
                    value={filters.start_date} onChange={handleFilterChange('start_date')} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth size="small" label="End Date" type="date" 
                    value={filters.end_date} onChange={handleFilterChange('end_date')} InputLabelProps={{ shrink: true }} />
                </Grid>
              </>
            )}

            {/* Country Filter - FROM TOP USERS */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Country</InputLabel>
                <Select value={filters.country} onChange={handleFilterChange('country')} label="Country">
                  <MenuItem value=""><em>All Countries</em></MenuItem>
                  {getUniqueCountries().map(country => (
                    <MenuItem key={country} value={country}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PublicIcon sx={{ mr: 1, fontSize: 18, color: '#6B7280' }} />
                        {country}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* City Filter - FROM TOP USERS */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>City</InputLabel>
                <Select value={filters.city} onChange={handleFilterChange('city')} label="City">
                  <MenuItem value=""><em>All Cities</em></MenuItem>
                  {getUniqueCities().map(city => (
                    <MenuItem key={city} value={city}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ mr: 1, fontSize: 18, color: '#6B7280' }} />
                        {city}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* State Filter */}
            <Grid item xs={12} md={3}>
              <TextField fullWidth size="small" label="State/Province" 
                value={filters.state} onChange={handleFilterChange('state')} placeholder="e.g., California" />
            </Grid>

            {/* Certification Type */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Certification Type</InputLabel>
                <Select value={filters.certification_type} onChange={handleFilterChange('certification_type')} label="Certification Type">
                  {certificationTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: type.color || COLORS.gray, mr: 1 }} />
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={filters.status} onChange={handleFilterChange('status')} label="Status">
                  {statusOptions.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: status.color || COLORS.gray, mr: 1 }} />
                        {status.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Chart Type */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Chart Type</InputLabel>
                <Select value={filters.chart_type} onChange={handleFilterChange('chart_type')} label="Chart Type">
                  <MenuItem value="line">Line Chart</MenuItem>
                  <MenuItem value="bar">Bar Chart</MenuItem>
                  <MenuItem value="pie">Pie Chart</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Group By */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Group By</InputLabel>
                <Select value={filters.group_by} onChange={handleFilterChange('group_by')} label="Group By">
                  {groupByOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" onClick={handleApplyFilters} sx={{ bgcolor: COLORS.primary, px: 4 }}>
              Apply Filters
            </Button>
          </Box>
        </Paper>
      </Collapse>

      {/* Summary Cards */}
      <Box ref={summaryRef}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
              <CardContent>
                <Typography color="#6B7280" gutterBottom sx={{ fontSize: 14, fontWeight: 500 }}>
                  Total Certifications
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937' }}>
                  {analyticsData?.summary?.total || 0}
                </Typography>
                <Chip size="small" label={`+${analyticsData?.summary?.new_last_24h || 0} in 24h`}
                  sx={{ mt: 1, bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 600 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
              <CardContent>
                <Typography color="#6B7280" gutterBottom sx={{ fontSize: 14, fontWeight: 500 }}>
                  Active
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.active }}>
                  {analyticsData?.summary?.active || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
                  {analyticsData?.summary?.active_percentage || 0}% of total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
              <CardContent>
                <Typography color="#6B7280" gutterBottom sx={{ fontSize: 14, fontWeight: 500 }}>
                  Expired
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.error }}>
                  {analyticsData?.summary?.expired || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
              <CardContent>
                <Typography color="#6B7280" gutterBottom sx={{ fontSize: 14, fontWeight: 500 }}>
                  Pending
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.warning }}>
                  {analyticsData?.summary?.pending || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
                  Revoked: {analyticsData?.summary?.revoked || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Trends Section */}
      {analyticsData?.trends && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #E5E7EB', bgcolor: '#F9FAFB' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {analyticsData.trends.growth_direction === 'up' ? (
                  <TrendingUpIcon sx={{ fontSize: 48, color: COLORS.success, mr: 2 }} />
                ) : analyticsData.trends.growth_direction === 'down' ? (
                  <TrendingDownIcon sx={{ fontSize: 48, color: COLORS.error, mr: 2 }} />
                ) : (
                  <TrendingFlatIcon sx={{ fontSize: 48, color: COLORS.gray, mr: 2 }} />
                )}
                <Box>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>Growth Rate</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 
                    analyticsData.trends.growth_direction === 'up' ? COLORS.success :
                    analyticsData.trends.growth_direction === 'down' ? COLORS.error : COLORS.gray
                  }}>
                    {analyticsData.trends.growth_rate > 0 ? '+' : ''}{analyticsData.trends.growth_rate}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>Peak Month</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{analyticsData.trends.peak_month || 'N/A'}</Typography>
              <Typography variant="body2" sx={{ color: COLORS.primary }}>{analyticsData.trends.peak_value} certifications</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>Monthly Average</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{analyticsData.trends.average_monthly}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Time Series Chart */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle', color: COLORS.primary }} />
            Certifications by Time Period
          </Typography>
          <Stack direction="row" spacing={2}>
            <ToggleButtonGroup value={activeTimeChart} exclusive onChange={(e, v) => v && setActiveTimeChart(v)} size="small">
              <ToggleButton value="daily">Daily</ToggleButton>
              <ToggleButton value="weekly">Weekly</ToggleButton>
              <ToggleButton value="monthly">Monthly</ToggleButton>
              <ToggleButton value="yearly">Yearly</ToggleButton>
              <ToggleButton value="hourly">Hourly</ToggleButton>
              <ToggleButton value="weekday">Weekday</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Box ref={timeChartRef}>{renderTimeChart()}</Box>
      </Paper>

      {/* =========================================== */}
      {/* GEOGRAPHIC ANALYTICS - USING TOP USERS DATA */}
      {/* =========================================== */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                <PublicIcon sx={{ mr: 1, verticalAlign: 'middle', color: COLORS.primary }} />
                Geographic Distribution
              </Typography>
              <ToggleButtonGroup value={geoView} exclusive onChange={(e, v) => v && setGeoView(v)} size="small">
                <ToggleButton value="countries">Countries</ToggleButton>
                <ToggleButton value="cities">Cities</ToggleButton>
                <ToggleButton value="continents">Continents</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Box ref={geoChartRef}>{renderGeoChart()}</Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              <MapIcon sx={{ mr: 1, verticalAlign: 'middle', color: COLORS.primary }} />
              Top {geoView.charAt(0).toUpperCase() + geoView.slice(1)}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ flex: 1, overflow: 'auto', maxHeight: 400 }}>
              {geoView === 'countries' && getCountriesFromTopUsers().slice(0, 10).map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: index < 9 ? '1px solid #F3F4F6' : 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLORS[index % CHART_COLORS.length], mr: 1.5 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.name}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary }}>{item.value}</Typography>
                </Box>
              ))}
              
              {geoView === 'cities' && getCitiesFromTopUsers().slice(0, 10).map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: index < 9 ? '1px solid #F3F4F6' : 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLORS[index % CHART_COLORS.length], mr: 1.5 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.name}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary }}>{item.value}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Distribution Charts & Top Users */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                <PieChartIcon sx={{ mr: 1, verticalAlign: 'middle', color: COLORS.primary }} />
                Certification Distribution
              </Typography>
              <ToggleButtonGroup value={distributionView} exclusive onChange={(e, v) => v && setDistributionView(v)} size="small">
                <ToggleButton value="type">By Type</ToggleButton>
                <ToggleButton value="status">By Status</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Box ref={distributionChartRef}>{renderDistributionChart()}</Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>👥 Top Users by Certifications</Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                    <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Certifications</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData?.summary?.top_users?.map((user, index) => (
                    <TableRow key={user.user_id || index} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar  src={user.profile__image} sx={{ width: 32, height: 32, mr: 1.5, bgcolor: CHART_COLORS[index % CHART_COLORS.length] }}>
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{user.username || 'N/A'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>{user.location || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={user.certification_count} size="small" sx={{ bgcolor: '#EEF2FF', color: COLORS.primary, fontWeight: 600 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CertificationAnalyticsView;