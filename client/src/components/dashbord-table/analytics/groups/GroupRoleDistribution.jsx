import React from 'react';
import { Doughnut } from 'react-chartjs-2';

const GroupRoleDistribution = ({ data }) => {
  if (!data) {
    return <div>No data available</div>;
  }

  const chartData = {
    labels: ['Admin', 'Moderator', 'Member'],
    datasets: [
      {
        data: [
          data.admin || 0,
          data.moderator || 0,
          data.member || 0
        ],
        backgroundColor: ['#d32f2f', '#ff9800', '#1976d2'],
        borderWidth: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      datalabels: {
        formatter: (value, ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${percentage}%`;
        }
      }
    }
  };

  return <Doughnut data={chartData} options={options} />;
};

export default GroupRoleDistribution;