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
  Chip,
  LinearProgress
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
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
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
  ComposedChart
} from 'recharts';
import { useAdminData } from '../../../../hooks/useAdminData';
import useAdminApi from '../../../../hooks/useAdminApi';
import html2canvas from 'html2canvas';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1', '#FF6B6B', '#4ECDC4'];

const ReportsAnalyticsView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [chartType, setChartType] = useState('bar');
  const [geoType, setGeoType] = useState('country');
  const [analyticsType, setAnalyticsType] = useState('overview');
  const [timeData, setTimeData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [contentData, setContentData] = useState([]);
  const [geoData, setGeoData] = useState([]);
  const [summary, setSummary] = useState({});
  const [capturing, setCapturing] = useState(false);
  
  const timeChartRef = useRef(null);
  const geoChartRef = useRef(null);
  const summaryRef = useRef(null);
  const { showSnackbar } = useAdminData();
  const { getReportsAnalytics } = useAdminApi();

  // Fetch analytics data from backend
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getReportsAnalytics({
        timeRange,
        geoType
      });
      
      if (response.status === 'success') {
        setTimeData(response.data.time_analytics || []);
        setTypeData(response.data.type_analytics || []);
        setStatusData(response.data.status_analytics || []);
        setContentData(response.data.content_analytics || []);
        setGeoData(response.data.geo_analytics || []);
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
  }, [timeRange, geoType, getReportsAnalytics, showSnackbar]);

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

  // Handle analytics type change
  const handleAnalyticsTypeChange = (event, newType) => {
    if (newType !== null) {
      setAnalyticsType(newType);
    }
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

  // Generate pie chart image for print
  const generatePieChartImage = (data, title) => {
    if (!data || data.length === 0) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 50);
    
    // Draw pie chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 50;
    const radius = Math.min(centerX, centerY) - 100;
    
    let startAngle = 0;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    data.slice(0, 8).forEach((item, index) => {
      const sliceAngle = (item.value / total) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = COLORS[index % COLORS.length];
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
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
    
    // Legend
    const legendX = 50;
    let legendY = canvas.height - 200;
    
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'left';
    ctx.fillText('Categories:', legendX, legendY);
    legendY += 30;
    
    data.slice(0, 8).forEach((item, index) => {
      ctx.fillStyle = COLORS[index % COLORS.length];
      ctx.fillRect(legendX, legendY - 10, 20, 20);
      
      ctx.font = '14px Arial';
      ctx.fillStyle = '#333333';
      ctx.fillText(`${item.name}: ${item.value} (${((item.value / total) * 100).toFixed(1)}%)`, legendX + 30, legendY);
      
      legendY += 25;
    });
    
    return canvas.toDataURL('image/png');
  };

  // Print report
  const handlePrint = useCallback(async () => {
    setCapturing(true);
    showSnackbar('Preparing charts for printing...', 'info');
    
    try {
      // Capture charts
      const timeChartImage = await captureChartAsImage(timeChartRef.current);
      
      // Generate pie chart images
      const typeChartImage = generatePieChartImage(typeData, 'Reports by Type');
      const statusChartImage = generatePieChartImage(statusData, 'Reports by Status');
      const contentChartImage = generatePieChartImage(contentData, 'Reports by Content Type');
      const geoChartImage = generatePieChartImage(geoData, `Reports by ${geoType.charAt(0).toUpperCase() + geoType.slice(1)}`);
      
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
            <title>Reports Analytics Report</title>
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
                border-bottom: 2px solid #dc3545;
                padding-bottom: 20px;
              }
              .section { 
                margin: 40px 0;
                page-break-inside: avoid;
              }
              .chart-container { 
                margin: 20px 0;
                text-align: center;
                background: white;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
              }
              .chart-image {
                max-width: 100%;
                height: auto;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
                background: #f8f9fa;
                text-align: center;
              }
              .summary-card h3 {
                margin: 0 0 10px 0;
                color: #6c757d;
                font-size: 16px;
              }
              .summary-card p {
                margin: 0;
                font-size: 32px;
                font-weight: bold;
              }
              .trend-up { color: #28a745; }
              .trend-down { color: #dc3545; }
              .trend-stable { color: #ffc107; }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                border: 1px solid #dee2e6;
                padding: 12px;
                text-align: left;
              }
              th {
                background-color: #dc3545;
                color: white;
              }
              tr:nth-child(even) {
                background-color: #f8f9fa;
              }
              @media print {
                body { print-color-adjust: exact; }
                .no-break { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="color: #dc3545;">🚨 Reports Analytics Report</h1>
              <p>Generated on: ${new Date().toLocaleString()}</p>
              <p>Time Range: <strong>${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}</strong> | Geography: <strong>${geoType.charAt(0).toUpperCase() + geoType.slice(1)}</strong></p>
            </div>

            <div class="section no-break">
              <h2>📊 Summary Statistics</h2>
              <div class="summary-grid">
                <div class="summary-card">
                  <h3>Total Reports</h3>
                  <p style="color: #dc3545;">${summary.total_reports || 0}</p>
                </div>
                <div class="summary-card">
                  <h3>Pending</h3>
                  <p style="color: #ffc107;">${summary.pending_reports || 0}</p>
                </div>
                <div class="summary-card">
                  <h3>Resolved</h3>
                  <p style="color: #28a745;">${summary.resolved_reports || 0}</p>
                </div>
                <div class="summary-card">
                  <h3>Resolution Rate</h3>
                  <p style="color: #17a2b8;">${summary.resolution_rate || 0}%</p>
                </div>
                <div class="summary-card">
                  <h3>Avg Resolution Time</h3>
                  <p style="color: #6f42c1;">${summary.avg_resolution_time || 'N/A'}</p>
                </div>
                <div class="summary-card">
                  <h3>Most Reported</h3>
                  <p style="font-size: 20px; color: #fd7e14;">${summary.most_reported_content || 'N/A'}</p>
                </div>
              </div>
              
              <div style="margin-top: 30px;">
                <h3>Trend Analysis</h3>
                <p>
                  Reports trend: 
                  <strong class="${
                    summary.trend?.direction === 'up' ? 'trend-up' : 
                    summary.trend?.direction === 'down' ? 'trend-down' : 'trend-stable'
                  }">
                    ${summary.trend?.direction === 'up' ? '▲' : 
                      summary.trend?.direction === 'down' ? '▼' : '●'}
                    ${Math.abs(summary.trend?.percentage || 0)}% vs previous month
                  </strong>
                </p>
                <p>Most active date: <strong>${summary.most_active_date || 'N/A'}</strong></p>
                <p>Most active reporter: <strong>${summary.most_active_reporter || 'N/A'}</strong> (${summary.most_active_reporter_count || 0} reports)</p>
              </div>
            </div>

            <div class="section no-break">
              <h2>📅 Reports Over Time (${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)})</h2>
              ${timeChartImage ? 
                `<div class="chart-container">
                  <img src="${timeChartImage}" alt="Time Analytics Chart" class="chart-image" />
                </div>` :
                `<table>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Total</th>
                      <th>Pending</th>
                      <th>Resolved</th>
                      <th>Dismissed</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${timeData.map(item => `
                      <tr>
                        <td><strong>${item.period}</strong></td>
                        <td>${item.total}</td>
                        <td style="color: #ffc107;">${item.pending || 0}</td>
                        <td style="color: #28a745;">${item.resolved || 0}</td>
                        <td style="color: #6c757d;">${item.dismissed || 0}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>`
              }
            </div>

            <div class="section no-break">
              <h2>📋 Reports by Type</h2>
              ${typeChartImage ? 
                `<div class="chart-container">
                  <img src="${typeChartImage}" alt="Reports by Type" class="chart-image" />
                </div>` :
                `<table>
                  <thead>
                    <tr>
                      <th>Report Type</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${typeData.map((item, index) => {
                      const total = typeData.reduce((sum, i) => sum + i.value, 0);
                      const percentage = ((item.value / total) * 100).toFixed(1);
                      return `
                        <tr>
                          <td>${item.name}</td>
                          <td><strong>${item.value}</strong></td>
                          <td>${percentage}%</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>`
              }
            </div>

            <div class="section no-break">
              <h2>📌 Reports by Status</h2>
              ${statusChartImage ? 
                `<div class="chart-container">
                  <img src="${statusChartImage}" alt="Reports by Status" class="chart-image" />
                </div>` :
                `<table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${statusData.map((item, index) => {
                      const total = statusData.reduce((sum, i) => sum + i.value, 0);
                      const percentage = ((item.value / total) * 100).toFixed(1);
                      return `
                        <tr>
                          <td>${item.name}</td>
                          <td><strong>${item.value}</strong></td>
                          <td>${percentage}%</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>`
              }
            </div>

            <div class="section no-break">
              <h2>🎯 Reports by Content Type</h2>
              ${contentChartImage ? 
                `<div class="chart-container">
                  <img src="${contentChartImage}" alt="Reports by Content Type" class="chart-image" />
                </div>` :
                `<table>
                  <thead>
                    <tr>
                      <th>Content Type</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${contentData.map((item, index) => {
                      const total = contentData.reduce((sum, i) => sum + i.value, 0);
                      const percentage = ((item.value / total) * 100).toFixed(1);
                      return `
                        <tr>
                          <td>${item.name}</td>
                          <td><strong>${item.value}</strong></td>
                          <td>${percentage}%</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>`
              }
            </div>

            <div class="section no-break">
              <h2>🌍 Reports by ${geoType.charAt(0).toUpperCase() + geoType.slice(1)}</h2>
              ${geoChartImage ? 
                `<div class="chart-container">
                  <img src="${geoChartImage}" alt="Geographic Distribution" class="chart-image" />
                </div>` :
                `<table>
                  <thead>
                    <tr>
                      <th>${geoType.charAt(0).toUpperCase() + geoType.slice(1)}</th>
                      <th>Reports</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${geoData.map((item, index) => {
                      const total = geoData.reduce((sum, i) => sum + i.value, 0);
                      const percentage = ((item.value / total) * 100).toFixed(1);
                      return `
                        <tr>
                          <td>${item.name}</td>
                          <td><strong>${item.value}</strong></td>
                          <td>${percentage}%</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>`
              }
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (error) {
      console.error('Error generating print:', error);
      showSnackbar('Error preparing print view', 'error');
    } finally {
      setCapturing(false);
    }
  }, [timeRange, geoType, timeData, typeData, statusData, contentData, geoData, summary]);

  // Download as PDF
  const handleDownloadPDF = useCallback(async () => {
    setCapturing(true);
    showSnackbar('Generating PDF...', 'info');
    
    try {
      const jsPDF = (await import('jspdf')).default;
      
      const timeChartImage = await captureChartAsImage(timeChartRef.current);
      const typeChartImage = generatePieChartImage(typeData, 'Reports by Type');
      const statusChartImage = generatePieChartImage(statusData, 'Reports by Status');
      const geoChartImage = generatePieChartImage(geoData, `Reports by ${geoType}`);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Title page
      pdf.setFontSize(24);
      pdf.setTextColor(220, 53, 69);
      pdf.text('Reports Analytics Report', 20, 30);
      
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
      pdf.text(`Time Range: ${timeRange}`, 20, 52);
      pdf.text(`Geography: ${geoType}`, 20, 59);
      
      // Add summary
      pdf.setFontSize(18);
      pdf.setTextColor(220, 53, 69);
      pdf.text('Summary', 20, 80);
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total Reports: ${summary.total_reports || 0}`, 25, 95);
      pdf.text(`Pending: ${summary.pending_reports || 0}`, 25, 102);
      pdf.text(`Resolved: ${summary.resolved_reports || 0}`, 25, 109);
      pdf.text(`Dismissed: ${summary.dismissed_reports || 0}`, 25, 116);
      pdf.text(`Resolution Rate: ${summary.resolution_rate || 0}%`, 25, 123);
      pdf.text(`Avg Resolution Time: ${summary.avg_resolution_time || 'N/A'}`, 25, 130);
      
      pdf.save(`reports-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
      showSnackbar('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showSnackbar('Error generating PDF', 'error');
    } finally {
      setCapturing(false);
    }
  }, [timeRange, geoType, summary, timeData, typeData, statusData, geoData]);

  // Download as CSV
  const handleDownloadCSV = useCallback(() => {
    let csvContent = 'Reports Analytics Export\n\n';
    
    // Summary
    csvContent += 'SUMMARY\n';
    csvContent += `Total Reports,${summary.total_reports || 0}\n`;
    csvContent += `Pending,${summary.pending_reports || 0}\n`;
    csvContent += `Resolved,${summary.resolved_reports || 0}\n`;
    csvContent += `Dismissed,${summary.dismissed_reports || 0}\n`;
    csvContent += `Resolution Rate,${summary.resolution_rate || 0}%\n`;
    csvContent += `Avg Resolution Time,${summary.avg_resolution_time || 'N/A'}\n\n`;
    
    // Time data
    csvContent += 'REPORTS OVER TIME\n';
    csvContent += 'Period,Total,Pending,Resolved,Dismissed\n';
    timeData.forEach(item => {
      csvContent += `${item.period},${item.total},${item.pending || 0},${item.resolved || 0},${item.dismissed || 0}\n`;
    });
    csvContent += '\n';
    
    // Type data
    csvContent += 'REPORTS BY TYPE\n';
    csvContent += 'Type,Count\n';
    typeData.forEach(item => {
      csvContent += `${item.name},${item.value}\n`;
    });
    csvContent += '\n';
    
    // Status data
    csvContent += 'REPORTS BY STATUS\n';
    csvContent += 'Status,Count\n';
    statusData.forEach(item => {
      csvContent += `${item.name},${item.value}\n`;
    });
    csvContent += '\n';
    
    // Content data
    csvContent += 'REPORTS BY CONTENT TYPE\n';
    csvContent += 'Content Type,Count\n';
    contentData.forEach(item => {
      csvContent += `${item.name},${item.value}\n`;
    });
    csvContent += '\n';
    
    // Geo data
    csvContent += `REPORTS BY ${geoType.toUpperCase()}\n`;
    csvContent += `${geoType},Count\n`;
    geoData.forEach(item => {
      csvContent += `${item.name},${item.value}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reports-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    showSnackbar('CSV downloaded successfully', 'success');
  }, [timeData, typeData, statusData, contentData, geoData, summary, geoType]);

  // Render time chart
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
              <Bar dataKey="total" fill="#dc3545" name="Total Reports" />
              <Bar dataKey="pending" fill="#ffc107" name="Pending" />
              <Bar dataKey="resolved" fill="#28a745" name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#dc3545" name="Total Reports" />
              <Line type="monotone" dataKey="pending" stroke="#ffc107" name="Pending" />
              <Line type="monotone" dataKey="resolved" stroke="#28a745" name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  // Render pie chart
  const renderPieChart = (data) => {
    if (!data || !data.length) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography color="textSecondary">No data available</Typography>
        </Box>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" component="h2" sx={{ color: '#dc3545', fontWeight: 600 }}>
            Reports Analytics
          </Typography>
          <Chip 
            icon={<FlagIcon />} 
            label={`${summary.total_reports || 0} Total Reports`}
            color="error"
            size="small"
          />
        </Box>
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
          <Tooltip title="Download PDF">
            <IconButton onClick={handleDownloadPDF} disabled={capturing}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadCSV}
            size="small"
            disabled={capturing}
            color="error"
          >
            CSV
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderTop: 3, borderColor: '#dc3545' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FlagIcon fontSize="small" color="error" /> Total Reports
              </Typography>
              <Typography variant="h4" sx={{ color: '#dc3545', fontWeight: 600 }}>
                {summary.total_reports || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderTop: 3, borderColor: '#ffc107' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PendingIcon fontSize="small" sx={{ color: '#ffc107' }} /> Pending
              </Typography>
              <Typography variant="h4" sx={{ color: '#ffc107', fontWeight: 600 }}>
                {summary.pending_reports || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderTop: 3, borderColor: '#28a745' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon fontSize="small" sx={{ color: '#28a745' }} /> Resolved
              </Typography>
              <Typography variant="h4" sx={{ color: '#28a745', fontWeight: 600 }}>
                {summary.resolved_reports || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderTop: 3, borderColor: '#6c757d' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CancelIcon fontSize="small" sx={{ color: '#6c757d' }} /> Dismissed
              </Typography>
              <Typography variant="h4" sx={{ color: '#6c757d', fontWeight: 600 }}>
                {summary.dismissed_reports || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Time Analytics */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChartIcon /> Reports Over Time
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
            </ToggleButtonGroup>
          </Stack>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Box ref={timeChartRef}>
          {renderTimeChart()}
        </Box>
      </Paper>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PieChartIcon /> Reports by Type
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {renderPieChart(typeData)}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PieChartIcon /> Reports by Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {renderPieChart(statusData)}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PieChartIcon /> Reports by Content Type
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {renderPieChart(contentData)}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PublicIcon /> Geographic Distribution
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={geoType}
                  onChange={handleGeoTypeChange}
                  size="small"
                >
                  <MenuItem value="country">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PublicIcon sx={{ mr: 1, fontSize: 16 }} /> Country
                    </Box>
                  </MenuItem>
                  <MenuItem value="city">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ mr: 1, fontSize: 16 }} /> City
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {renderPieChart(geoData)}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsAnalyticsView;