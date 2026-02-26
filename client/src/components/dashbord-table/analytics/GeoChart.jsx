import React from 'react';
import { Bar } from 'react-chartjs-2';

const GeoChart = ({ topCountries }) => {
  const chartLabels = Object.keys(topCountries).slice(0, 10);
  const chartComments = chartLabels.map(c => topCountries[c].comments);
  const chartRatings = chartLabels.map(c => topCountries[c].ratings);
  const chartFeedback = chartLabels.map(c => topCountries[c].feedback);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Comments',
        data: chartComments,
        backgroundColor: '#2e7d32',
      },
      {
        label: 'Ratings',
        data: chartRatings,
        backgroundColor: '#ed6c02',
      },
      {
        label: 'Feedback',
        data: chartFeedback,
        backgroundColor: '#9c27b0',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default GeoChart;