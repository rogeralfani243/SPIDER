import React from 'react';
import { Bar } from 'react-chartjs-2';

const CommentsByCountryChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  const topCountries = data.slice(0, 10);
  const labels = topCountries.map(c => c.user__profile__country);
  const counts = topCountries.map(c => c.count);

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
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'top',
        formatter: (value) => value
      }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default CommentsByCountryChart;