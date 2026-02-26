
import React from 'react';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

const TrendChart = ({ data, dataKey, color, label, yMax }) => {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  const labels = data.map(d => format(parseISO(d.month), 'MMM yyyy'));
  const values = data.map(d => d[dataKey] || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: color,
        backgroundColor: `${color}20`,
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
      y: { 
        beginAtZero: true, 
        max: yMax 
      }
    }
  };

  return <Line data={chartData} options={options} />;
};

export default TrendChart;