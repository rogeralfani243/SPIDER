// src/components/dashboard-admin/components/Views/PostsAnalyticsView.jsx
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
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  InsertChart as LineChartIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon
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
  AreaChart
} from 'recharts';
import { useAdminData } from '../../../../hooks/useAdminData';
import useAdminApi from '../../../../hooks/useAdminApi';
import html2canvas from 'html2canvas';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];

const PostsAnalyticsView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [chartType, setChartType] = useState('bar');
  const [geoType, setGeoType] = useState('country');
  const [timeData, setTimeData] = useState([]);
  const [geoData, setGeoData] = useState([]);
  const [summary, setSummary] = useState({});
  const [capturing, setCapturing] = useState(false);
  
  const timeChartRef = useRef(null);
  const geoChartRef = useRef(null);
  const summaryRef = useRef(null);
  const { showSnackbar } = useAdminData();
  const { getPostsAnalytics } = useAdminApi();

  // Fetch analytics data from backend
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getPostsAnalytics({
        timeRange,
        geoType
      });
      
      if (response.status === 'success') {
        setTimeData(response.data.time_analytics || []);
        setGeoData(response.data.geo_analytics || []);
        setSummary(response.data.summary || {});
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      setError(err.message || 'Error fetching analytics');
      showSnackbar('Error loading analytics data', 'error');
    } finally {
      setLoading(false);
    }
  }, [timeRange, geoType, getPostsAnalytics, showSnackbar]);

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

  // Capture chart as image using html2canvas
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
const generatePieChartImage = (data, title) => {
  if (!data || data.length === 0) return null;
  
  // Créer un canvas
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  
  // Fond blanc
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Titre
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#333333';
  ctx.textAlign = 'center';
  ctx.fillText(title, canvas.width / 2, 50);
  
  // Dessiner le pie chart
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 100;
  
  let startAngle = 0;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Dessiner les parts du camembert
  data.slice(0, 8).forEach((item, index) => {
    const sliceAngle = (item.value / total) * (Math.PI * 2);
    const endAngle = startAngle + sliceAngle;
    
    // Couleur
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    
    ctx.fillStyle = COLORS[index % COLORS.length];
    ctx.fill();
    
    // Bordure
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Étiquettes
    const labelAngle = startAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
    const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const percentage = ((item.value / total) * 100).toFixed(1);
    ctx.fillText(`${item.name} (${percentage}%)`, labelX, labelY);
    
    startAngle = endAngle;
  });
  
  // Légende
  const legendX = 50;
  let legendY = canvas.height - 200;
  
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#333333';
  ctx.textAlign = 'left';
  ctx.fillText('Top Locations:', legendX, legendY);
  legendY += 30;
  
  data.slice(0, 8).forEach((item, index) => {
    // Carré de couleur
    ctx.fillStyle = COLORS[index % COLORS.length];
    ctx.fillRect(legendX, legendY - 10, 20, 20);
    
    // Texte
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333333';
    ctx.fillText(`${item.name}: ${item.value} posts`, legendX + 30, legendY);
    
    legendY += 25;
  });
  
  return canvas.toDataURL('image/png');
};
  // Print with actual charts
