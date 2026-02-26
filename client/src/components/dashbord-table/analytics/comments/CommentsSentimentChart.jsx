
import React from 'react';
import { Doughnut } from 'react-chartjs-2';

const CommentsSentimentChart = ({ data }) => {
  if (!data) {
    return <div>No data available</div>;
  }

  const chartData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [
          data.positive || 0,
          data.neutral || 0,
          data.negative || 0
        ],
        backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
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

export default CommentsSentimentChart;