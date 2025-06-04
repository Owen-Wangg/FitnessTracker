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
  Filler,
} from 'chart.js';
import '../assets/styles/ProgressGraph.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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

  // 2. Calculate total weight lifted per workout and group by local calendar date
  const dailyDataForChart = exerciseWorkouts.reduce((acc, workout) => {
    // CRITICAL ASSUMPTION: workout.date is a string like "YYYY-MM-DD" (e.g., "2024-05-31")
    // AND this string represents the LOCAL CALENDAR DATE of the workout.

    if (!workout || !workout.date || typeof workout.date !== 'string') {
      console.warn('Skipping workout with missing or invalid date:', workout);
      return acc;
    }

    const dateStringOnly = workout.date.split('T')[0]; // Ensure we only have the YYYY-MM-DD part
    const parts = dateStringOnly.split('-');

    if (parts.length !== 3) {
      console.warn(`Skipping workout with invalid date format: ${workout.date}. Expected YYYY-MM-DD.`);
      return acc;
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // Month from string is 1-12
    const dayInMonth = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(dayInMonth) || month < 1 || month > 12 || dayInMonth < 1 || dayInMonth > 31) {
      console.warn(`Skipping workout with unparsable date components: ${dateStringOnly} from ${workout.date}`);
      return acc;
    }

    // Construct Date object by specifying components.
    // new Date(year, monthIndex, day) treats components as LOCAL time.
    // monthIndex for JavaScript Date is 0-11, so subtract 1 from parsed month.
    const localCalendarDateObject = new Date(year, month - 1, dayInMonth);

    // Use the "YYYY-MM-DD" string as the key for grouping.
    // This ensures all workouts from the same local calendar day are grouped.
    const dateKey = dateStringOnly; // e.g., "2024-05-31"

    const weight = parseFloat(workout.weight) || 0;
    const sets = parseInt(workout.sets, 10) || 0;
    const reps = parseInt(workout.reps, 10) || 0;
    const totalLiftedForThisWorkout = weight * sets * reps;

    if (!acc[dateKey]) {
      acc[dateKey] = {
        totalWeight: 0,
        // Format the displayDate for the X-axis label from our localCalendarDateObject.
        displayDate: localCalendarDateObject.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    }
    acc[dateKey].totalWeight += totalLiftedForThisWorkout;
    return acc;
  }, {});

  // 3. Sort date keys (which are "YYYY-MM-DD" strings) for the chart
  // Lexicographical sort is correct for "YYYY-MM-DD" format.
  const sortedDateKeys = Object.keys(dailyDataForChart).sort((a, b) => a.localeCompare(b));

  if (sortedDateKeys.length === 0 && exerciseWorkouts.length > 0) {
      // This case might happen if all dates were invalid
      return <p className="graph-message">No valid date data found for "{exerciseName}" to plot.</p>;
  }
  if (sortedDateKeys.length < 2 && sortedDateKeys.length > 0) {
     return <p className="graph-message">Only one data point for "{exerciseName}". Need at least two different days to draw a progress line.</p>;
  }
  // This check is slightly redundant given the one at the top, but exerciseWorkouts could be non-empty
  // while sortedDateKeys is empty if all dates were invalid.
  if (sortedDateKeys.length === 0) {
    return <p className="graph-message">No data processed for "{exerciseName}".</p>;
  }


  const labels = sortedDateKeys.map(key => dailyDataForChart[key].displayDate);
  const dataPoints = sortedDateKeys.map(key => dailyDataForChart[key].totalWeight);


  const data = {
    labels: labels,
    datasets: [
      {
        label: `Total Weight Lifted for ${exerciseName}`,
        data: dataPoints,
        fill: {
          target: 'origin',
          above: 'rgba(54, 162, 235, 0.2)',
        },
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: 'rgb(54, 162, 235)',
        pointBorderColor: '#fff',
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
          display: false,
        },
        ticks: {
          color: '#888',
          font: {
            size: 10,
          }
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(200, 200, 200, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#888',
          callback: function(value) {
            if (value >= 1000) {
              return (value / 1000).toFixed(3).replace('.', ',');
            }
            return value;
          },
          stepSize: 10000,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 5,
        displayColors: false,
        callbacks: {
          title: function() {
            return '';
          },
          label: function(context) {
            let label = `Total Weight: ${context.parsed.y.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} lbs`;
            return label;
          },
        },
      },
    },
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
    }
  };

  return (
    <div className="progress-graph-wrapper">
      <h4>Weight Progress</h4>
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default ProgressGraph;