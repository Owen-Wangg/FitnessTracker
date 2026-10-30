import React, { useMemo, useState } from 'react';
import { parseLocalDate } from '../utils/workoutMetrics';
import { buildSeries, valueFor, personalRecordFlags } from '../utils/progress';
import TrendChart from './TrendChart';
import '../assets/styles/ProgressGraph.css';

const METRICS = {
  top: { label: 'Top weight', title: 'Heaviest set per day' },
  e1rm: { label: 'Est. 1RM', title: 'Estimated one-rep max (Epley) per day' },
  volume: { label: 'Volume', title: 'Total weight x reps per day' },
};

const UNIT = 'lbs';
const formatNumber = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });
const shortDate = (date) => parseLocalDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const longDate = (date) =>
  parseLocalDate(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const ProgressGraph = ({ workouts, exerciseKey, exerciseLabel }) => {
  const [metric, setMetric] = useState('top');

  const days = useMemo(
    () => (workouts && exerciseKey ? buildSeries(workouts, exerciseKey) : []),
    [workouts, exerciseKey]
  );

  if (!workouts || !Array.isArray(workouts) || workouts.length === 0) {
    return <p className="graph-message">No workout data available to display progress.</p>;
  }
  if (!exerciseKey) {
    return <p className="graph-message">Please select an exercise to see its progress.</p>;
  }
  if (days.length === 0) {
    return <p className="graph-message">No data for "{exerciseLabel}".</p>;
  }

  const values = days.map((d) => valueFor(d, metric));
  const isPR = personalRecordFlags(values);

  const first = values[0];
  const latest = values[values.length - 1];
  const best = Math.max(...values);
  const change = latest - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;

  const data = days.map((day, i) => ({
    key: day.date,
    label: shortDate(day.date),
    value: values[i],
    highlight: isPR[i],
    day,
  }));

  const describe = ({ day, value, highlight }) => {
    const lines = [`${METRICS[metric].label}: ${formatNumber(value)} ${UNIT}`];
    if (metric !== 'volume') lines.push(`Best set: ${formatNumber(day.top.weight)} lbs x ${day.top.reps}`);
    if (highlight) lines.push('New personal record!');
    return { title: longDate(day.date), lines };
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
          <span className="graph-stat-value">{formatNumber(latest)} {UNIT}</span>
        </div>
        <div className="graph-stat">
          <span className="graph-stat-label">Best</span>
          <span className="graph-stat-value">{formatNumber(best)} {UNIT}</span>
        </div>
        <div className="graph-stat">
          <span className="graph-stat-label">Change</span>
          <span className={`graph-stat-value ${change > 0 ? 'up' : change < 0 ? 'down' : ''}`}>
            {change > 0 ? '+' : ''}{formatNumber(change)} {UNIT}
            {days.length > 1 && first > 0 && ` (${change > 0 ? '+' : ''}${changePct.toFixed(0)}%)`}
          </span>
        </div>
      </div>

      <TrendChart
        data={data}
        describe={describe}
        formatValue={formatNumber}
        ariaLabel={`${METRICS[metric].label} for ${exerciseLabel} over time`}
      />
      <p className="graph-legend"><span className="pr-dot" /> Personal record</p>
    </div>
  );
};

export default ProgressGraph;
