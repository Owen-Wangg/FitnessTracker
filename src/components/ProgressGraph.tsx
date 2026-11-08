import React, { useMemo, useState } from 'react';
import { parseLocalDate } from '../utils/workoutMetrics';
import { isBodyweight } from '../utils/exerciseLibrary';
import { toDisplay } from '../utils/units';
import { useUnit } from './UnitProvider';
import { RANGES, availableRanges, buildSeries, inRange, valueFor, personalRecordFlags, type RangeKey } from '../utils/progress';
import TrendChart, { type TrendPoint } from './TrendChart';
import type { Metric, Workout } from '../types';
import type { ScoredDay } from '../utils/progress';
import '../assets/styles/ProgressGraph.css';

const METRICS: Record<Metric, { label: string; title: string }> = {
  top: { label: 'Top weight', title: 'Heaviest set per day' },
  e1rm: { label: 'Est. 1RM', title: 'Estimated one-rep max (Epley) per day' },
  volume: { label: 'Volume', title: 'Total weight x reps per day' },
  reps: { label: 'Reps', title: 'Most reps in a single set per day' },
  relative: { label: 'Relative', title: 'Estimated 1RM as a multiple of your body weight' },
};

// Bodyweight exercises lead with reps; the weight metrics there include body weight.
const EXTERNAL_METRICS: Metric[] = ['top', 'e1rm', 'volume'];
const BODYWEIGHT_METRICS: Metric[] = ['reps', 'top', 'e1rm', 'volume'];
const formatNumber = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });
const formatRatio = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  const days = useMemo(
    () => (workouts && exerciseKey ? buildSeries(workouts, exerciseKey) : []),
    [workouts, exerciseKey]
  );

  const [picked, setPicked] = useState<Metric | null>(null);
  // 'Relative' needs a logged body weight; bodyweight exercises already include it in their load.
  const bodyweightLift = isBodyweight(exerciseKey, exerciseKey);
  const available = bodyweightLift
    ? BODYWEIGHT_METRICS
    : days.some((d) => d.relative > 0) ? [...EXTERNAL_METRICS, 'relative' as Metric] : EXTERNAL_METRICS;
  const metric = picked && available.includes(picked) ? picked : available[0];
  const { unit: weightUnit } = useUnit();
  const unit = metric === 'reps' ? 'reps' : metric === 'relative' ? '× BW' : weightUnit;
  const format = metric === 'relative' ? formatRatio : formatNumber;
  // Charted values are pounds, except reps and ratios; show pounds in the chosen unit.
  const shown = (value: number) => (metric === 'reps' || metric === 'relative' ? value : toDisplay(value, weightUnit));

  // The range choice only appears once the history is longer than the shortest range.
  const [pickedRange, setPickedRange] = useState<RangeKey | null>(null);
  const rangeOptions = availableRanges(days);
  const range = pickedRange && rangeOptions.includes(pickedRange) ? pickedRange : 'all';

  if (!workouts || !Array.isArray(workouts) || workouts.length === 0) {
    return <p className="graph-message">No workout data available to display progress.</p>;
  }
  if (!exerciseKey) {
    return <p className="graph-message">Please select an exercise to see its progress.</p>;
  }
  if (days.length === 0) {
    return <p className="graph-message">No data for "{exerciseLabel}".</p>;
  }

  // Personal records are judged against the whole history, then the chosen range is cut out of it.
  const allValues = days.map((d) => shown(valueFor(d, metric)));
  const allFlags = personalRecordFlags(allValues);
  const visible = inRange(
    days.map((day, i) => ({ date: day.date, day, value: allValues[i], highlight: allFlags[i] })),
    range
  );
  const values = visible.map((p) => p.value);

  const first = values[0];
  const latest = values[values.length - 1];
  const best = Math.max(...values);
  const change = latest - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;

  const data: ProgressPoint[] = visible.map(({ day, value, highlight }) => ({
    key: day.date,
    label: shortDate(day.date),
    value,
    highlight,
    day,
  }));

  const describe = ({ day, value, highlight }: ProgressPoint) => {
    const lines = [`${METRICS[metric].label}: ${format(value)} ${unit}`];
    if (metric === 'top' || metric === 'e1rm' || metric === 'relative') lines.push(`Best set: ${formatNumber(toDisplay(day.top.weight, weightUnit))} ${weightUnit} x ${day.top.reps}`);
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
          <span className="graph-stat-value">{format(latest)} {unit}</span>
        </div>
        <div className="graph-stat">
          <span className="graph-stat-label">Best</span>
          <span className="graph-stat-value">{format(best)} {unit}</span>
        </div>
        <div className="graph-stat">
          <span className="graph-stat-label">Change</span>
          <span className={`graph-stat-value ${change > 0 ? 'up' : change < 0 ? 'down' : ''}`}>
            {change > 0 ? '+' : ''}{format(change)} {unit}
            {values.length > 1 && first > 0 && ` (${change > 0 ? '+' : ''}${changePct.toFixed(0)}%)`}
          </span>
        </div>
      </div>

      <TrendChart
        data={data}
        describe={describe}
        formatValue={format}
        trend
        ariaLabel={`${METRICS[metric].label} for ${exerciseLabel} over time`}
      />
      <div className="graph-footer">
        <p className="graph-legend">
          <span className="legend-item"><span className="pr-dot" /> Personal record</span>
          {data.length >= 3 && <span className="legend-item"><span className="trend-swatch" /> Trend</span>}
        </p>
        {rangeOptions.length > 0 && (
          <div className="metric-toggle range-toggle" role="group" aria-label="Time range">
            {RANGES.filter((r) => rangeOptions.includes(r.key)).map((r) => (
              <button
                key={r.key}
                type="button"
                className={`metric-btn ${range === r.key ? 'active' : ''}`}
                aria-pressed={range === r.key}
                onClick={() => setPickedRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressGraph;
