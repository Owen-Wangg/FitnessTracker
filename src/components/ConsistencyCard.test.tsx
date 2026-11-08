import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConsistencyCard from './ConsistencyCard';
import { GOAL_KEY } from '../utils/consistency';
import type { Workout } from '../types';

// Wednesday 11 June 2025.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2025, 5, 11, 12));
});
afterEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
});

const on = (...dates: string[]): Workout[] =>
  dates.map((date, i) => ({ id: `${date}-${i}`, date, name: 'Flat Chest Press Machine', exerciseId: 'Leverage_Chest_Press', sets: [{ weight: 100, reps: 5 }] }));

// Two finished weeks of 3 days, then 2 days so far this week.
const steady = on('2025-05-26', '2025-05-27', '2025-05-29', '2025-06-02', '2025-06-03', '2025-06-05', '2025-06-09', '2025-06-10');

test('shows the streak, the best, and progress toward this week\'s goal', () => {
  render(<ConsistencyCard workouts={steady} />);
  expect(screen.getByText('weeks in a row').previousSibling).toHaveTextContent('2');
  expect(screen.getByText('This week: 2 of 3 days')).toBeInTheDocument();
  expect(screen.getByText('Best: 2 weeks')).toBeInTheDocument();
});

test('shows the weekly average over finished weeks', () => {
  render(<ConsistencyCard workouts={steady} />);
  expect(screen.getByText('days per week').previousSibling).toHaveTextContent('3');
  expect(screen.getByText('Last 2 weeks')).toBeInTheDocument();
});

test('says so when the goal is met this week', () => {
  render(<ConsistencyCard workouts={[...steady, ...on('2025-06-11')]} />);
  expect(screen.getByText('Goal met this week')).toBeInTheDocument();
  expect(screen.getByText('weeks in a row').previousSibling).toHaveTextContent('3');
});

test('changing the goal recalculates and is remembered', () => {
  render(<ConsistencyCard workouts={steady} />);
  expect(screen.getByRole('radio', { name: '3' })).toBeChecked();

  userEvent.click(screen.getByRole('radio', { name: '4' }));
  expect(screen.getByRole('radio', { name: '4' })).toBeChecked();
  expect(screen.getByText('weeks in a row').previousSibling).toHaveTextContent('0'); // 3-day weeks no longer count
  expect(screen.getByText('This week: 2 of 4 days')).toBeInTheDocument();
  expect(window.localStorage.getItem(GOAL_KEY)).toBe('4');
});

test('starts from the saved goal', () => {
  window.localStorage.setItem(GOAL_KEY, '2');
  render(<ConsistencyCard workouts={steady} />);
  expect(screen.getByRole('radio', { name: '2' })).toBeChecked();
  expect(screen.getByText('Goal met this week')).toBeInTheDocument();
});

test('uses the singular for one week, and explains a missing average', () => {
  render(<ConsistencyCard workouts={on('2025-06-02', '2025-06-03', '2025-06-04')} />);
  expect(screen.getByText('week in a row')).toBeInTheDocument();
  expect(screen.getByText('Last 1 week')).toBeInTheDocument();
});

test('with nothing logged it shows zero and a dash', () => {
  render(<ConsistencyCard workouts={[]} />);
  expect(screen.getByText('weeks in a row').previousSibling).toHaveTextContent('0');
  expect(screen.getByText('days per week').previousSibling).toHaveTextContent('–');
  expect(screen.getByText('Needs one finished week')).toBeInTheDocument();
  expect(screen.queryByText(/^Best:/)).not.toBeInTheDocument();
});
