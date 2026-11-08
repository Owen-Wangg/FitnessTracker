import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileScreen from './ProfileScreen';
import type { Workout } from '../types';

const noop = { onLogBodyWeight: async () => true, onDeleteBodyWeight: () => {} };

// jsdom has no layout, so give the chart a fixed size.
vi.mock('recharts', async (importOriginal) => (await import('../testUtils/rechartsMock')).withFixedSize(importOriginal));

test('shows the Google name and photo when available', () => {
  const user = { email: 'ada@example.com', user_metadata: { full_name: 'Ada Lovelace', avatar_url: 'https://x.test/a.png' } };
  const { container } = render(<ProfileScreen user={user} {...noop} />);
  expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
  expect(container.querySelector('.profile-picture-placeholder img')).toHaveAttribute('src', 'https://x.test/a.png');
});

test('falls back to the email prefix and an initial', () => {
  render(<ProfileScreen user={{ email: 'ada@example.com' }} {...noop} />);
  expect(screen.getByRole('heading', { name: 'ada' })).toBeInTheDocument();
  expect(screen.getByText('A')).toBeInTheDocument();
});

const log = (date: string, weight: number, reps: number, sets = 1): Workout => ({
  id: `${date}-${weight}`,
  date,
  name: 'Flat Chest Press Machine',
  exerciseId: 'Leverage_Chest_Press',
  sets: Array.from({ length: sets }, () => ({ weight, reps })),
});

const tile = (label: string) => screen.getByText(label).previousSibling;

test('shows your training totals as tiles', () => {
  const workouts = [log('2025-03-04', 100, 10, 3), log('2025-06-08', 200, 5, 2), log('2025-06-08', 50, 10)];
  render(<ProfileScreen user={{ email: 'a@b.com' }} workouts={workouts} {...noop} />);
  expect(tile('Days trained')).toHaveTextContent('2');
  expect(tile('Sets logged')).toHaveTextContent('6');
  expect(tile('lbs lifted')).toHaveTextContent('5,500'); // 3000 + 2000 + 500
  expect(tile('Training since')).toHaveTextContent('Mar 2025');
});

test('shortens a large lifetime total', () => {
  render(<ProfileScreen user={{ email: 'a@b.com' }} workouts={[log('2025-06-08', 200, 10, 700)]} {...noop} />);
  expect(tile('lbs lifted')).toHaveTextContent('1.4M');
  expect(tile('lbs lifted')).toHaveAttribute('title', '1,400,000 lbs');
});

test('shows dashes and zeros before anything is logged', () => {
  render(<ProfileScreen user={{ email: 'a@b.com' }} {...noop} />);
  expect(tile('Days trained')).toHaveTextContent('0');
  expect(tile('Training since')).toHaveTextContent('–');
});

test('still shows the body weight card with the latest entry and its chart', () => {
  const bodyWeights = [
    { id: '1', date: '2025-06-01', weight: 180 },
    { id: '2', date: '2025-06-08', weight: 178.5 },
  ];
  render(<ProfileScreen user={{ email: 'a@b.com' }} bodyWeights={bodyWeights} {...noop} />);
  expect(screen.getAllByText('178.5 lbs').length).toBeGreaterThan(0);
  expect(screen.getByTestId('chart')).toBeInTheDocument();
});

test('shows the theme selector and reports changes', () => {
  const onThemeChange = vi.fn();
  render(<ProfileScreen user={{ email: 'a@b.com' }} themePreference="light" onThemeChange={onThemeChange} {...noop} />);
  expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
  userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
  expect(onThemeChange).toHaveBeenCalledWith('dark');
});

test('hides the theme selector when no handler is given', () => {
  render(<ProfileScreen user={{ email: 'a@b.com' }} {...noop} />);
  expect(screen.queryByRole('radiogroup', { name: 'Theme' })).not.toBeInTheDocument();
});
