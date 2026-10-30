import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryScreen from './HistoryScreen';
import { formatLocalDate } from '../utils/workoutMetrics';

// jsdom has no canvas, so stand in for the chart.
vi.mock('react-chartjs-2', () => ({ Line: () => <div data-testid="chart" /> }));

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

describe('calendar', () => {
  // A day in the current month other than today, as 'YYYY-MM-DD' plus its day number.
  const otherDay = () => {
    const now = new Date();
    const day = now.getDate() === 1 ? 2 : 1;
    return { day, date: formatLocalDate(new Date(now.getFullYear(), now.getMonth(), day)) };
  };
  const dayButton = (container, n) =>
    [...container.querySelectorAll('.rdp-day:not(.rdp-outside) .rdp-day_button')].find((b) => b.textContent === String(n));

  test('picking a day shows the workouts for that day', () => {
    const { day, date } = otherDay();
    const { container } = render(
      <HistoryScreen allWorkouts={[workout('a', 'Sled Push'), workout('b', 'Farmer Walk', date)]} />
    );
    expect(screen.getByRole('heading', { name: 'Sled Push' })).toBeInTheDocument();

    userEvent.click(dayButton(container, day));
    expect(screen.getByRole('heading', { name: 'Farmer Walk' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sled Push' })).not.toBeInTheDocument();
  });

  test('clicking the selected day does not deselect it', () => {
    const { container } = render(<HistoryScreen allWorkouts={[workout('a', 'Sled Push')]} />);
    userEvent.click(dayButton(container, new Date().getDate()));
    expect(screen.getByRole('heading', { name: 'Sled Push' })).toBeInTheDocument();
  });

  test('marks only the days that have workouts', () => {
    const { day, date } = otherDay();
    const { container } = render(<HistoryScreen allWorkouts={[workout('a', 'Sled Push', date)]} />);
    const marked = [...container.querySelectorAll('.rdp-day.has-workouts .rdp-day_button')].map((b) => b.textContent);
    expect(marked).toEqual([String(day)]);
  });
});
