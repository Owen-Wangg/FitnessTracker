import React, { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { niceScale } from '../utils/progress';
import '../assets/styles/TrendChart.css';

// Line/area chart over time, shared by the exercise progress graph and the body weight chart.
//   data:     [{ key, label, value, highlight? }]  oldest first; highlighted points (PRs) are drawn in gold
//   describe: (point) => { title, lines: [string] }  content of the hover/tap tooltip
// Colors come from CSS variables, so the chart follows the theme.
export interface TrendPoint {
  key: string;
  label: string;
  value: number;
  highlight?: boolean;
}

interface TooltipContent {
  title: string;
  lines: string[];
}

// Recharts clones the element it is given and fills in these props.
interface DotProps {
  cx?: number;
  cy?: number;
  payload?: TrendPoint;
}

const Dot = ({ cx, cy, payload }: DotProps) => {
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={payload?.highlight ? 7 : 4}
      fill={payload?.highlight ? 'var(--pr)' : 'var(--chart-line)'}
      stroke="var(--surface)"
      strokeWidth={2}
    />
  );
};

interface TooltipCardProps<T extends TrendPoint> {
  active?: boolean;
  payload?: { payload: T }[];
  describe: (point: T) => TooltipContent;
}

const TooltipCard = <T extends TrendPoint>({ active, payload, describe }: TooltipCardProps<T>) => {
  if (!active || !payload || payload.length === 0) return null;
  const { title, lines } = describe(payload[0].payload);
  return (
    <div className="trend-tooltip">
      <strong>{title}</strong>
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>
  );
};

interface TrendChartProps<T extends TrendPoint> {
  data: T[];
  describe: (point: T) => TooltipContent;
  formatValue?: (value: number) => string;
  height?: number;
  ariaLabel: string;
}

const TrendChart = <T extends TrendPoint>({ data, describe, formatValue = String, height = 280, ariaLabel }: TrendChartProps<T>) => {
  const gradientId = useId();
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const { domain, ticks } = niceScale(min, max);

  return (
    <div className="trend-chart" style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-line)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--chart-line)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickMargin={8} padding={{ left: 12, right: 12 }} minTickGap={24} />
          <YAxis
            domain={domain}
            ticks={ticks}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={formatValue}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <Tooltip content={<TooltipCard describe={describe} />} cursor={{ stroke: 'var(--border-strong)' }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-line)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={<Dot />}
            activeDot={<Dot />}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
