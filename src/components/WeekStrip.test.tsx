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

const groupCount = (label: string) => {
  const list = screen.getByRole('list', { name: /sets by muscle group/i });
  return within(list).getByText(label).previousSibling?.textContent;
};

test('shows sets per muscle group for this week only', () => {
  render(<WeekStrip workouts={[press('a', '2025-06-02', 185, 4), press('b', '2025-06-09', 195, 3)]} />);
  expect(groupCount('Chest')).toBe('3'); // last week's four sets are not counted
  expect(groupCount('Legs')).toBe('0');
});

test('counts the personal records set this week', () => {
  render(<WeekStrip workouts={[press('a', '2025-06-02', 185), press('b', '2025-06-09', 195)]} />);
  expect(screen.getByText('1 PR')).toBeInTheDocument();
  expect(screen.getByText('1 day')).toBeInTheDocument();
});

test('no PR badge when nothing beat an earlier session', () => {
  render(<WeekStrip workouts={[press('a', '2025-06-02', 195), press('b', '2025-06-09', 185)]} />);
  expect(screen.queryByText(/\bPRs?\b/)).not.toBeInTheDocument();
});

test('shows days since each muscle group was last trained', () => {
  const legs: Workout = { id: 'l', date: '2025-06-02', name: 'Leg Press Machine', exerciseId: 'Leg_Press', sets: [{ weight: 300, reps: 8 }] };
  render(<WeekStrip workouts={[press('a', '2025-06-10', 195), legs]} />);
  const list = screen.getByRole('list', { name: /sets by muscle group/i });
  const age = (label: string) => within(list).getByText(label).nextSibling?.textContent;
  expect(age('Chest')).toBe('1d');
  expect(age('Legs')).toBe('9d'); // a week or more reads as stale
  expect(age('Back')).toBe('–');
  expect(within(list).getByText('Legs').closest('li')).toHaveClass('stale');
  expect(within(list).getByText('Chest').closest('li')).not.toHaveClass('stale');
});

test('says "today" for a group trained today', () => {
  render(<WeekStrip workouts={[press('a', '2025-06-11', 195)]} />);
  const list = screen.getByRole('list', { name: /sets by muscle group/i });
  expect(within(list).getByText('Chest').nextSibling).toHaveTextContent('today');
});

test('a week with no training still shows the breakdown, with zero sets and days since', () => {
  render(<WeekStrip workouts={[press('a', '2025-06-02', 185)]} />);
  expect(groupCount('Chest')).toBe('0');
  const list = screen.getByRole('list', { name: /sets by muscle group/i });
  expect(within(list).getByText('Chest').nextSibling).toHaveTextContent('9d');
  expect(screen.queryByText(/\bPRs?\b/)).not.toBeInTheDocument();
});

test('shows no breakdown before anything has been logged', () => {
  render(<WeekStrip workouts={[]} />);
  expect(screen.queryByRole('list', { name: /sets by muscle group/i })).not.toBeInTheDocument();
});
