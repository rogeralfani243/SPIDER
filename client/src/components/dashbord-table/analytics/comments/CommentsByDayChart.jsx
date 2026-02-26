
import React from 'react';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

const CommentsByDayChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  const labels = data.map(d => format(parseISO(d.period), 'dd/MM'));
  const counts = data.map(d => d.count);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Comments',
        data: counts,
        borderColor: '#2e7d32',
        backgroundColor: '#2e7d3220',
        borderWidth: 2,
        pointBackgroundColor: '#2e7d32',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
      datalabels: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } }
    }
  };

  return <Line data={chartData} options={options} />;
};

export default CommentsByDayChart;