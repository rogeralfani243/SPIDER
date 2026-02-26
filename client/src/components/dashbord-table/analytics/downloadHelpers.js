import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export const downloadChartAsPNG = async (chartRef, filename) => {
  if (!chartRef.current) return;
  
  try {
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Error downloading chart:', error);
  }
};

export const downloadChartAsPDF = async (chartRef, filename) => {
  if (!chartRef.current) return;
  
  try {
    const canvas = await html2canvas(chartRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error downloading PDF:', error);
  }
};

export const downloadTableAsCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}.csv`);
  } catch (error) {
    console.error('Error downloading CSV:', error);
  }
};

export const downloadAllCharts = async (chartRefs) => {
  const charts = [
    { ref: chartRefs.activity, name: 'activity_chart' },
    { ref: chartRefs.radar, name: 'engagement_radar' },
    { ref: chartRefs.categories, name: 'post_categories' },
    { ref: chartRefs.tags, name: 'post_tags' },
    { ref: chartRefs.ratings, name: 'rating_distribution' },
    { ref: chartRefs.feedback, name: 'feedback_distribution' },
    { ref: chartRefs.geo, name: 'geo_distribution' },
    { ref: chartRefs.trends, name: 'trends' },
    { ref: chartRefs.commentsByDay, name: 'comments_by_day' },
    { ref: chartRefs.commentsByWeek, name: 'comments_by_week' },
    { ref: chartRefs.commentsByMonth, name: 'comments_by_month' },
    { ref: chartRefs.commentsByCountry, name: 'comments_by_country' },
    { ref: chartRefs.commentsByCity, name: 'comments_by_city' },
    { ref: chartRefs.groups, name: 'groups_roles' },
    { ref: chartRefs.groupsByMonth, name: 'groups_activity' }
  ];

  for (const chart of charts) {
    await downloadChartAsPNG(chart.ref, chart.name);
  }
};