import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnitProvider } from './UnitProvider';
import WorkoutFormModal from './WorkoutFormModal';
import WorkoutItem from './WorkoutItem';
import ProgressGraph from './ProgressGraph';
import BodyWeightCard from './BodyWeightCard';
import ProfileScreen from '../screens/ProfileScreen';
import { UNIT_KEY } from '../utils/units';
import type { Workout } from '../types';

vi.mock('recharts', async (importOriginal) => (await import('../testUtils/rechartsMock')).withFixedSize(importOriginal));
vi.setConfig({ testTimeout: 20000 });

const inKg = (ui: ReactElement) => {
  window.localStorage.setItem(UNIT_KEY, 'kg');
  return render(<UnitProvider>{ui}</UnitProvider>);
};

afterEach(() => window.localStorage.clear());

const legPress: Workout = {
  id: 'w1',
  date: '2025-06-01',
  name: 'Leg Press Machine',
  exerciseId: 'Leg_Press',
  sets: [{ weight: 135, reps: 8 }, { weight: 225, reps: 5 }],
};

describe('workout form in kilograms', () => {
  test('shows the weights converted and labels the unit', () => {
    inKg(<WorkoutFormModal initial={legPress} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('Weight (kg)')).toBeInTheDocument();
    expect(screen.getByLabelText(/set 1 weight in kilograms/i)).toHaveValue(61.23);
    expect(screen.getByLabelText(/set 2 weight in kilograms/i)).toHaveValue(102.06);
  });

  test('saving without touching a weight keeps its exact pounds', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    inKg(<WorkoutFormModal initial={legPress} onClose={vi.fn()} onSubmit={onSubmit} />);
    userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ sets: [{ weight: 135, reps: 8 }, { weight: 225, reps: 5 }] }));
    await screen.findByRole('button', { name: /save changes/i });
  });

  test('a weight you type in kg is saved as pounds', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    inKg(<WorkoutFormModal initial={legPress} onClose={vi.fn()} onSubmit={onSubmit} />);
    userEvent.clear(screen.getByLabelText(/set 2 weight/i));
    userEvent.type(screen.getByLabelText(/set 2 weight/i), '100');
    userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ sets: [{ weight: 135, reps: 8 }, { weight: 220.46, reps: 5 }] }));
    await screen.findByRole('button', { name: /save changes/i });
  });

  test('last time is shown in kg too', () => {
    inKg(<WorkoutFormModal initial={{ ...legPress, id: 'w2', date: '2025-06-08' }} history={[legPress]} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('1 × 8 @ 61.2 kg')).toBeInTheDocument();
    expect(screen.getByText('1 × 5 @ 102.1 kg')).toBeInTheDocument();
  });
});

test('workout list shows kilograms', () => {
  inKg(<WorkoutItem workout={legPress} />);
  expect(screen.getByText('61.2 kg')).toBeInTheDocument();
  expect(screen.getByText('102.1 kg')).toBeInTheDocument();
  expect(screen.getByText(/kg total/)).toBeInTheDocument();
});

test('progress chart summarizes in kilograms but leaves reps alone', () => {
  const session = (date: string, weight: number) => ({
    id: date,
    date,
    name: 'Flat Chest Press Machine',
    exerciseId: 'Leverage_Chest_Press',
    sets: [{ weight, reps: 5 }],
  });
  inKg(<ProgressGraph workouts={[session('2025-06-01', 185), session('2025-06-08', 200)]} exerciseKey="Leverage_Chest_Press" exerciseLabel="Flat Chest Press Machine" />);
  expect(screen.getByText('Latest').nextSibling).toHaveTextContent('90.7 kg');
});

test('body weight is logged in pounds even when typed in kg', async () => {
  const onLog = vi.fn().mockResolvedValue(true);
  inKg(<BodyWeightCard entries={[{ id: 'b1', date: '2025-06-01', weight: 176 }]} onLog={onLog} onDelete={vi.fn()} />);
  expect(screen.getByText('Current').nextSibling).toHaveTextContent('79.8 kg');
  userEvent.type(screen.getByLabelText('Weight (kg)'), '80');
  userEvent.click(screen.getByRole('button', { name: 'Log' }));
  expect(onLog).toHaveBeenCalledWith(expect.objectContaining({ weight: 176.37 }));
  await screen.findByRole('button', { name: 'Log' });
});

describe('profile', () => {
  const lifts: Workout[] = [
    { id: 'l1', date: '2025-06-01', name: 'Leg Press Machine', exerciseId: 'Leg_Press', sets: [{ weight: 100, reps: 100 }] },
  ]; // 10,000 lbs

  const profile = () =>
    render(
      <UnitProvider>
        <ProfileScreen
          bodyWeights={[{ id: 'b1', date: '2025-06-01', weight: 176 }]}
          workouts={lifts}
          onLogBodyWeight={vi.fn()}
          onDeleteBodyWeight={vi.fn()}
        />
      </UnitProvider>
    );

  test('defaults to pounds', () => {
    profile();
    expect(screen.getByRole('radio', { name: /pounds/i })).toBeChecked();
    expect(screen.getByText('lbs lifted').previousSibling).toHaveTextContent('10K');
    expect(screen.getByText('Current').nextSibling).toHaveTextContent('176 lbs');
  });

  test('switching to kilograms updates the stats and is remembered', () => {
    profile();
    userEvent.click(screen.getByRole('radio', { name: /kilograms/i }));
    expect(screen.getByRole('radio', { name: /kilograms/i })).toBeChecked();
    expect(screen.getByText('kg lifted').previousSibling).toHaveTextContent('4,536'); // 4,535.9 kg
    expect(screen.getByText('Current').nextSibling).toHaveTextContent('79.8 kg');
    expect(window.localStorage.getItem(UNIT_KEY)).toBe('kg');
  });
});
