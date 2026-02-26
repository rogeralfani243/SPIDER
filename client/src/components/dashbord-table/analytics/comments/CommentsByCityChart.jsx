import React from 'react';
import { Bar } from 'react-chartjs-2';

const CommentsByCityChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  const topCities = data.slice(0, 10);
  const labels = topCities.map(c => c.user__profile__city);
  const counts = topCities.map(c => c.count);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Comments',
        data: counts,
        backgroundColor: '#9c27b0',
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

export default CommentsByCityChart;