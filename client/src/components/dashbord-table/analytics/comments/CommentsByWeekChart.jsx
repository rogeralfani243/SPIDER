
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

const CommentsByWeekChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  const labels = data.map(d => `W${format(parseISO(d.period), 'w')}`);
  const counts = data.map(d => d.count);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Comments',
        data: counts,
        backgroundColor: '#2e7d32',
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' } }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default CommentsByWeekChart;