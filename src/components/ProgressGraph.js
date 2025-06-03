// src/components/ProgressGraph.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ProgressGraph = ({ workouts, exerciseName }) => {
  if (!exerciseName) {
    return <p>Please select an exercise to see its progress.</p>;
  }

  // Filter workouts for the selected exercise and sort by date
  const exerciseWorkouts = workouts
    .filter(w => w.name.toLowerCase() === exerciseName.toLowerCase())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (exerciseWorkouts.length === 0) {
    return <p>No data for "{exerciseName}". Try another exercise or add some workouts.</p>;
  }

  // Group by date and find max weight * reps (or just max weight)
  // For simplicity, let's track max weight lifted on a given day for that exercise.
  const dailyMaxWeights = {};
  exerciseWorkouts.forEach(w => {
    const dateStr = new Date(w.date).toLocaleDateString();
    const weight = parseFloat(w.weight);
    if (!dailyMaxWeights[dateStr] || weight > dailyMaxWeights[dateStr]) {
      dailyMaxWeights[dateStr] = weight;
    }
  });

  const labels = Object.keys(dailyMaxWeights);
  const dataPoints = Object.values(dailyMaxWeights);

  if (labels.length < 2) {
    return <p>Not enough data points for "{exerciseName}" to draw a graph. Need at least two different days.</p>;
  }


  const data = {
    labels: labels,
    datasets: [
      {
        label: `Max Weight for ${exerciseName} (kg)`,
        data: dataPoints,
        fill: false,
        borderColor: 'var(--accent-color)',
        tension: 0.1,
        pointBackgroundColor: 'var(--accent-color)',
        pointBorderColor: 'var(--primary-text)',
        pointHoverBackgroundColor: 'var(--primary-text)',
        pointHoverBorderColor: 'var(--accent-color)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: 'var(--secondary-text)' },
        grid: { color: 'rgba(238, 238, 238, 0.1)' }
      },
      y: {
        ticks: { color: 'var(--secondary-text)' },
        grid: { color: 'rgba(238, 238, 238, 0.1)' },
        beginAtZero: false, // Or true, depending on preference
        title: {
            display: true,
            text: 'Weight (kg)',
            color: 'var(--secondary-text)'
        }
      },
    },
    plugins: {
      legend: {
        labels: { color: 'var(--primary-text)' }
      },
      tooltip: {
        titleColor: 'var(--primary-text)',
        bodyColor: 'var(--secondary-text)',
        backgroundColor: 'var(--surface-dark)',
        borderColor: 'var(--accent-color)',
        borderWidth: 1
      }
    }
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default ProgressGraph;