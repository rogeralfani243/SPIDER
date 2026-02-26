import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

const ActivityChart = ({ postsData, commentsData, ratingsData, chartView }) => {
  if (!postsData || postsData.length === 0) {
    return <div>No activity data available</div>;
  }

  const labels = postsData.map(d => format(parseISO(d.period), 'dd/MM'));
  const postsCounts = postsData.map(d => d.count);
  const commentsCounts = commentsData?.map(d => d.count) || [];
  const ratingsCounts = ratingsData?.map(d => d.count) || [];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Posts',
        data: postsCounts,
        borderColor: '#1976d2',
        backgroundColor: '#1976d220',
        borderWidth: 2,
        pointBackgroundColor: '#1976d2',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Comments',
        data: commentsCounts,
        borderColor: '#2e7d32',
        backgroundColor: '#2e7d3220',
        borderWidth: 2,
        pointBackgroundColor: '#2e7d32',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Ratings',
        data: ratingsCounts,
        borderColor: '#ed6c02',
        backgroundColor: '#ed6c0220',
        borderWidth: 2,
        pointBackgroundColor: '#ed6c02',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
      datalabels: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } }
    }
  };

  return chartView === 'line' ? (
    <Line data={chartData} options={options} />
  ) : (
    <Bar data={chartData} options={options} />
  );
};

export default ActivityChart;