const handlePrint = useCallback(async () => {
  setCapturing(true);
  showSnackbar('Preparing charts for printing...', 'info');
  
  try {
    // Capture du graphique temporel avec html2canvas
    let timeChartImage = null;
    if (timeChartRef.current) {
      timeChartImage = await captureChartAsImage(timeChartRef.current);
    }
    
    // Pour le graphique géographique, on utilise notre générateur d'image
    let geoChartImage = null;
    if (geoData && geoData.length > 0) {
      geoChartImage = generatePieChartImage(
        geoData, 
        `Posts by ${geoType.charAt(0).toUpperCase() + geoType.slice(1)}`
      );
      console.log('Generated geo chart image:', !!geoChartImage);
    }
    
    // Capture du résumé
    let summaryImage = null;
    if (summaryRef.current) {
      summaryImage = await captureChartAsImage(summaryRef.current);
    }
    
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
          <title>Posts Analytics Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 30px;
              background: white;
              color: black;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .section { 
              margin: 30px 0;
              page-break-inside: avoid;
            }
            .chart-container { 
              margin: 20px 0;
              text-align: center;
              background: white;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .chart-image {
              max-width: 100%;
              height: auto;
              border: 1px solid #eee;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin: 20px 0;
            }
            .summary-card {
              border: 1px solid #ddd;
              padding: 20px;
              border-radius: 8px;
              background: #f9f9f9;
              text-align: center;
            }
            .summary-card h3 {
              margin: 0 0 10px 0;
              color: #555;
              font-size: 16px;
            }
            .summary-card p {
              margin: 0;
              font-size: 32px;
              font-weight: bold;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #4CAF50;
              color: white;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tr:hover {
              background-color: #f5f5f5;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { print-color-adjust: exact; }
              .no-break { page-break-inside: avoid; }
              th { background-color: #4CAF50 !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="color: #2c3e50; font-size: 28px;">📊 Posts Analytics Report</h1>
            <p style="font-size: 14px; color: #666;">
              Generated on: ${new Date().toLocaleString()} |
              Time Range: <strong>${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}</strong> |
              Geography: <strong>${geoType.charAt(0).toUpperCase() + geoType.slice(1)}</strong>
            </p>
          </div>

          <div class="section no-break">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">📈 Summary Statistics</h2>
            <div class="summary-grid">
              <div class="summary-card">
                <h3>Total Posts</h3>
                <p style="color: #2196F3;">${summary.total_posts || 0}</p>
              </div>
              <div class="summary-card">
                <h3>Boosted Posts</h3>
                <p style="color: #FF9800;">${summary.total_boosted || 0}</p>
              </div>
              <div class="summary-card">
                <h3>Avg Posts/Day</h3>
                <p style="color: #4CAF50;">${summary.avg_per_day || 0}</p>
              </div>
              <div class="summary-card">
                <h3>Most Active Date</h3>
                <p style="font-size: 20px; color: #9C27B0;">${summary.most_active_date || 'N/A'}</p>
              </div>
              <div class="summary-card">
                <h3>Top Country</h3>
                <p style="font-size: 20px; color: #E91E63;">${summary.top_country || 'N/A'}</p>
              </div>
              <div class="summary-card">
                <h3>Top City</h3>
                <p style="font-size: 20px; color: #795548;">${summary.top_city || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div class="section no-break">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
              📅 Posts by ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}
            </h2>
            ${timeChartImage ? 
              `<div class="chart-container">
                <img src="${timeChartImage}" alt="Time Analytics Chart" class="chart-image" />
              </div>` :
              `<table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Number of Posts</th>
                  </tr>
                </thead>
                <tbody>
                  ${timeData.map(item => `
                    <tr>
                      <td><strong>${item.period}</strong></td>
                      <td style="font-size: 18px; font-weight: bold; color: #2196F3;">${item.posts}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>`
            }
          </div>

          <div class="section no-break">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
              🌍 Posts by ${geoType.charAt(0).toUpperCase() + geoType.slice(1)}
            </h2>
            ${geoChartImage ? 
              `<div class="chart-container">
                <img src="${geoChartImage}" alt="Geographic Analytics Chart" style="max-width: 100%; height: auto; border-radius: 8px;" />
              </div>` :
              `<table>
                <thead>
                  <tr>
                    <th>${geoType.charAt(0).toUpperCase() + geoType.slice(1)}</th>
                    <th>Number of Posts</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${geoData.map((item, index) => {
                    const total = geoData.reduce((sum, i) => sum + i.value, 0);
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return `
                      <tr>
                        <td><strong>${item.name}</strong></td>
                        <td style="font-size: 18px; font-weight: bold; color: ${COLORS[index % COLORS.length]};">${item.value}</td>
                        <td>${percentage}%</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>`
            }
          </div>

          <div class="footer">
            <p style="color: #666;">Report generated by Spider Admin Dashboard</p>
            <p style="color: #999;">${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  } catch (error) {
    console.error('Error generating print:', error);
    showSnackbar('Error preparing print view: ' + error.message, 'error');
  } finally {
    setCapturing(false);
  }
}, [timeRange, geoType, summary, timeData, geoData]);

  // Download as PDF using html2canvas
  const handleDownloadPDF = useCallback(async () => {
    setCapturing(true);
    showSnackbar('Generating PDF...', 'info');
    
    try {
      // Dynamically import jspdf only when needed
      const jsPDF = (await import('jspdf')).default;
      
      // Capture all components
      const timeChartImage = await captureChartAsImage(timeChartRef.current);
      const geoChartImage = await captureChartAsImage(geoChartRef.current);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Title page
      pdf.setFontSize(24);
      pdf.setTextColor(0, 51, 102);
      pdf.text('Posts Analytics Report', 20, 30);
      
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
      pdf.text(`Time Range: ${timeRange}`, 20, 52);
      pdf.text(`Geography: ${geoType}`, 20, 59);
      
      // Add summary
      pdf.setFontSize(18);
      pdf.setTextColor(0, 51, 102);
      pdf.text('Summary', 20, 80);
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total Posts: ${summary.total_posts || 0}`, 25, 95);
      pdf.text(`Boosted Posts: ${summary.total_boosted || 0}`, 25, 102);
      pdf.text(`Avg Posts/Day: ${summary.avg_per_day || 0}`, 25, 109);
      pdf.text(`Most Active Date: ${summary.most_active_date || 'N/A'}`, 25, 116);
      pdf.text(`Top Country: ${summary.top_country || 'N/A'}`, 25, 123);
      pdf.text(`Top City: ${summary.top_city || 'N/A'}`, 25, 130);
      
      // Add time chart
      if (timeChartImage) {
        pdf.addPage();
        pdf.setFontSize(18);
        pdf.setTextColor(0, 51, 102);
        pdf.text(`Posts by ${timeRange}`, 20, 20);
        
        const imgWidth = 170;
        const imgHeight = (imgWidth * 3) / 4;
        pdf.addImage(timeChartImage, 'PNG', 20, 30, imgWidth, imgHeight);
      }
      
      // Add time data table
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Detailed Data', 20, timeChartImage ? 140 : 50);
      
      let yPos = timeChartImage ? 150 : 60;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, yPos - 5, 170, 7, 'F');
      pdf.text('Period', 25, yPos);
      pdf.text('Posts', 150, yPos);
      yPos += 7;
      
      timeData.slice(0, 20).forEach((item, index) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 30;
        }
        pdf.text(item.period, 25, yPos);
        pdf.text(item.posts.toString(), 150, yPos);
        yPos += 7;
      });
      
      // Add geographic chart
      if (geoChartImage) {
        pdf.addPage();
        pdf.setFontSize(18);
        pdf.setTextColor(0, 51, 102);
        pdf.text(`Posts by ${geoType}`, 20, 20);
        
        const imgWidth = 170;
        const imgHeight = (imgWidth * 3) / 4;
        pdf.addImage(geoChartImage, 'PNG', 20, 30, imgWidth, imgHeight);
      }
      
      // Add geographic data table
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      let geoYPos = geoChartImage ? 140 : 50;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, geoYPos - 5, 170, 7, 'F');
      pdf.text(geoType.charAt(0).toUpperCase() + geoType.slice(1), 25, geoYPos);
      pdf.text('Posts', 150, geoYPos);
      geoYPos += 7;
      
      geoData.slice(0, 20).forEach((item) => {
        if (geoYPos > 270) {
          pdf.addPage();
          geoYPos = 30;
        }
        pdf.text(item.name, 25, geoYPos);
        pdf.text(item.value.toString(), 150, geoYPos);
        geoYPos += 7;
      });
      
      pdf.save(`posts-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
      showSnackbar('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showSnackbar('Error generating PDF: ' + error.message, 'error');
    } finally {
      setCapturing(false);
    }
  }, [timeRange, geoType, summary, timeData, geoData, showSnackbar]);

  // Download as CSV (keep original)
  const handleDownloadCSV = useCallback(() => {
    // ... (keep your existing CSV download code)
    showSnackbar('CSV files downloaded successfully', 'success');
  }, [timeData, geoData, summary, geoType, showSnackbar]);

  const renderTimeChart = () => {
    if (!timeData.length) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography color="textSecondary">No data available for this period</Typography>
        </Box>
      );
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="posts" fill="#8884d8" name="Number of Posts">
                {timeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Area type="monotone" dataKey="posts" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Number of Posts" />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={timeData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ period, posts }) => `${period}: ${posts}`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="posts"
                nameKey="period"
              >
                {timeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

const renderGeoChart = () => {
  if (!geoData.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Typography color="textSecondary">No geographic data available</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={geoData}
          cx="50%"
          cy="50%"
          labelLine={true}
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          isAnimationActive={false}
        >
          {geoData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );}
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchAnalyticsData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Posts Analytics
        </Typography>
        <Stack direction="row" spacing={2}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchAnalyticsData} disabled={capturing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Report">
            <IconButton onClick={handlePrint} disabled={capturing}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Box ref={summaryRef}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Posts
                </Typography>
                <Typography variant="h4">
                  {summary.total_posts || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Boosted Posts
                </Typography>
                <Typography variant="h4">
                  {summary.total_boosted || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Posts/Day
                </Typography>
                <Typography variant="h4">
                  {summary.avg_per_day || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Most Active Date
                </Typography>
                <Typography variant="h6" noWrap>
                  {summary.most_active_date || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Time Analytics */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Posts by Time Period
          </Typography>
          <Stack direction="row" spacing={2}>
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={handleTimeRangeChange}
              size="small"
            >
              <ToggleButton value="day">Day</ToggleButton>
              <ToggleButton value="week">Week</ToggleButton>
              <ToggleButton value="month">Month</ToggleButton>
              <ToggleButton value="year">Year</ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              size="small"
            >
              <ToggleButton value="bar">
                <BarChartIcon />
              </ToggleButton>
              <ToggleButton value="line">
                <LineChartIcon />
              </ToggleButton>
              <ToggleButton value="pie">
                <PieChartIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Box ref={timeChartRef}>
          {renderTimeChart()}
        </Box>
      </Paper>

      {/* Geographic Analytics */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Posts by Location
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Group By</InputLabel>
            <Select
              value={geoType}
              onChange={handleGeoTypeChange}
              label="Group By"
            >
              <MenuItem value="country">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PublicIcon sx={{ mr: 1 }} /> Country
                </Box>
              </MenuItem>
              <MenuItem value="city">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ mr: 1 }} /> City
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box ref={geoChartRef}>
              {renderGeoChart()}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Top Locations
            </Typography>
            <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
              {geoData.slice(0, 10).map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: 1,
                        bgcolor: COLORS[index % COLORS.length],
                        mr: 1
                      }}
                    />
                    <Typography variant="body2">
                      {item.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PostsAnalyticsView;