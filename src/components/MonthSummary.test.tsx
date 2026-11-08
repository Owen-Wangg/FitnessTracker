import { render, screen } from '@testing-library/react';
import MonthSummary from './MonthSummary';
import type { Workout } from '../types';

// Wednesday 11 June 2025.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2025, 5, 11, 12));
});
afterEach(() => vi.useRealTimers());

const bench = (date: string, weight: number, sets = 1): Workout => ({
  id: date,
  date,
  name: 'Flat Chest Press Machine',
  exerciseId: 'Leverage_Chest_Press',
  sets: Array.from({ length: sets }, () => ({ weight, reps: 10 })),
});

test('summarizes the month so far', () => {
  render(<MonthSummary workouts={[bench('2025-06-02', 100, 2), bench('2025-06-09', 120)]} />);
  expect(screen.getByText('June so far')).toBeInTheDocument();
  expect(screen.getByText('3,200')).toBeInTheDocument(); // 2 x 1,000 + 1,200
  expect(screen.getByText('Days trained').previousSibling).toHaveTextContent('2');
  expect(screen.getByText('Sets').previousSibling).toHaveTextContent('3');
});

test('compares against the same point last month', () => {
  render(<MonthSummary workouts={[bench('2025-05-05', 100), bench('2025-05-20', 900), bench('2025-06-05', 150)]} />);
  // 1,500 now vs 1,000 over May 1-11 (the May 20 session is ignored)
  expect(screen.getByText(/50% vs same point last month/)).toBeInTheDocument();
});

test('shows a PR badge only when a record was set this month', () => {
  const { rerender } = render(<MonthSummary workouts={[bench('2025-05-05', 100), bench('2025-06-05', 120)]} />);
  expect(screen.getByText('1 PR')).toBeInTheDocument();
  rerender(<MonthSummary workouts={[bench('2025-05-05', 120), bench('2025-06-05', 100)]} />);
  expect(screen.queryByText(/\bPRs?\b/)).not.toBeInTheDocument();
});

test('shows no comparison when last month has nothing to compare', () => {
  render(<MonthSummary workouts={[bench('2025-06-05', 100)]} />);
  expect(screen.queryByText(/vs same point last month/)).not.toBeInTheDocument();
});
