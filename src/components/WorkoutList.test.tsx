import { render, screen } from '@testing-library/react';
import WorkoutList from './WorkoutList';

const workout = { id: 'w1', date: '2025-06-01', name: 'Sled Push', exerciseId: null, sets: [{ id: 's', set_number: 1, weight: 90, reps: 4 }] };

test('shows the empty state with no workouts', () => {
  render(<WorkoutList workouts={[]} />);
  expect(screen.getByText('No workouts yet')).toBeInTheDocument();
});

test('shows a loading state instead of the empty state while loading', () => {
  render(<WorkoutList workouts={[]} loading />);
  expect(screen.getByText(/loading workouts/i)).toBeInTheDocument();
  expect(screen.queryByText('No workouts yet')).not.toBeInTheDocument();
});

test('renders one card per workout', () => {
  render(<WorkoutList workouts={[workout]} onDelete={() => {}} />);
  expect(screen.getByRole('heading', { name: 'Sled Push' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /delete sled push/i })).toBeInTheDocument();
});
