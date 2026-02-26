import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

class ReportGenerator {
  static async captureChartAsImage(element) {
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
  }

  static async handlePrint({
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
  }) {
    setCapturing(true);
    showSnackbar('Preparing charts for printing...', 'info');
    
    try {
      const timeChartImage = await this.captureChartAsImage(timeChartRef.current);
      const geoChartImage = await this.captureChartAsImage(geoChartRef.current);
      const statusChartImage = await this.captureChartAsImage(statusChartRef.current);
      const activityChartImage = await this.captureChartAsImage(activityChartRef.current);
      const monthlyChartImage = await this.captureChartAsImage(monthlyChartRef.current);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showSnackbar('Please allow pop-ups to print', 'warning');
        setCapturing(false);
        return;
      }

      const printDate = new Date().toLocaleString();
      const timeRangeLabel = timeRange.charAt(0).toUpperCase() + timeRange.slice(1);
      const geoTypeLabel = geoType.charAt(0).toUpperCase() + geoType.slice(1);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Users Analytics Report</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                background: white;
                color: #1a1a1a;
                line-height: 1.6;
                padding: 40px;
              }
              .report-container { max-width: 1200px; margin: 0 auto; }
              .header { 
                text-align: center; 
                margin-bottom: 40px;
                padding-bottom: 30px;
                border-bottom: 4px solid #2196F3;
              }
              .header h1 { 
                color: #2196F3; 
                font-size: 36px;
                font-weight: 700;
                margin-bottom: 15px;
              }
              .header p { 
                color: #666;
                font-size: 14px;
                margin: 5px 0;
              }
              .section { 
                margin: 40px 0;
                page-break-inside: avoid;
              }
              .section-title {
                color: #2196F3;
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e0e0e0;
              }
              .chart-container { 
                margin: 25px 0;
                text-align: center;
                background: white;
                padding: 25px;
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              }
              .chart-image {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
              }
              .kpi-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin: 30px 0;
              }
              .kpi-card {
                background: #f8f9fa;
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                border-top: 4px solid #2196F3;
              }
              .kpi-card h3 {
                color: #666;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .kpi-card p {
                color: #2196F3;
                font-size: 32px;
                font-weight: 700;
                margin: 0;
              }
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin: 20px 0;
              }
              .stats-card {
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 15px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              }
              th {
                background: #2196F3;
                color: white;
                font-weight: 600;
                padding: 12px 16px;
                text-align: left;
                font-size: 14px;
              }
              td {
                padding: 12px 16px;
                border-bottom: 1px solid #e0e0e0;
                font-size: 14px;
              }
              tr:last-child td { border-bottom: none; }
              tr:nth-child(even) { background-color: #f8f9fa; }
              .badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
              }
              .badge-success { background: #e8f5e9; color: #2e7d32; }
              .badge-warning { background: #fff3e0; color: #ef6c00; }
              .badge-info { background: #e3f2fd; color: #1565c0; }
              .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                text-align: center;
                color: #999;
                font-size: 12px;
              }
              @media print {
                body { print-color-adjust: exact; }
                .section { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="report-container">
              <div class="header">
                <h1>👥 Users Analytics Report</h1>
                <p>Generated on: ${printDate}</p>
                <p>Time Range: <strong>${timeRangeLabel}</strong> | Geography: <strong>${geoTypeLabel}</strong></p>
              </div>

              <div class="section">
                <div class="section-title">📊 Key Performance Indicators</div>
                <div class="kpi-grid">
                  <div class="kpi-card">
                    <h3>Total Users</h3>
                    <p>${summary.total_users?.toLocaleString() || 0}</p>
                  </div>
                  <div class="kpi-card" style="border-top-color: #4CAF50;">
                    <h3>Active Users</h3>
                    <p style="color: #4CAF50;">${summary.active_users?.toLocaleString() || 0}</p>
                  </div>
                  <div class="kpi-card" style="border-top-color: #FF9800;">
                    <h3>Activity Rate</h3>
                    <p style="color: #FF9800;">${summary.activity_rate || 0}%</p>
                  </div>
                  <div class="kpi-card" style="border-top-color: #00BCD4;">
                    <h3>Retention Rate</h3>
                    <p style="color: #00BCD4;">${summary.retention_rate || 0}%</p>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">📈 User Registrations (${timeRangeLabel})</div>
                ${timeChartImage ? 
                  `<div class="chart-container">
                    <img src="${timeChartImage}" alt="Registrations Chart" class="chart-image" />
                  </div>` :
                  `<table>
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Total</th>
                        <th>Active</th>
                        <th>Inactive</th>
                        <th>Staff</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${timeData.map(item => `
                        <tr>
                          <td><strong>${item.period}</strong></td>
                          <td>${item.total}</td>
                          <td><span class="badge badge-success">${item.active}</span></td>
                          <td><span class="badge badge-warning">${item.inactive}</span></td>
                          <td><span class="badge badge-info">${item.staff || 0}</span></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>`
                }
              </div>

              <div class="section">
                <div class="section-title">📊 User Distribution</div>
                <div class="stats-grid">
                  <div class="stats-card">
                    <h3 style="color: #666; font-size: 14px; margin-bottom: 10px;">User Status</h3>
                    ${statusChartImage ? 
                      `<img src="${statusChartImage}" style="width: 100%;" />` :
                      `<table style="margin: 0;">
                        <tr><th>Status</th><th>Count</th></tr>
                        ${statusData.map(item => `
                          <tr>
                            <td>${item.name}</td>
                            <td><strong>${item.value}</strong></td>
                          </tr>
                        `).join('')}
                      </table>`
                    }
                  </div>
                  <div class="stats-card">
                    <h3 style="color: #666; font-size: 14px; margin-bottom: 10px;">User Activity</h3>
                    ${activityChartImage ? 
                      `<img src="${activityChartImage}" style="width: 100%;" />` :
                      `<table style="margin: 0;">
                        <tr><th>Activity</th><th>Users</th></tr>
                        ${activityData.map(item => `
                          <tr>
                            <td>${item.name}</td>
                            <td><strong>${item.value}</strong></td>
                          </tr>
                        `).join('')}
                      </table>`
                    }
                  </div>
                  <div class="stats-card">
                    <h3 style="color: #666; font-size: 14px; margin-bottom: 10px;">Geographic</h3>
                    ${geoChartImage ? 
                      `<img src="${geoChartImage}" style="width: 100%;" />` :
                      `<table style="margin: 0;">
                        <tr><th>${geoType}</th><th>Users</th></tr>
                        ${geoData.slice(0, 5).map(item => `
                          <tr>
                            <td>${item.name}</td>
                            <td><strong>${item.value}</strong></td>
                          </tr>
                        `).join('')}
                      </table>`
                    }
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">📅 Monthly Registration Trend</div>
                ${monthlyChartImage ? 
                  `<div class="chart-container">
                    <img src="${monthlyChartImage}" alt="Monthly Trend" class="chart-image" />
                  </div>` :
                  `<table>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>New Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${monthlyData.slice(0, 6).map(item => `
                        <tr>
                          <td><strong>${item.month}</strong></td>
                          <td>${item.count}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>`
                }
              </div>

              <div class="section">
                <div class="section-title">🏆 Top Contributors</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                  <div class="stats-card">
                    <h3 style="color: #2196F3; margin-bottom: 15px;">📝 Top Posters</h3>
                    <table style="margin: 0;">
                      ${topUsers.by_posts.slice(0, 3).map(user => `
                        <tr>
                          <td>${user.username}</td>
                          <td><strong>${user.count}</strong></td>
                        </tr>
                      `).join('')}
                    </table>
                  </div>
               
                  <div class="stats-card">
                    <h3 style="color: #FF9800; margin-bottom: 15px;">🚨 Top Reporters</h3>
                    <table style="margin: 0;">
                      ${topUsers.by_reports.slice(0, 3).map(user => `
                        <tr>
                          <td>${user.username}</td>
                          <td><strong>${user.count}</strong></td>
                        </tr>
                      `).join('')}
                    </table>
                  </div>
                </div>
              </div>

              <div class="footer">
                <p>Report generated by Spider Admin Dashboard</p>
                <p>© ${new Date().getFullYear()} - All rights reserved</p>
              </div>
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
  }

  static async handleDownloadPDF({
    timeRange,
    geoType,
    summary,
    timeChartRef,
    geoChartRef,
    showSnackbar,
    setCapturing
  }) {
    setCapturing(true);
    showSnackbar('Generating PDF...', 'info');
    
    try {
      const timeChartImage = await this.captureChartAsImage(timeChartRef.current);
      const geoChartImage = await this.captureChartAsImage(geoChartRef.current);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Title Page
      pdf.setFillColor(33, 150, 243);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Users Analytics', pageWidth / 2, 25, { align: 'center' });
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 60);
      pdf.text(`Time Range: ${timeRange}`, 20, 70);
      pdf.text(`Geography: ${geoType}`, 20, 80);
      
      // Summary
      pdf.setFontSize(16);
      pdf.setTextColor(33, 150, 243);
      pdf.text('Summary', 20, 100);
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total Users: ${summary.total_users || 0}`, 25, 115);
      pdf.text(`Active Users: ${summary.active_users || 0}`, 25, 125);
      pdf.text(`Inactive Users: ${summary.inactive_users || 0}`, 25, 135);
      pdf.text(`Staff Users: ${summary.staff_users || 0}`, 25, 145);
      pdf.text(`Activity Rate: ${summary.activity_rate || 0}%`, 25, 155);
      pdf.text(`Retention Rate: ${summary.retention_rate || 0}%`, 25, 165);
      
      // Registration Chart
      if (timeChartImage) {
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.setTextColor(33, 150, 243);
        pdf.text('User Registrations', 20, 20);
        
        const imgWidth = 170;
        const imgHeight = (imgWidth * 3) / 4;
        pdf.addImage(timeChartImage, 'PNG', 20, 30, imgWidth, imgHeight);
      }
      
      // Geographic Chart
      if (geoChartImage) {
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.setTextColor(33, 150, 243);
        pdf.text('Geographic Distribution', 20, 20);
        
        const imgWidth = 170;
        const imgHeight = (imgWidth * 3) / 4;
        pdf.addImage(geoChartImage, 'PNG', 20, 30, imgWidth, imgHeight);
      }
      
      pdf.save(`users-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
      showSnackbar('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showSnackbar('Error generating PDF', 'error');
    } finally {
      setCapturing(false);
    }
  }

  static handleDownloadCSV({
    timeData,
    statusData,
    activityData,
    geoData,
    monthlyData,
    summary,
    timeRange,
    geoType,
    showSnackbar
  }) {
    let csvContent = 'USERS ANALYTICS REPORT\n';
    csvContent += `Generated,${new Date().toLocaleString()}\n`;
    csvContent += `Time Range,${timeRange}\n`;
    csvContent += `Geography,${geoType}\n\n`;
    
    csvContent += 'SUMMARY\n';
    csvContent += `Total Users,${summary.total_users || 0}\n`;
    csvContent += `Active Users,${summary.active_users || 0}\n`;
    csvContent += `Inactive Users,${summary.inactive_users || 0}\n`;
    csvContent += `Staff Users,${summary.staff_users || 0}\n`;
    csvContent += `Superusers,${summary.superuser_users || 0}\n`;
    csvContent += `Activity Rate,${summary.activity_rate || 0}%\n`;
    csvContent += `Retention Rate,${summary.retention_rate || 0}%\n\n`;
    
    csvContent += 'REGISTRATIONS OVER TIME\n';
    csvContent += 'Period,Total,Active,Inactive,Staff\n';
    timeData.forEach(item => {
      csvContent += `${item.period},${item.total},${item.active},${item.inactive},${item.staff || 0}\n`;
    });
    csvContent += '\n';
    
    csvContent += 'USER STATUS DISTRIBUTION\n';
    csvContent += 'Status,Count\n';
    statusData.forEach(item => {
      csvContent += `${item.name},${item.value}\n`;
    });
    csvContent += '\n';
    
    csvContent += 'USER ACTIVITY\n';
    csvContent += 'Activity,Users\n';
    activityData.forEach(item => {
      csvContent += `${item.name},${item.value}\n`;
    });
    csvContent += '\n';
    
    csvContent += `GEOGRAPHIC DISTRIBUTION (${geoType.toUpperCase()})\n`;
    csvContent += `${geoType},Users\n`;
    geoData.forEach(item => {
      csvContent += `${item.name},${item.value}\n`;
    });
    csvContent += '\n';
    
    csvContent += 'MONTHLY REGISTRATIONS\n';
    csvContent += 'Month,New Users\n';
    monthlyData.forEach(item => {
      csvContent += `${item.month},${item.count}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showSnackbar('CSV downloaded successfully', 'success');
  }
}

export default ReportGenerator;