import { act, render, screen } from '@testing-library/react';
import MonthSummary from './MonthSummary';
import WeekStrip from './WeekStrip';
import type { Workout } from '../types';

// The app can stay open overnight; what it calls "today" has to move on by itself.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2025, 5, 30, 23, 59, 30)); // Mon 30 June 2025, 30 seconds before midnight
});
afterEach(() => vi.useRealTimers());

const bench = (date: string): Workout => ({
  id: date,
  date,
  name: 'Flat Chest Press Machine',
  exerciseId: 'Leverage_Chest_Press',
  sets: [{ weight: 100, reps: 5 }],
});

test('the month card moves to the new month at midnight', () => {
  render(<MonthSummary workouts={[bench('2025-06-02')]} />);
  expect(screen.getByText('June so far')).toBeInTheDocument();
  act(() => {
    vi.advanceTimersByTime(40_000);
  });
  expect(screen.getByText('July so far')).toBeInTheDocument();
});

test('the week strip moves its "today" marker at midnight', () => {
  render(<WeekStrip workouts={[bench('2025-06-02')]} />);
  expect(screen.getByLabelText(/2025-06-30.*today/)).toBeInTheDocument(); // Monday
  act(() => {
    vi.advanceTimersByTime(40_000);
  });
  expect(screen.queryByLabelText(/2025-06-30.*today/)).not.toBeInTheDocument();
  expect(screen.getByLabelText(/2025-07-01.*today/)).toBeInTheDocument(); // Tuesday
});
