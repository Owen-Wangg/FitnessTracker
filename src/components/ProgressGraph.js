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
  Filler, // <<< IMPORTANT: Import Filler for the gradient fill
} from 'chart.js';
import '../assets/styles/ProgressGraph.css'; // We'll add some styles here

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler // <<< Register Filler
);

const ProgressGraph = ({ workouts, exerciseName }) => {
  if (!workouts || !Array.isArray(workouts) || workouts.length === 0) {
    return <p className="graph-message">No workout data available to display progress.</p>;
  }
  if (!exerciseName) {
    return <p className="graph-message">Please select an exercise to see its progress.</p>;
  }

  // 1. Filter workouts for the selected exercise
  const exerciseWorkouts = workouts.filter(
    (w) => w && w.name && w.name.toLowerCase() === exerciseName.toLowerCase()
  );

  if (exerciseWorkouts.length === 0) {
    return <p className="graph-message">No data for "{exerciseName}".</p>;
  }

  // 2. Calculate total weight lifted per workout and group by date
  const dailyTotals = exerciseWorkouts.reduce((acc, workout) => {
    const dateStr = new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // Format like "May 27"
    const weight = parseFloat(workout.weight) || 0;
    const sets = parseInt(workout.sets, 10) || 0;
    const reps = parseInt(workout.reps, 10) || 0;
    const totalLiftedForThisWorkout = weight * sets * reps;

    acc[dateStr] = (acc[dateStr] || 0) + totalLiftedForThisWorkout;
    return acc;
  }, {});

  // 3. Sort dates for the chart labels (important for correct order)
  const sortedDates = Object.keys(dailyTotals).sort((a, b) => {
    // Convert "May 27" back to a comparable date. This is a bit tricky.
    // A more robust way is to store the full date in dailyTotals and format only for display.
    // For now, let's assume this simple sort works for demonstration if dates are within a reasonable span.
    // A better approach:
    // Store { 'YYYY-MM-DD': total, ... } then sort keys, then map to formatted labels.
    // Let's refine this:
    return new Date(a + ", " + new Date().getFullYear()) - new Date(b + ", " + new Date().getFullYear());
  });


  // Refined data preparation for robust sorting and tooltips
  const dailyDataForChart = workouts
    .filter(w => w && w.name && w.name.toLowerCase() === exerciseName.toLowerCase())
    .reduce((acc, workout) => {
      // Use YYYY-MM-DD for keys to ensure correct sorting
      const dateKey = new Date(workout.date).toISOString().split('T')[0];
      const weight = parseFloat(workout.weight) || 0;
      const sets = parseInt(workout.sets, 10) || 0;
      const reps = parseInt(workout.reps, 10) || 0;
      const totalLiftedForThisWorkout = weight * sets * reps;

      if (!acc[dateKey]) {
        acc[dateKey] = { totalWeight: 0, displayDate: new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
      }
      acc[dateKey].totalWeight += totalLiftedForThisWorkout;
      return acc;
    }, {});

  const sortedDateKeys = Object.keys(dailyDataForChart).sort((a, b) => new Date(a) - new Date(b));

  if (sortedDateKeys.length < 2 && sortedDateKeys.length > 0) {
     return <p className="graph-message">Only one data point for "{exerciseName}". Need at least two different days to draw a progress line.</p>;
  }
  if (sortedDateKeys.length === 0) { // Should be caught earlier but good to have
    return <p className="graph-message">No data for "{exerciseName}".</p>;
  }


  const labels = sortedDateKeys.map(key => dailyDataForChart[key].displayDate);
  const dataPoints = sortedDateKeys.map(key => dailyDataForChart[key].totalWeight);


  const data = {
    labels: labels,
    datasets: [
      {
        label: `Total Weight Lifted for ${exerciseName}`, // This won't be visible by default with legend off
        data: dataPoints,
        fill: { // <<< For gradient fill
          target: 'origin',
          above: 'rgba(54, 162, 235, 0.2)', // Light blue gradient
        },
        borderColor: 'rgb(54, 162, 235)', // Line color - matches your image (approx)
        backgroundColor: 'rgba(54, 162, 235, 0.5)', // Point color, also affects fill slightly
        tension: 0.4, // Makes the line smooth
        pointRadius: 5,
        pointBackgroundColor: 'rgb(54, 162, 235)',
        pointBorderColor: '#fff', // White border for points
        pointHoverRadius: 7,
        pointHoverBackgroundColor: 'rgb(54, 162, 235)',
        pointHoverBorderColor: '#fff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false, // Remove x-axis grid lines
        },
        ticks: {
          color: '#888', // Light grey for ticks, adjust to match image
          font: {
            size: 10, // Smaller font for x-axis labels
          }
        },
      },
      y: {
        beginAtZero: false, // Start y-axis near the lowest data point
        grid: {
          color: 'rgba(200, 200, 200, 0.1)', // Very faint grid lines
          drawBorder: false, // Remove y-axis border line
        },
        ticks: {
          color: '#888', // Light grey for ticks
          // To format y-axis ticks like "10.000", "20.000"
          callback: function(value) {
            if (value >= 1000) {
              return (value / 1000).toFixed(3).replace('.', ','); // Or just toFixed(0) for whole numbers
            }
            return value;
          },
          stepSize: 10000, // Adjust based on your data range
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hide the legend (dataset label)
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker tooltip background
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 5,
        displayColors: false, // Hide the color box in tooltip
        callbacks: {
          title: function() {
            return ''; // Remove the title (date) from tooltip, as it's on x-axis
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              // label += new Intl.NumberFormat('en-US', { style: 'decimal' }).format(context.parsed.y) + ' lbs';
              // Use toLocaleString for formatting like "23.400 lbs"
              label = `Total Weight: ${context.parsed.y.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} lbs`;

            }
            return label;
          },
        },
      },
    },
    interaction: { // Makes tooltip appear on hover over nearest point
        mode: 'nearest',
        axis: 'x',
        intersect: false
    }
  };

  return (
    <div className="progress-graph-wrapper">
      <h4>Weight Progress</h4> {/* Title like in the image */}
      {/* You can add the "Total Weight 23.400 lbs" as a separate element if it's a summary */}
      <div className="chart-container"> {/* Control height via CSS */}
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default ProgressGraph;