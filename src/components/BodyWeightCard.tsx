import React, { useMemo, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { formatLocalDate } from '../utils/workoutMetrics';
import { formatNumber as fmt, longDate, shortDate } from '../utils/format';
import { fromDisplay, toDisplay } from '../utils/units';
import { useUnit } from './UnitProvider';
import TrendChart, { type TrendPoint } from './TrendChart';
import type { BodyWeight, BodyWeightDraft } from '../types';
import '../assets/styles/BodyWeightCard.css';

interface BodyWeightPoint extends TrendPoint {
  entry: BodyWeight;
}

interface BodyWeightCardProps {
  entries?: BodyWeight[]; // sorted oldest first
  onLog: (entry: BodyWeightDraft) => Promise<boolean>;
  onDelete: (id: string) => void;
}

const BodyWeightCard = ({ entries: loggedEntries = [], onLog, onDelete }: BodyWeightCardProps) => {
  const { unit } = useUnit();
  // Entries are stored in pounds; everything below shows and takes the chosen unit.
  const entries = useMemo(() => loggedEntries.map((e) => ({ ...e, weight: toDisplay(e.weight, unit) })), [loggedEntries, unit]);
  const [date, setDate] = useState(() => formatLocalDate(new Date()));
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const latest = entries[entries.length - 1];
  const first = entries[0];
  const change = latest && first ? latest.weight - first.weight : 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = parseFloat(weight);
    if (!date || isNaN(value) || value <= 0) return;
    setSaving(true);
    const ok = await onLog({ date, weight: fromDisplay(value, unit) });
    setSaving(false);
    if (ok) setWeight('');
  };

  const data: BodyWeightPoint[] = entries.map((e) => ({ key: e.date, label: shortDate(e.date), value: e.weight, entry: e }));

  const describe = ({ entry }: BodyWeightPoint) => ({
    title: longDate(entry.date),
    lines: [`${fmt(entry.weight)} ${unit}`],
  });

  const recent = [...entries].reverse().slice(0, 7);

  return (
    <div className="body-weight-card card">
      <h3 className="bw-title">Body Weight</h3>

      {latest ? (
        <div className="bw-stats">
          <div className="bw-stat">
            <span className="bw-stat-label">Current</span>
            <span className="bw-stat-value">{fmt(latest.weight)} {unit}</span>
          </div>
          <div className="bw-stat">
            <span className="bw-stat-label">Change</span>
            <span className="bw-stat-value">
              {entries.length > 1 ? `${change > 0 ? '+' : ''}${fmt(change)} ${unit}` : '--'}
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
          <label htmlFor="bw-weight">Weight ({unit})</label>
          <input
            id="bw-weight"
            type="number"
            inputMode="decimal"
            min="1"
            max={unit === 'kg' ? '680' : '1499'}
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
          <TrendChart data={data} describe={describe} formatValue={fmt} height={220} ariaLabel="Body weight over time" />
        </div>
      )}
      {entries.length === 1 && <p className="bw-empty">Log one more day to see your trend.</p>}

      {recent.length > 0 && (
        <ul className="bw-list">
          {recent.map((e) => (
            <li key={e.id}>
              <span className="bw-list-date">{shortDate(e.date)}</span>
              <span className="bw-list-weight">{fmt(e.weight)} {unit}</span>
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
