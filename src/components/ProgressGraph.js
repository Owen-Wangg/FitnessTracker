import React, { useMemo, useState } from 'react';
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
import { topSet, bestEstimated1RM, workoutVolume, parseLocalDate } from '../utils/workoutMetrics';
import { CHART_COLORS } from '../utils/theme';
import '../assets/styles/ProgressGraph.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const ACCENT = CHART_COLORS.accentRgb;
const PR_COLOR = CHART_COLORS.pr;

const METRICS = {
  top: { label: 'Top weight', title: 'Heaviest set per day' },
  e1rm: { label: 'Est. 1RM', title: 'Estimated one-rep max (Epley) per day' },
  volume: { label: 'Volume', title: 'Total weight x reps per day' },
};

const formatNumber = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });

// One point per calendar day for the chosen exercise, oldest first.
const buildSeries = (workouts, exerciseName) => {
  const byDate = {};
  workouts
    .filter((w) => w && w.date && w.name && w.name.toLowerCase() === exerciseName.toLowerCase())
    .forEach((w) => {
      const key = w.date.split('T')[0];
      const day = (byDate[key] = byDate[key] || { date: key, top: null, e1rm: 0, volume: 0 });
      const top = topSet(w);
      if (top && (!day.top || top.weight > day.top.weight || (top.weight === day.top.weight && top.reps > day.top.reps))) {
        day.top = top;
      }
      day.e1rm = Math.max(day.e1rm, bestEstimated1RM(w));
      day.volume += workoutVolume(w);
    });

  return Object.values(byDate)
    .filter((d) => d.top)
    .sort((a, b) => a.date.localeCompare(b.date));
};

const valueFor = (day, metric) => (metric === 'top' ? day.top.weight : day[metric]);

const ProgressGraph = ({ workouts, exerciseName }) => {
  const [metric, setMetric] = useState('top');

  const days = useMemo(
    () => (workouts && exerciseName ? buildSeries(workouts, exerciseName) : []),
    [workouts, exerciseName]
  );

  if (!workouts || !Array.isArray(workouts) || workouts.length === 0) {
    return <p className="graph-message">No workout data available to display progress.</p>;
  }
  if (!exerciseName) {
    return <p className="graph-message">Please select an exercise to see its progress.</p>;
  }
  if (days.length === 0) {
    return <p className="graph-message">No data for "{exerciseName}".</p>;
  }

  const values = days.map((d) => valueFor(d, metric));

  // A point is a PR when it beats everything before it (the first session is just the baseline).
  let runningMax = -Infinity;
  const isPR = values.map((v, i) => {
    const pr = i > 0 && v > runningMax;
    runningMax = Math.max(runningMax, v);
    return pr;
  });

  const first = values[0];
  const latest = values[values.length - 1];
  const best = Math.max(...values);
  const change = latest - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  const unit = 'lbs';

  const data = {
    labels: days.map((d) =>
      parseLocalDate(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: METRICS[metric].label,
        data: values,
        fill: { target: 'origin', above: `rgba(${ACCENT}, 0.12)` },
        borderColor: `rgb(${ACCENT})`,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: isPR.map((pr) => (pr ? 7 : 4)),
        pointHoverRadius: isPR.map((pr) => (pr ? 9 : 6)),
        pointBackgroundColor: isPR.map((pr) => (pr ? PR_COLOR : `rgb(${ACCENT})`)),
        pointBorderColor: CHART_COLORS.surface,
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: CHART_COLORS.muted, font: { size: 11 }, maxRotation: 0, autoSkip: true },
      },
      y: {
        beginAtZero: false,
        grace: '10%',
        grid: { color: CHART_COLORS.grid },
        border: { display: false },
        ticks: { color: CHART_COLORS.muted, callback: (v) => formatNumber(v) },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: CHART_COLORS.raised,
        titleColor: CHART_COLORS.text,
        bodyColor: CHART_COLORS.text,
        borderColor: CHART_COLORS.border,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items) =>
            parseLocalDate(days[items[0].dataIndex].date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          label: (ctx) => `${METRICS[metric].label}: ${formatNumber(ctx.parsed.y)} ${unit}`,
          afterLabel: (ctx) => {
            const day = days[ctx.dataIndex];
            const lines = [];
            if (metric !== 'volume') lines.push(`Best set: ${formatNumber(day.top.weight)} lbs x ${day.top.reps}`);
            if (isPR[ctx.dataIndex]) lines.push('New personal record!');
            return lines;
          },
        },
      },
    },
  };

  return (
    <div className="progress-graph-wrapper">
      <div className="graph-header">
        <h4>{METRICS[metric].title}</h4>
        <div className="metric-toggle" role="group" aria-label="Chart metric">
          {Object.entries(METRICS).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              className={`metric-btn ${metric === key ? 'active' : ''}`}
              aria-pressed={metric === key}
              onClick={() => setMetric(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="graph-stats">
        <div className="graph-stat">
          <span className="graph-stat-label">Latest</span>
          <span className="graph-stat-value">{formatNumber(latest)} {unit}</span>
        </div>
        <div className="graph-stat">
          <span className="graph-stat-label">Best</span>
          <span className="graph-stat-value">{formatNumber(best)} {unit}</span>
        </div>
        <div className="graph-stat">
          <span className="graph-stat-label">Change</span>
          <span className={`graph-stat-value ${change > 0 ? 'up' : change < 0 ? 'down' : ''}`}>
            {change > 0 ? '+' : ''}{formatNumber(change)} {unit}
            {days.length > 1 && first > 0 && ` (${change > 0 ? '+' : ''}${changePct.toFixed(0)}%)`}
          </span>
        </div>
      </div>

      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
      <p className="graph-legend"><span className="pr-dot" /> Personal record</p>
    </div>
  );
};

export default ProgressGraph;
