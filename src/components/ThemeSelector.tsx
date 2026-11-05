import React from 'react';
import { FaDesktop, FaMoon, FaSun } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import type { ThemePreference } from '../types';
import '../assets/styles/ThemeSelector.css';

const OPTIONS: { value: ThemePreference; label: string; Icon: IconType }[] = [
  { value: 'system', label: 'System', Icon: FaDesktop },
  { value: 'light', label: 'Light', Icon: FaSun },
  { value: 'dark', label: 'Dark', Icon: FaMoon },
];

// Three-way choice: follow the device, or force light or dark.
interface ThemeSelectorProps {
  value?: ThemePreference;
  onChange: (preference: ThemePreference) => void;
}

const ThemeSelector = ({ value = 'system', onChange }: ThemeSelectorProps) => (
  <div className="theme-selector" role="radiogroup" aria-label="Theme">
    {OPTIONS.map(({ value: option, label, Icon }) => (
      <button
        key={option}
        type="button"
        role="radio"
        aria-checked={value === option}
        className={`theme-option ${value === option ? 'active' : ''}`}
        onClick={() => onChange(option)}
      >
        <Icon aria-hidden="true" />
        <span>{label}</span>
      </button>
    ))}
  </div>
);

export default ThemeSelector;
