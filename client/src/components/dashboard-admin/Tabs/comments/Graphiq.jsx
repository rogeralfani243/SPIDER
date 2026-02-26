// src/components/dashboard-admin/Tabs/comments/CommentsAnalytics/CommentsAnalyticsTab.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  useTheme
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  CalendarToday as CalendarIcon,
  DateRange as DateRangeIcon,
  Today as TodayIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  InsertChart as ChartIcon,
  People as PeopleIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import useAdminApi from '../../../../hooks/useAdminApi';
import { formatCompactNumber } from '../../../../utils/formatters';
import PrintIcon from '@mui/icons-material/Print';
import html2canvas from 'html2canvas';
const COLORS = [
  '#1976d2', '#dc004e', '#ed6c02', '#2e7d32', '#9c27b0',
  '#ff9800', '#795548', '#607d8b', '#e91e63', '#3f51b5',
  '#009688', '#ff5722', '#673ab7', '#ffc107', '#4caf50'
];

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CommentsAnalyticsTab = () => {
  const theme = useTheme();
  const api = useAdminApi();
  
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('month'); // day, week, month, year - MUST match backend param name
  const [chartType, setChartType] = useState('line');
  const [geoLevel, setGeoLevel] = useState('country');
  
  // Data states - matching backend response structure
  const [timeData, setTimeData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [cityData, setCityData] = useState([]);
  const [summary, setSummary] = useState({
    total_comments: 0,
    avg_per_day: 0,
    peak_day: null,
    peak_day_count: 0,
    most_active_country: null,
    most_active_city: null,
    growth_rate: 0
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [range]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // API call with 'range' parameter (matching backend)
      const response = await api.getCommentsAnalytics({ range });
      
      if (response?.status === 'success' && response?.data) {
        const data = response.data;
        
        // 1. Time Data - exactly as returned from backend
        const formattedTimeData = (data.timeData || []).map(item => ({
          period: item.period,
          label: formatTimeLabel(item.period, range),
          comments: parseInt(item.comments) || 0,
          users: parseInt(item.users) || 0
        }));
        setTimeData(formattedTimeData);

        // 2. Country Data - from Profile.country
        const formattedCountryData = (data.countryData || []).map(item => ({
          country: item.country || 'Unknown',
          comments: parseInt(item.comments) || 0,
          users: parseInt(item.users) || 0,
          percentage: calculatePercentage(
            parseInt(item.comments), 
            data.summary?.total_comments
          )
        }));
        setCountryData(formattedCountryData);

        // 3. City Data - from Profile.city
        const formattedCityData = (data.cityData || []).map(item => ({
          city: item.city || 'Unknown',
          country: item.country || '',
          comments: parseInt(item.comments) || 0,
          users: parseInt(item.users) || 0,
          percentage: calculatePercentage(
            parseInt(item.comments), 
            data.summary?.total_comments
          )
        }));
        setCityData(formattedCityData);

        // 4. Summary - exactly as returned from backend
        if (data.summary) {
          setSummary({
            total_comments: data.summary.total_comments || 0,
            avg_per_day: data.summary.avg_per_day || 0,
            peak_day: data.summary.peak_day ? formatDateLabel(data.summary.peak_day, range) : 'N/A',
            peak_day_count: data.summary.peak_day_count || 0,
            most_active_country: data.summary.most_active_country || 'N/A',
            most_active_city: data.summary.most_active_city || 'N/A',
            growth_rate: data.summary.growth_rate || 0
          });
        }
      }
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError(err.response?.data?.message || err.message || 'Error loading analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Format time label based on range type
  const formatTimeLabel = (period, rangeType) => {
    if (!period) return '';
    
    const date = new Date(period);
    
    switch (rangeType) {
      case 'day':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      case 'week':
      case 'month':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case 'year':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
      default:
        return period;
    }
  };

  // Format peak day label
  const formatDateLabel = (dateString, rangeType) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    
    switch (rangeType) {
      case 'day':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      case 'week':
      case 'month':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case 'year':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
      default:
        return date.toLocaleDateString();
    }
  };

  // Calculate percentage
  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  // Get label for time range chip
  const getTimeRangeLabel = () => {
    switch (range) {
      case 'day': return 'Hourly';
      case 'week': return 'Daily';
      case 'month': return 'Daily';
      case 'year': return 'Monthly';
      default: return 'Daily';
    }
  };

  // Handlers
  const handleRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setRange(newRange);
    }
  };

  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const handleGeoLevelChange = (event) => {
    setGeoLevel(event.target.value);
  };
// src/components/dashboard-admin/Tabs/comments/CommentsAnalytics/CommentsAnalyticsTab.jsx

// Fonction d'impression corrigée
const handlePrint = async () => {
  try {
    // Créer le contenu HTML complet d'abord
    let fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comments Analytics Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 30px;
              margin: 0;
              color: #333;
            }
            h1 { 
              color: #1976d2; 
              border-bottom: 2px solid #1976d2;
              padding-bottom: 10px;
            }
            h2 { color: #1976d2; margin-top: 30px; }
            h3 { color: #555; margin-top: 20px; }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            .summary-card {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              background: white;
            }
            .chart-container {
              margin: 20px 0;
              text-align: center;
            }
            img {
              max-width: 100%;
              height: auto;
              border: 1px solid #eee;
              border-radius: 4px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #999;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
    `;

    // Ajouter l'en-tête
    fullHTML += `
      <h1>Comments Analytics Report</h1>
      <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Period:</strong> ${range === 'day' ? 'Daily' : range === 'week' ? 'Weekly' : range === 'month' ? 'Monthly' : 'Yearly'}</p>
    `;

    // Ajouter les cartes de résumé
    fullHTML += `<div class="summary-grid">`;
    fullHTML += `
      <div class="summary-card">
        <h4 style="margin:0; color:#666; font-size:14px;">Total Comments</h4>
        <div style="font-size:28px; font-weight:bold; color:#1976d2; margin-top:10px;">${formatCompactNumber(summary.total_comments)}</div>
      </div>
      <div class="summary-card">
        <h4 style="margin:0; color:#666; font-size:14px;">Avg per Day</h4>
        <div style="font-size:28px; font-weight:bold; color:#2e7d32; margin-top:10px;">${formatCompactNumber(summary.avg_per_day)}</div>
      </div>
      <div class="summary-card">
        <h4 style="margin:0; color:#666; font-size:14px;">Peak Day</h4>
        <div style="font-size:18px; font-weight:bold; margin-top:10px;">${summary.peak_day}</div>
        <div style="font-size:12px; color:#666;">${formatCompactNumber(summary.peak_day_count)} comments</div>
      </div>
      <div class="summary-card">
        <h4 style="margin:0; color:#666; font-size:14px;">Growth Rate</h4>
        <div style="font-size:28px; font-weight:bold; color:${summary.growth_rate >= 0 ? '#2e7d32' : '#d32f2f'}; margin-top:10px;">
          ${summary.growth_rate > 0 ? '+' : ''}${summary.growth_rate}%
        </div>
      </div>
    `;
    fullHTML += `</div>`;

    // Capturer les graphiques et attendre qu'ils soient prêts
    const chartContainers = document.querySelectorAll('.recharts-wrapper');
    const chartImages = [];

    for (let i = 0; i < chartContainers.length; i++) {
      try {
        // Attendre que le graphique soit rendu
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(chartContainers[i], {
          scale: 2, // Meilleure qualité
          backgroundColor: '#ffffff',
          allowTaint: true,
          useCORS: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        chartImages.push(imgData);
        
        // Ajouter le titre du graphique
        fullHTML += `<h2>${i === 0 ? 'Comments Over Time' : 'Geographic Distribution'}</h2>`;
        fullHTML += `<div class="chart-container">`;
        fullHTML += `<img src="${imgData}" alt="${i === 0 ? 'Time Chart' : 'Geo Chart'}" />`;
        fullHTML += `</div>`;
        
      } catch (error) {
        console.error(`Error capturing chart ${i}:`, error);
        fullHTML += `<p style="color: red;">Error loading chart ${i === 0 ? 'time' : 'geo'}</p>`;
      }
    }

    // Ajouter le tableau des top pays/villes
    const geoData = geoLevel === 'country' ? countryData : cityData;
    if (geoData && geoData.length > 0) {
      fullHTML += `<h2>Top ${geoLevel === 'country' ? 'Countries' : 'Cities'}</h2>`;
      fullHTML += `
        <table style="width:100%; border-collapse: collapse; margin-top:20px;">
          <thead>
            <tr style="background-color: #1976d2; color: white;">
              <th style="padding: 10px; text-align: left;">Rank</th>
              <th style="padding: 10px; text-align: left;">${geoLevel === 'country' ? 'Country' : 'City'}</th>
              <th style="padding: 10px; text-align: right;">Comments</th>
              <th style="padding: 10px; text-align: right;">Users</th>
              <th style="padding: 10px; text-align: right;">%</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      geoData.slice(0, 10).forEach((item, index) => {
        fullHTML += `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px;">#${index + 1}</td>
            <td style="padding: 8px;">
              ${geoLevel === 'country' ? item.country : item.city}
              ${item.country && geoLevel === 'city' ? `, ${item.country}` : ''}
            </td>
            <td style="padding: 8px; text-align: right;">${formatCompactNumber(item.comments)}</td>
            <td style="padding: 8px; text-align: right;">${formatCompactNumber(item.users)}</td>
            <td style="padding: 8px; text-align: right;">${item.percentage}%</td>
          </tr>
        `;
      });
      
      fullHTML += `</tbody></table>`;
    }

    // Ajouter l'engagement utilisateur
    fullHTML += `<h2 style="margin-top:40px;">User Engagement</h2>`;
    fullHTML += `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">`;
    
    // Comments per User
    const commentsPerUser = summary.total_comments > 0 && timeData.length > 0
      ? (summary.total_comments / Math.max(timeData.reduce((acc, d) => acc + d.users, 0), 1)).toFixed(1)
      : '0.0';
    
    fullHTML += `
      <div style="border:1px solid #ddd; border-radius:8px; padding:20px; text-align:center;">
        <div style="color:#666; font-size:14px;">Comments per User</div>
        <div style="font-size:32px; font-weight:bold; color:#1976d2; margin-top:10px;">${commentsPerUser}</div>
        <div style="color:#999; font-size:12px; margin-top:5px;">average</div>
      </div>
    `;
    
    // Active Users
    const activeUsers = timeData.reduce((acc, d) => acc + d.users, 0);
    fullHTML += `
      <div style="border:1px solid #ddd; border-radius:8px; padding:20px; text-align:center;">
        <div style="color:#666; font-size:14px;">Active Users</div>
        <div style="font-size:32px; font-weight:bold; color:#2e7d32; margin-top:10px;">${formatCompactNumber(activeUsers)}</div>
        <div style="color:#999; font-size:12px; margin-top:5px;">unique commenters</div>
      </div>
    `;
    
    // Comments per period
    fullHTML += `
      <div style="border:1px solid #ddd; border-radius:8px; padding:20px; text-align:center;">
        <div style="color:#666; font-size:14px;">
          Comments per ${range === 'day' ? 'Hour' : range === 'week' ? 'Day' : range === 'month' ? 'Day' : 'Month'}
        </div>
        <div style="font-size:32px; font-weight:bold; color:#0288d1; margin-top:10px;">
          ${formatCompactNumber(Math.round(summary.avg_per_day))}
        </div>
        <div style="color:#999; font-size:12px; margin-top:5px;">average</div>
      </div>
    `;
    
    fullHTML += `</div>`;

    // Ajouter le pied de page
    fullHTML += `
      <div class="footer">
        <p>Report generated from Admin Dashboard</p>
        <p>© ${new Date().getFullYear()} - All rights reserved  Spider App</p>
      </div>
    `;

    // Fermer le HTML
    fullHTML += `
        </body>
      </html>
    `;

    // Créer un blob pour ouvrir dans une nouvelle fenêtre
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Ouvrir la fenêtre d'impression
    const printWindow = window.open(url, '_blank');
    
    // Nettoyer l'URL après un délai
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

  } catch (error) {
    console.error('Error generating print preview:', error);
    alert('Error generating print preview. Please try again.');
  }
};
  
// Export data
  const exportData = () => {
    const exportData = {
      generated_at: new Date().toISOString(),
      range,
      summary,
      time_series: timeData,
      geographic: {
        countries: countryData,
        cities: cityData
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `comments-analytics-${range}-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Render time chart
  const renderTimeChart = () => {
    if (!timeData || timeData.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography color="textSecondary">No data available for this period</Typography>
        </Box>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="comments" fill={theme.palette.primary.main} name="Comments" />
            <Bar dataKey="users" fill={theme.palette.secondary.main} name="Unique Users" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="comments" 
              stroke={theme.palette.primary.main} 
              fill={theme.palette.primary.light} 
              fillOpacity={0.3}
              name="Comments"
            />
            <Area 
              type="monotone" 
              dataKey="users" 
              stroke={theme.palette.secondary.main} 
              fill={theme.palette.secondary.light} 
              fillOpacity={0.3}
              name="Unique Users"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <RechartsTooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="comments" 
            stroke={theme.palette.primary.main} 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            name="Comments"
          />
          <Line 
            type="monotone" 
            dataKey="users" 
            stroke={theme.palette.secondary.main} 
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Unique Users"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render geographic chart
  const renderGeoChart = () => {
    const data = geoLevel === 'country' ? countryData : cityData;
    const displayKey = geoLevel === 'country' ? 'country' : 'city';
    
    if (!data || data.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography color="textSecondary">No geographic data available</Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.slice(0, 5)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="comments"
                nameKey={displayKey}
              >
                {data.slice(0, 5).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: 300, overflow: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon fontSize="small" color="primary" />
              Top {geoLevel === 'country' ? 'Countries' : 'Cities'}
            </Typography>
            <Box sx={{ mt: 2 }}>
              {data.slice(0, 10).map((item, index) => (
                <Box
                  key={item[displayKey] || index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: index < data.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ minWidth: 24 }}>
                      #{index + 1}
                    </Typography>
                    <Box>
                      <Typography variant="body2">
                        {item[displayKey]}
                        {item.country && geoLevel === 'city' && `, ${item.country}`}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {item.percentage}% of total
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCompactNumber(item.comments)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatCompactNumber(item.users)} users
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" gutterBottom>
              Time Range
            </Typography>
            <ToggleButtonGroup
              value={range}
              exclusive
              onChange={handleRangeChange}
              size="small"
              fullWidth
            >
              <ToggleButton value="day">
                <TodayIcon sx={{ mr: 1 }} /> Day
              </ToggleButton>
              <ToggleButton value="week">
                <DateRangeIcon sx={{ mr: 1 }} /> Week
              </ToggleButton>
              <ToggleButton value="month">
                <CalendarIcon sx={{ mr: 1 }} /> Month
              </ToggleButton>
              <ToggleButton value="year">
                <CalendarIcon sx={{ mr: 1 }} /> Year
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" gutterBottom>
              Chart Type
            </Typography>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              size="small"
              fullWidth
            >
              <ToggleButton value="line">
                <TimelineIcon sx={{ mr: 1 }} /> Line
              </ToggleButton>
              <ToggleButton value="bar">
                <BarChartIcon sx={{ mr: 1 }} /> Bar
              </ToggleButton>
              <ToggleButton value="area">
                <ChartIcon sx={{ mr: 1 }} /> Area
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" gutterBottom>
              Geographic Level
            </Typography>
            <FormControl fullWidth size="small">
              <Select value={geoLevel} onChange={handleGeoLevelChange}>
                <MenuItem value="country">
                  <PublicIcon sx={{ mr: 1, fontSize: 18 }} /> By Country
                </MenuItem>
                <MenuItem value="city">
                  <LocationIcon sx={{ mr: 1, fontSize: 18 }} /> By City
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" gutterBottom>
              Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadAnalyticsData}
                fullWidth
                size="small"
                disabled={loading}
              >
                Refresh
              </Button>
               <Tooltip title="Export Data">
      <IconButton onClick={exportData} size="small" disabled={loading}>
        <DownloadIcon />
      </IconButton>
    </Tooltip>
    <Tooltip title="Print Report">
      <IconButton onClick={handlePrint} size="small" disabled={loading} color="primary">
        <PrintIcon />
      </IconButton>
    </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Comments
                  </Typography>
                  <Typography variant="h4">
                    {loading ? <CircularProgress size={30} /> : formatCompactNumber(summary.total_comments)}
                  </Typography>
                </Box>
                <CommentIcon sx={{ fontSize: 40, color: 'primary.light', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Avg per Day
                  </Typography>
                  <Typography variant="h4">
                    {formatCompactNumber(summary.avg_per_day)}
                  </Typography>
                </Box>
                <TodayIcon sx={{ fontSize: 40, color: 'success.light', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Peak Day
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {summary.peak_day}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatCompactNumber(summary.peak_day_count)} comments
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.light', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Growth Rate
                  </Typography>
                  <Typography 
                    variant="h4"
                    color={summary.growth_rate >= 0 ? 'success.main' : 'error.main'}
                  >
                    {summary.growth_rate > 0 ? '+' : ''}{summary.growth_rate}%
                  </Typography>
                </Box>
                {summary.growth_rate >= 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'success.light', opacity: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 40, color: 'error.light', opacity: 0.5 }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Comments Over Time Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimelineIcon color="primary" />
              Comments Over Time
            </Typography>
            <Chip
              label={getTimeRangeLabel()}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderTimeChart()
          )}
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PublicIcon color="primary" />
              Geographic Distribution
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {summary.most_active_country !== 'N/A' && (
                <Chip
                  icon={<PublicIcon />}
                  label={`Top Country: ${summary.most_active_country}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {summary.most_active_city !== 'N/A' && (
                <Chip
                  icon={<LocationIcon />}
                  label={`Top City: ${summary.most_active_city}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderGeoChart()
          )}
        </CardContent>
      </Card>

      {/* User Engagement */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon color="primary" />
            User Engagement
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Comments per User
                </Typography>
                <Typography variant="h3" color="primary.main">
                  {summary.total_comments > 0 && timeData.length > 0
                    ? (summary.total_comments / 
                       Math.max(timeData.reduce((acc, d) => acc + d.users, 0), 1)).toFixed(1)
                    : '0.0'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  average
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Active Users
                </Typography>
                <Typography variant="h3" color="success.main">
                  {formatCompactNumber(timeData.reduce((acc, d) => acc + d.users, 0))}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  unique commenters
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Comments per {range === 'day' ? 'Hour' : 
                               range === 'week' ? 'Day' : 
                               range === 'month' ? 'Day' : 'Month'}
                </Typography>
                <Typography variant="h3" color="info.main">
                  {formatCompactNumber(Math.round(summary.avg_per_day))}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  average
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CommentsAnalyticsTab;