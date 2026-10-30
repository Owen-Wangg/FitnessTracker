import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { FaTrash } from 'react-icons/fa';
import { formatLocalDate, parseLocalDate } from '../utils/workoutMetrics';
import '../assets/styles/BodyWeightCard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });
const shortDate = (d) => parseLocalDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// entries: [{ id, date, weight }] sorted oldest first
const BodyWeightCard = ({ entries = [], onLog, onDelete }) => {
  const [date, setDate] = useState(() => formatLocalDate(new Date()));
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const latest = entries[entries.length - 1];
  const first = entries[0];
  const change = latest && first ? latest.weight - first.weight : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = parseFloat(weight);
    if (!date || isNaN(value) || value <= 0) return;
    setSaving(true);
    const ok = await onLog({ date, weight: value });
    setSaving(false);
    if (ok) setWeight('');
  };

  const data = {
    labels: entries.map((e) => shortDate(e.date)),
    datasets: [
      {
        data: entries.map((e) => e.weight),
        fill: { target: 'origin', above: 'rgba(91, 141, 239, 0.12)' },
        borderColor: 'rgb(91, 141, 239)',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(91, 141, 239)',
        pointBorderColor: '#12151c',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8b93a7', font: { size: 11 }, maxRotation: 0, autoSkip: true } },
      y: {
        grace: '10%',
        grid: { color: 'rgba(139, 147, 167, 0.12)' },
        border: { display: false },
        ticks: { color: '#8b93a7', callback: (v) => fmt(v) },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#181c26',
        titleColor: '#e8eaf0',
        bodyColor: '#e8eaf0',
        borderColor: '#323a4d',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items) =>
            parseLocalDate(entries[items[0].dataIndex].date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          label: (ctx) => `${fmt(ctx.parsed.y)} lbs`,
        },
      },
    },
  };

  const recent = [...entries].reverse().slice(0, 7);

  return (
    <div className="body-weight-card card">
      <h3 className="bw-title">Body Weight</h3>

      {latest ? (
        <div className="bw-stats">
          <div className="bw-stat">
            <span className="bw-stat-label">Current</span>
            <span className="bw-stat-value">{fmt(latest.weight)} lbs</span>
          </div>
          <div className="bw-stat">
            <span className="bw-stat-label">Change</span>
            <span className="bw-stat-value">
              {entries.length > 1 ? `${change > 0 ? '+' : ''}${fmt(change)} lbs` : '--'}
            </span>
          </div>
          <div className="bw-stat">
            <span className="bw-stat-label">Entries</span>
            <span className="bw-stat-value">{entries.length}</span>
          </div>
        </div>
      ) : (
        <p className="bw-empty">No entries yet. Log your weight below to start tracking.</p>
      )}

      <form className="bw-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="bw-date">Date</label>
          <input id="bw-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="bw-weight">Weight (lbs)</label>
          <input
            id="bw-weight"
            type="number"
            inputMode="decimal"
            min="1"
            max="1499"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={latest ? fmt(latest.weight) : 'e.g. 175'}
            required
          />
        </div>
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Log'}</button>
      </form>
      <p className="field-hint bw-hint">Logging again on the same date replaces that day's entry.</p>

      {entries.length > 1 && (
        <div className="bw-chart">
          <Line data={data} options={options} />
        </div>
      )}
      {entries.length === 1 && <p className="bw-empty">Log one more day to see your trend.</p>}

      {recent.length > 0 && (
        <ul className="bw-list">
          {recent.map((e) => (
            <li key={e.id}>
              <span className="bw-list-date">{shortDate(e.date)}</span>
              <span className="bw-list-weight">{fmt(e.weight)} lbs</span>
              <button
                type="button"
                className="bw-delete"
                onClick={() => onDelete(e.id)}
                aria-label={`Delete entry for ${shortDate(e.date)}`}
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BodyWeightCard;
