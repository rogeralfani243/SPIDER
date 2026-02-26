
import React from 'react';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

const GroupsByMonthChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  const labels = data.map(d => format(parseISO(d.period), 'MMM yyyy'));
  const counts = data.map(d => d.count);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Messages',
        data: counts,
        borderColor: '#00796b',
        backgroundColor: '#00796b20',
        borderWidth: 2,
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
      datalabels: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return <Line data={chartData} options={options} />;
};

export default GroupsByMonthChart;