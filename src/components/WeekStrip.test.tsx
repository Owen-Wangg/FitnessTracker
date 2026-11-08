import { render, screen, within } from '@testing-library/react';
import WeekStrip from './WeekStrip';
import type { Workout } from '../types';

// Wednesday 11 June 2025; that week starts on Monday the 9th.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2025, 5, 11, 12));
});
afterEach(() => vi.useRealTimers());

const press = (id: string, date: string, weight: number, sets = 1): Workout => ({
  id,
  date,
  name: 'Flat Chest Press Machine',
  exerciseId: 'Leverage_Chest_Press',
  sets: Array.from({ length: sets }, () => ({ weight, reps: 5 })),
});

const groupCell = (label: string) => {
  const list = screen.getByRole('list', { name: /sets by muscle group/i });
  return within(list).getByText(label).closest('li') as HTMLElement;
};

test('shows sets per muscle group for this week only', () => {
  render(<WeekStrip workouts={[press('a', '2025-06-02', 185, 4), press('b', '2025-06-09', 195, 3)]} />);
  expect(groupCell('Chest')).toHaveTextContent('3 sets'); // last week's four sets are not counted
  expect(groupCell('Legs')).toHaveTextContent('0 sets');
});

test('counts the personal records set this week', () => {
  render(<WeekStrip workouts={[press('a', '2025-06-02', 185), press('b', '2025-06-09', 195)]} />);
  expect(screen.getByText('1 PR')).toBeInTheDocument();
  expect(screen.getByText('1 day trained')).toBeInTheDocument();
});

test('no PR badge when nothing beat an earlier session', () => {
  render(<WeekStrip workouts={[press('a', '2025-06-02', 195), press('b', '2025-06-09', 185)]} />);
  expect(screen.queryByText(/\bPRs?\b/)).not.toBeInTheDocument();
});

test('says in words how long ago each muscle group was trained', () => {
  const legs: Workout = { id: 'l', date: '2025-06-02', name: 'Leg Press Machine', exerciseId: 'Leg_Press', sets: [{ weight: 300, reps: 8 }] };
  render(<WeekStrip workouts={[press('a', '2025-06-10', 195), legs]} />);
  expect(groupCell('Chest')).toHaveTextContent('Trained yesterday');
  expect(groupCell('Legs')).toHaveTextContent('Trained 9d ago');
  expect(groupCell('Back')).toHaveTextContent('Not trained yet');
  expect(groupCell('Legs')).toHaveClass('stale'); // a week or more reads as stale
  expect(groupCell('Chest')).not.toHaveClass('stale');
});

test('says "Trained today" for a group trained today', () => {
  render(<WeekStrip workouts={[press('a', '2025-06-11', 195)]} />);
  expect(groupCell('Chest')).toHaveTextContent('Trained today');
});

test('uses the singular for one set', () => {
  render(<WeekStrip workouts={[press('a', '2025-06-10', 195, 1)]} />);
  expect(groupCell('Chest')).toHaveTextContent('1 set');
  expect(groupCell('Chest')).not.toHaveTextContent('1 sets');
});

test('a week with no training still shows the breakdown, with zero sets and how long ago', () => {
  render(<WeekStrip workouts={[press('a', '2025-06-02', 185)]} />);
  expect(groupCell('Chest')).toHaveTextContent('0 sets');
  expect(groupCell('Chest')).toHaveTextContent('Trained 9d ago');
  expect(screen.queryByText(/PRs?/)).not.toBeInTheDocument();
});

test('words the volume and the change from last week plainly', () => {
  render(<WeekStrip workouts={[press('a', '2025-06-02', 100), press('b', '2025-06-10', 150)]} />);
  expect(screen.getByText(/lbs lifted this week/)).toBeInTheDocument();
  expect(screen.getByText(/50% more than last week/)).toBeInTheDocument();
});

test('shows no breakdown before anything has been logged', () => {
  render(<WeekStrip workouts={[]} />);
  expect(screen.queryByRole('list', { name: /sets by muscle group/i })).not.toBeInTheDocument();
});
