import React, { useMemo, useState } from 'react';
import { parseLocalDate } from '../utils/workoutMetrics';
import { isBodyweight } from '../utils/exerciseLibrary';
import { toDisplay } from '../utils/units';
import { useUnit } from './UnitProvider';
import { buildSeries, valueFor, personalRecordFlags } from '../utils/progress';
import TrendChart, { type TrendPoint } from './TrendChart';
import type { Metric, Workout } from '../types';
import type { ScoredDay } from '../utils/progress';
import '../assets/styles/ProgressGraph.css';

const METRICS: Record<Metric, { label: string; title: string }> = {
  top: { label: 'Top weight', title: 'Heaviest set per day' },
  e1rm: { label: 'Est. 1RM', title: 'Estimated one-rep max (Epley) per day' },
  volume: { label: 'Volume', title: 'Total weight x reps per day' },
  reps: { label: 'Reps', title: 'Most reps in a single set per day' },
};

// Bodyweight exercises lead with reps; the weight metrics there include body weight.
const EXTERNAL_METRICS: Metric[] = ['top', 'e1rm', 'volume'];
const BODYWEIGHT_METRICS: Metric[] = ['reps', 'top', 'e1rm', 'volume'];
const formatNumber = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });
const shortDate = (date: string) => parseLocalDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const longDate = (date: string) =>
  parseLocalDate(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

interface ProgressPoint extends TrendPoint {
  day: ScoredDay;
}

interface ProgressGraphProps {
  workouts?: Workout[] | null;
  exerciseKey?: string | null; // library id, or the lowercased name of a custom exercise
  exerciseLabel?: string;
}

const ProgressGraph = ({ workouts, exerciseKey, exerciseLabel }: ProgressGraphProps) => {
  const [picked, setPicked] = useState<Metric | null>(null);
  const available = isBodyweight(exerciseKey, exerciseKey) ? BODYWEIGHT_METRICS : EXTERNAL_METRICS;
  const metric = picked && available.includes(picked) ? picked : available[0];
  const { unit: weightUnit } = useUnit();
  const unit = metric === 'reps' ? 'reps' : weightUnit;
  // Charted values are pounds, except reps; show them in the chosen unit.
  const shown = (value: number) => (metric === 'reps' ? value : toDisplay(value, weightUnit));

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

  const values = days.map((d) => shown(valueFor(d, metric)));
  const isPR = personalRecordFlags(values);

  const first = values[0];
  const latest = values[values.length - 1];
  const best = Math.max(...values);
  const change = latest - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;

  const data: ProgressPoint[] = days.map((day, i) => ({
    key: day.date,
    label: shortDate(day.date),
    value: values[i],
    highlight: isPR[i],
    day,
  }));

  const describe = ({ day, value, highlight }: ProgressPoint) => {
    const lines = [`${METRICS[metric].label}: ${formatNumber(value)} ${unit}`];
    if (metric !== 'volume' && metric !== 'reps') lines.push(`Best set: ${formatNumber(toDisplay(day.top.weight, weightUnit))} ${weightUnit} x ${day.top.reps}`);
    if (highlight) lines.push('New personal record!');
    return { title: longDate(day.date), lines };
  };

  return (
    <div className="progress-graph-wrapper">
      <div className="graph-header">
        <h4>{METRICS[metric].title}</h4>
        <div className="metric-toggle" role="group" aria-label="Chart metric">
          {available.map((key) => (
            <button
              key={key}
              type="button"
              className={`metric-btn ${metric === key ? 'active' : ''}`}
              aria-pressed={metric === key}
              onClick={() => setPicked(key)}
            >
              {METRICS[key].label}
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
