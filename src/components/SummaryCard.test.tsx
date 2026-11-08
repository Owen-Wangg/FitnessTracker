import { render, screen } from '@testing-library/react';
import SummaryCard from './SummaryCard';
import { applyBodyWeight } from '../utils/workoutMetrics';
import type { Workout } from '../types';

const bench: Workout = {
  id: 'b',
  date: '2025-06-10',
  name: 'Flat Chest Press Machine',
  exerciseId: 'Leverage_Chest_Press',
  sets: [{ weight: 100, reps: 10 }],
};
const pullUps: Workout = { id: 'p', date: '2025-06-10', name: 'Pull-Up', exerciseId: 'Pull_Up', sets: [{ weight: 0, reps: 10 }] };

// What the app passes down: bodyweight sets carry a load that includes a 180 lb body weight.
const withBodyWeight = (workouts: Workout[]) => applyBodyWeight(workouts, [{ id: 'bw', date: '2025-06-01', weight: 180 }]);

test('shows the weight lifted, the number of exercises and sets', () => {
  render(<SummaryCard workouts={[bench]} />);
  expect(screen.getByText('1,000')).toBeInTheDocument();
  expect(screen.getByText('Exercises').previousSibling).toHaveTextContent('1');
  expect(screen.getByText('Sets').previousSibling).toHaveTextContent('1');
  expect(screen.getByText('Top weight').previousSibling).toHaveTextContent('100');
});

test('body weight is not counted in the total or the top weight', () => {
  render(<SummaryCard workouts={withBodyWeight([bench, pullUps])} />);
  expect(screen.getByText('1,000')).toBeInTheDocument(); // not 1,000 + 180 x 10
  expect(screen.getByText('Top weight').previousSibling).toHaveTextContent('100'); // not 180
  expect(screen.getByText('Sets').previousSibling).toHaveTextContent('2');
});

test('added weight on a bodyweight exercise does count', () => {
  const weighted: Workout = { ...pullUps, sets: [{ weight: 25, reps: 4 }] };
  render(<SummaryCard workouts={withBodyWeight([weighted])} />);
  expect(screen.getByText('100')).toBeInTheDocument(); // 25 x 4
  expect(screen.getByText('Top weight').previousSibling).toHaveTextContent('25');
});

test('is empty with nothing logged today', () => {
  render(<SummaryCard workouts={[]} />);
  expect(screen.getByText('Top weight').previousSibling).toHaveTextContent('--');
});
