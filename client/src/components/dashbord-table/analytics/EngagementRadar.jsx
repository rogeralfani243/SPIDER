import React from 'react';
import { Radar } from 'react-chartjs-2';

const EngagementRadar = ({ engagement }) => {
  const {
    post_engagement = 0,
    comment_engagement = 0,
    rating_engagement = 0,
    feedback_engagement = 0,
    group_engagement = 0,
    messaging_engagement = 0
  } = engagement || {};

  const data = {
    labels: ['Posts', 'Comments', 'Ratings', 'Feedback', 'Groups', 'Messages'],
    datasets: [
      {
        label: 'Score',
        data: [
          post_engagement,
          comment_engagement,
          rating_engagement,
          feedback_engagement,
          group_engagement,
          messaging_engagement
        ],
        backgroundColor: '#1976d280',
        borderColor: '#1976d2',
        borderWidth: 2,
        pointBackgroundColor: '#1976d2'
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
    scales: { r: { beginAtZero: true, max: 100 } }
  };

  return <Radar data={data} options={options} />;
};

export default EngagementRadar;