import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgressGraph from './ProgressGraph';

vi.mock('recharts', async (importOriginal) => (await import('../testUtils/rechartsMock')).withFixedSize(importOriginal));

const BENCH = 'Leverage_Chest_Press';
const session = (date: string, weight: number, reps = 5) => ({
  id: date,
  date,
  name: 'Flat Chest Press Machine',
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

const dots = (container: HTMLElement) => [...container.querySelectorAll('svg circle')];

test('summarizes latest, best and change for top weight', () => {
  render(<ProgressGraph workouts={history} exerciseKey={BENCH} exerciseLabel="Flat Chest Press Machine" />);
  const stat = (label: string) => screen.getByText(label).nextSibling?.textContent;
  expect(stat('Latest')).toBe('200 lbs');
  expect(stat('Best')).toBe('200 lbs');
  expect(stat('Change')).toBe('+15 lbs (+8%)');
});

test('draws one point per day and marks only the PRs in gold', () => {
  const { container } = render(<ProgressGraph workouts={history} exerciseKey={BENCH} exerciseLabel="Flat Chest Press Machine" />);
  const points = dots(container).filter((c) => c.getAttribute('stroke') === 'var(--surface)');
  expect(points).toHaveLength(4);
  expect(points.filter((c) => c.getAttribute('fill') === 'var(--pr)')).toHaveLength(2);
});

test('switching metric changes the numbers and the title', () => {
  render(<ProgressGraph workouts={history} exerciseKey={BENCH} exerciseLabel="Flat Chest Press Machine" />);
  userEvent.click(screen.getByRole('button', { name: 'Volume' }));
  expect(screen.getByRole('heading', { name: /total weight x reps/i })).toBeInTheDocument();
  expect(screen.getByText('Latest').nextSibling).toHaveTextContent('1,000 lbs'); // 200 x 5
  expect(screen.getByRole('button', { name: 'Volume' })).toHaveAttribute('aria-pressed', 'true');

  userEvent.click(screen.getByRole('button', { name: 'Est. 1RM' }));
  expect(screen.getByText('Latest').nextSibling).toHaveTextContent('233.3 lbs'); // 200 x (1 + 5/30)
});

test('draws a trend line once there are three points, and says so in the legend', () => {
  const { container, rerender } = render(<ProgressGraph workouts={history} exerciseKey={BENCH} exerciseLabel="Flat Chest Press Machine" />);
  expect(container.querySelector('.trend-line')).toBeInTheDocument();
  expect(screen.getByText('Trend')).toBeInTheDocument();

  rerender(<ProgressGraph workouts={history.slice(0, 2)} exerciseKey={BENCH} exerciseLabel="Flat Chest Press Machine" />);
  expect(container.querySelector('.trend-line')).not.toBeInTheDocument();
  expect(screen.queryByText('Trend')).not.toBeInTheDocument();
});

describe('time range', () => {
  const longHistory = [
    session('2024-12-20', 150),
    session('2025-03-01', 165),
    session('2025-05-20', 180),
    session('2025-06-10', 190),
    session('2025-06-24', 200),
  ];
  const renderLong = () => render(<ProgressGraph workouts={longHistory} exerciseKey={BENCH} exerciseLabel="Flat Chest Press Machine" />);

  test('is hidden while the history is short', () => {
    render(<ProgressGraph workouts={history} exerciseKey={BENCH} exerciseLabel="Flat Chest Press Machine" />);
    expect(screen.queryByRole('group', { name: /time range/i })).not.toBeInTheDocument();
  });

  test('shows only the ranges that make a difference, defaulting to All', () => {
    renderLong();
    const group = screen.getByRole('group', { name: /time range/i });
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(['1M', '3M', '6M', 'All']);
    expect(within(group).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Change').nextSibling).toHaveTextContent('+50 lbs');
  });

  test('narrowing the range updates the numbers but keeps PRs judged against all history', () => {
    const { container } = renderLong();
    userEvent.click(screen.getByRole('button', { name: '1M' }));
    expect(screen.getByRole('button', { name: '1M' })).toHaveAttribute('aria-pressed', 'true');
    // last 30 days of data: Jun 10 (190) and Jun 24 (200)
    expect(screen.getByText('Change').nextSibling).toHaveTextContent('+10 lbs');
    const points = dots(container).filter((c) => c.getAttribute('stroke') === 'var(--surface)');
    expect(points).toHaveLength(2);
    expect(points.filter((c) => c.getAttribute('fill') === 'var(--pr)')).toHaveLength(2);
  });
});

describe('relative strength', () => {
  const withBodyWeight = [
    { ...session('2025-06-01', 150, 1), bodyWeight: 200 },
    { ...session('2025-06-08', 200, 1), bodyWeight: 160 },
  ];

  test('is offered once body weight is known, as a multiple of body weight', () => {
    render(<ProgressGraph workouts={withBodyWeight} exerciseKey={BENCH} exerciseLabel="Flat Chest Press Machine" />);
    userEvent.click(screen.getByRole('button', { name: 'Relative' }));
    expect(screen.getByRole('heading', { name: /multiple of your body weight/i })).toBeInTheDocument();
    expect(screen.getByText('Latest').nextSibling).toHaveTextContent('1.25 × BW');
    expect(screen.getByText('Change').nextSibling).toHaveTextContent('+0.50 × BW');
  });

  test('is not offered without a logged body weight', () => {
    render(<ProgressGraph workouts={history} exerciseKey={BENCH} exerciseLabel="Flat Chest Press Machine" />);
    expect(screen.queryByRole('button', { name: 'Relative' })).not.toBeInTheDocument();
  });
});

test('a single session still draws a point', () => {
  const { container } = render(
    <ProgressGraph workouts={[session('2025-06-01', 185)]} exerciseKey={BENCH} exerciseLabel="Flat Chest Press Machine" />
  );
  expect(dots(container).filter((c) => c.getAttribute('stroke') === 'var(--surface)')).toHaveLength(1);
  expect(screen.getByText('Change').nextSibling).toHaveTextContent('0 lbs');
});

test('exposes the chart to assistive tech', () => {
  render(<ProgressGraph workouts={history} exerciseKey={BENCH} exerciseLabel="Flat Chest Press Machine" />);
  expect(screen.getByRole('img', { name: /top weight for flat chest press machine over time/i })).toBeInTheDocument();
});

test('explains when there is nothing to plot', () => {
  const { rerender } = render(<ProgressGraph workouts={[]} exerciseKey={BENCH} exerciseLabel="Flat Chest Press Machine" />);
  expect(screen.getByText(/no workout data/i)).toBeInTheDocument();
  rerender(<ProgressGraph workouts={history} exerciseKey="squat" exerciseLabel="Squat" />);
  expect(screen.getByText(/no data for "squat"/i)).toBeInTheDocument();
});
