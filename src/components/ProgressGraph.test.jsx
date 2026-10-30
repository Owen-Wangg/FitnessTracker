import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgressGraph from './ProgressGraph';

vi.mock('recharts', async (importOriginal) => (await import('../testUtils/rechartsMock')).withFixedSize(importOriginal));

const BENCH = 'Barbell_Bench_Press_-_Medium_Grip';
const session = (date, weight, reps = 5) => ({
  id: date,
  date,
  name: 'Bench Press',
  exerciseId: BENCH,
  sets: [{ id: `${date}-1`, set_number: 1, weight, reps }],
});

// 185 -> 195 -> 190 -> 200: PRs on the 2nd and 4th sessions
const history = [
  session('2025-06-01', 185),
  session('2025-06-08', 195),
  session('2025-06-15', 190),
  session('2025-06-22', 200),
];

const dots = (container) => [...container.querySelectorAll('svg circle')];

test('summarizes latest, best and change for top weight', () => {
  render(<ProgressGraph workouts={history} exerciseKey={BENCH} exerciseLabel="Bench Press" />);
  const stat = (label) => screen.getByText(label).nextSibling.textContent;
  expect(stat('Latest')).toBe('200 lbs');
  expect(stat('Best')).toBe('200 lbs');
  expect(stat('Change')).toBe('+15 lbs (+8%)');
});

test('draws one point per day and marks only the PRs in gold', () => {
  const { container } = render(<ProgressGraph workouts={history} exerciseKey={BENCH} exerciseLabel="Bench Press" />);
  const points = dots(container).filter((c) => c.getAttribute('stroke') === 'var(--surface)');
  expect(points).toHaveLength(4);
  expect(points.filter((c) => c.getAttribute('fill') === 'var(--pr)')).toHaveLength(2);
});

test('switching metric changes the numbers and the title', () => {
  render(<ProgressGraph workouts={history} exerciseKey={BENCH} exerciseLabel="Bench Press" />);
  userEvent.click(screen.getByRole('button', { name: 'Volume' }));
  expect(screen.getByRole('heading', { name: /total weight x reps/i })).toBeInTheDocument();
  expect(screen.getByText('Latest').nextSibling).toHaveTextContent('1,000 lbs'); // 200 x 5
  expect(screen.getByRole('button', { name: 'Volume' })).toHaveAttribute('aria-pressed', 'true');

  userEvent.click(screen.getByRole('button', { name: 'Est. 1RM' }));
  expect(screen.getByText('Latest').nextSibling).toHaveTextContent('233.3 lbs'); // 200 x (1 + 5/30)
});

test('a single session still draws a point', () => {
  const { container } = render(
    <ProgressGraph workouts={[session('2025-06-01', 185)]} exerciseKey={BENCH} exerciseLabel="Bench Press" />
  );
  expect(dots(container).filter((c) => c.getAttribute('stroke') === 'var(--surface)')).toHaveLength(1);
  expect(screen.getByText('Change').nextSibling).toHaveTextContent('0 lbs');
});

test('exposes the chart to assistive tech', () => {
  render(<ProgressGraph workouts={history} exerciseKey={BENCH} exerciseLabel="Bench Press" />);
  expect(screen.getByRole('img', { name: /top weight for bench press over time/i })).toBeInTheDocument();
});

test('explains when there is nothing to plot', () => {
  const { rerender } = render(<ProgressGraph workouts={[]} exerciseKey={BENCH} exerciseLabel="Bench Press" />);
  expect(screen.getByText(/no workout data/i)).toBeInTheDocument();
  rerender(<ProgressGraph workouts={history} exerciseKey="squat" exerciseLabel="Squat" />);
  expect(screen.getByText(/no data for "squat"/i)).toBeInTheDocument();
});
