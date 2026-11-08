import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PersonalRecordsCard from './PersonalRecordsCard';
import { UnitProvider } from './UnitProvider';
import { UNIT_KEY } from '../utils/units';
import type { Workout } from '../types';

afterEach(() => window.localStorage.clear());

const press: Workout = {
  id: 'p',
  date: '2025-06-01',
  name: 'Flat Chest Press Machine',
  exerciseId: 'Leverage_Chest_Press',
  sets: [{ weight: 185, reps: 8 }],
};
const pullUp: Workout = { id: 'u', date: '2025-06-10', name: 'Pull-Up', exerciseId: 'Pull_Up', sets: [{ weight: 25, reps: 10 }] };

test('shows the best set and its estimated 1RM for a weighted exercise', () => {
  render(<PersonalRecordsCard workouts={[press]} />);
  expect(screen.getByText('Flat Chest Press Machine')).toBeInTheDocument();
  expect(screen.getByText('185 lbs × 8')).toBeInTheDocument();
  expect(screen.getByText('Est. 1RM 234.3 lbs · Jun 1, 2025')).toBeInTheDocument();
});

test('shows reps and any added weight for a bodyweight exercise', () => {
  render(<PersonalRecordsCard workouts={[pullUp]} />);
  expect(screen.getByText('10 reps · +25 lbs')).toBeInTheDocument();
  expect(screen.getByText('Jun 10, 2025')).toBeInTheDocument();
});

test('shows kilograms when that unit is chosen', () => {
  window.localStorage.setItem(UNIT_KEY, 'kg');
  render(
    <UnitProvider>
      <PersonalRecordsCard workouts={[press]} />
    </UnitProvider>
  );
  expect(screen.getByText('83.9 kg × 8')).toBeInTheDocument();
});

test('lists the five most recent and expands to the rest', () => {
  const ids = ['Leg_Press', 'Leg_Extensions', 'Seated_Leg_Curl', 'Standing_Calf_Raises', 'Cable_Crunch', 'Butterfly', 'Triceps_Pushdown'];
  const workouts: Workout[] = ids.map((id, i) => ({
    id,
    date: `2025-06-${String(i + 1).padStart(2, '0')}`,
    name: id,
    exerciseId: id,
    sets: [{ weight: 100, reps: 5 }],
  }));
  render(<PersonalRecordsCard workouts={workouts} />);

  expect(screen.getAllByRole('listitem')).toHaveLength(5);
  userEvent.click(screen.getByRole('button', { name: 'Show all 7' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(7);
  userEvent.click(screen.getByRole('button', { name: 'Show fewer' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(5);
});

test('offers no toggle when everything already fits', () => {
  render(<PersonalRecordsCard workouts={[press, pullUp]} />);
  expect(screen.queryByRole('button', { name: /show/i })).not.toBeInTheDocument();
});

test('explains the empty state', () => {
  render(<PersonalRecordsCard workouts={[]} />);
  expect(screen.getByText(/your best lift for each exercise will show up here/i)).toBeInTheDocument();
});
