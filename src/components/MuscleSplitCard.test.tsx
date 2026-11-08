import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MuscleSplitCard from './MuscleSplitCard';
import type { Workout } from '../types';

// Monday 30 June 2025.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2025, 5, 30, 12));
});
afterEach(() => vi.useRealTimers());

const log = (date: string, exerciseId: string, sets: number): Workout => ({
  id: `${date}-${exerciseId}`,
  date,
  name: exerciseId,
  exerciseId,
  sets: Array.from({ length: sets }, () => ({ weight: 100, reps: 8 })),
});

const row = (group: string) => {
  const list = screen.getByRole('list', { name: /share of sets by muscle group/i });
  return within(list).getByText(group).closest('li') as HTMLElement;
};

test('shows each group\'s share and sets, and names the untouched ones', () => {
  render(<MuscleSplitCard workouts={[log('2025-06-20', 'Leverage_Chest_Press', 3), log('2025-06-21', 'Leg_Press', 1)]} />);
  expect(row('Chest')).toHaveTextContent('75% · 3 sets');
  expect(row('Legs')).toHaveTextContent('25% · 1 set');
  expect(row('Back')).toHaveTextContent('0% · 0 sets');
  expect(screen.getByText('No sets yet for Back, Shoulders, Arms, Core')).toBeInTheDocument();
});

test('names the least trained group when every group has some sets', () => {
  const groups = ['Leverage_Chest_Press', 'Dumbbell_Incline_Row', 'Dumbbell_Shoulder_Press', 'Triceps_Pushdown', 'Leg_Press', 'Cable_Crunch'];
  const workouts = groups.map((id, i) => log('2025-06-20', id, i === 5 ? 1 : 4));
  render(<MuscleSplitCard workouts={workouts} />);
  expect(screen.getByText('Least trained: Core (5%)')).toBeInTheDocument();
});

test('defaults to 90 days and changes with the period', () => {
  const workouts = [log('2025-06-20', 'Leverage_Chest_Press', 2), log('2025-04-20', 'Leg_Press', 2), log('2024-12-01', 'Cable_Crunch', 6)];
  render(<MuscleSplitCard workouts={workouts} />);
  expect(screen.getByRole('radio', { name: '90 days' })).toBeChecked();
  expect(row('Legs')).toHaveTextContent('50%');
  expect(row('Core')).toHaveTextContent('0%');

  userEvent.click(screen.getByRole('radio', { name: '30 days' }));
  expect(row('Chest')).toHaveTextContent('100%');
  expect(row('Legs')).toHaveTextContent('0%');

  userEvent.click(screen.getByRole('radio', { name: 'All time' }));
  expect(row('Core')).toHaveTextContent('60%');
});

test('says so when the period holds no sets', () => {
  render(<MuscleSplitCard workouts={[log('2024-01-01', 'Leg_Press', 3)]} />);
  expect(screen.getByText('No sets logged in this period.')).toBeInTheDocument();
  expect(screen.queryByRole('list', { name: /share of sets/i })).not.toBeInTheDocument();

  userEvent.click(screen.getByRole('radio', { name: 'All time' }));
  expect(row('Legs')).toHaveTextContent('100%');
});

test('with nothing logged it shows the empty message', () => {
  render(<MuscleSplitCard workouts={[]} />);
  expect(screen.getByText('No sets logged in this period.')).toBeInTheDocument();
});
