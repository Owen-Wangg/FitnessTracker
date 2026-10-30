import { render, screen, within } from '@testing-library/react';
import HistoryScreen from './HistoryScreen';
import { formatLocalDate } from '../utils/workoutMetrics';

// jsdom has no canvas, so stand in for the chart.
jest.mock('react-chartjs-2', () => ({ Line: () => <div data-testid="chart" /> }));

const today = formatLocalDate(new Date());
const workout = (id, name, date = today) => ({
  id,
  date,
  name,
  exerciseId: null,
  sets: [{ id: `${id}-1`, set_number: 1, weight: 100, reps: 5 }],
});

test('shows only the selected day\'s workouts', () => {
  render(<HistoryScreen allWorkouts={[workout('a', 'Sled Push'), workout('b', 'Farmer Walk', '2020-01-01')]} />);
  expect(screen.getByRole('heading', { name: 'Sled Push' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Farmer Walk' })).not.toBeInTheDocument();
});

test('lists each exercise once in the graph dropdown, ignoring name casing', () => {
  render(
    <HistoryScreen
      allWorkouts={[workout('a', 'Bench Press'), workout('b', 'bench press', '2025-01-01'), workout('c', 'Sled Push')]}
    />
  );
  const select = screen.getByLabelText(/select exercise for graph/i);
  const labels = within(select).getAllByRole('option').map((o) => o.textContent);
  expect(labels).toEqual(['Bench Press', 'Sled Push']);
  expect(screen.getByTestId('chart')).toBeInTheDocument();
});

test('shows an empty state with no workouts', () => {
  render(<HistoryScreen allWorkouts={[]} />);
  expect(screen.getByText(/no workout data available/i)).toBeInTheDocument();
});
