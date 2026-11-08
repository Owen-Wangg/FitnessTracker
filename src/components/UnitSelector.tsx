import React from 'react';
import { UNITS, type Unit } from '../utils/units';
import '../assets/styles/ThemeSelector.css';

const LABELS: Record<Unit, string> = { lbs: 'Pounds (lbs)', kg: 'Kilograms (kg)' };

// Two-way choice between pounds and kilograms.
interface UnitSelectorProps {
  value: Unit;
  onChange: (unit: Unit) => void;
}

const UnitSelector = ({ value, onChange }: UnitSelectorProps) => (
  <div className="theme-selector unit-selector" role="radiogroup" aria-label="Weight unit">
    {UNITS.map((unit) => (
      <button
        key={unit}
        type="button"
        role="radio"
        aria-checked={value === unit}
        className={`theme-option ${value === unit ? 'active' : ''}`}
        onClick={() => onChange(unit)}
      >
        {LABELS[unit]}
      </button>
    ))}
  </div>
);

export default UnitSelector;
