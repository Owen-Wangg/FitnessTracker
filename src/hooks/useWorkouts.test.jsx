import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../components/ToastProvider';
import { queryResult } from '../testUtils/queryMock';
import { useWorkouts, UNDO_MS } from './useWorkouts';

const mockFrom = vi.fn();
const mockRpc = vi.fn();
vi.mock('../utils/supabaseClient', () => ({
  supabase: { from: (...args) => mockFrom(...args), rpc: (...args) => mockRpc(...args) },
}));

// By default the database function is "not installed", which exercises the two-insert fallback.
beforeEach(() => {
  mockRpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } });
});

const user = { id: 'user-1' };
const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;

const row = {
  id: 'ex-1',
  date: '2025-06-01',
  name: 'Squat',
  exercise_id: 'Barbell_Squat',
  workout_sets: [
    { id: 's2', set_number: 2, weight: '185', reps: 5, set_type: 'normal' },
    { id: 's1', set_number: 1, weight: '135', reps: 8, set_type: 'normal' },
  ],
};

// Each supabase.from() call returns the next prepared result, in order.
const queueResults = (...results) => {
  results.forEach((r) => mockFrom.mockImplementationOnce(() => queryResult(r)));
};

const loaded = async () => {
  queueResults({ data: [row], error: null });
  const hook = renderHook(() => useWorkouts(user), { wrapper });
  await waitFor(() => expect(hook.result.current.status).toBe('ready'));
  return hook;
};

afterEach(() => vi.useRealTimers());

test('loads and normalizes the user\'s workouts', async () => {
  const { result } = await loaded();
  expect(result.current.workouts).toHaveLength(1);
  expect(result.current.workouts[0]).toMatchObject({ id: 'ex-1', exerciseId: 'Barbell_Squat' });
  expect(result.current.workouts[0].sets.map((s) => s.weight)).toEqual([135, 185]);
});

test('reports an error status when loading fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  queueResults({ data: null, error: { message: 'boom' } });
  const { result } = renderHook(() => useWorkouts(user), { wrapper });
  await waitFor(() => expect(result.current.status).toBe('error'));
  expect(result.current.workouts).toEqual([]);
});

test('stays idle with no user', () => {
  const { result } = renderHook(() => useWorkouts(null), { wrapper });
  expect(result.current.status).toBe('idle');
  expect(mockFrom).not.toHaveBeenCalled();
});

test('addWorkout (fallback) saves the exercise and its sets and puts it in state', async () => {
  const { result } = await loaded();
  queueResults(
    { data: { id: 'ex-2', date: '2025-06-08', name: 'Deadlift', exercise_id: 'Barbell_Deadlift' }, error: null },
    { data: [{ id: 's9', set_number: 1, weight: 225, reps: 5, set_type: 'normal' }], error: null }
  );

  let ok;
  await act(async () => {
    ok = await result.current.addWorkout({
      name: 'Deadlift',
      exerciseId: 'Barbell_Deadlift',
      date: '2025-06-08',
      sets: [{ weight: 225, reps: 5 }],
    });
  });

  expect(ok).toBe(true);
  expect(result.current.workouts.map((w) => w.name)).toEqual(['Deadlift', 'Squat']); // newest first
});

test('addWorkout (fallback) cleans up the exercise and shows an error when saving sets fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const { result } = await loaded();
  queueResults(
    { data: { id: 'ex-2', date: '2025-06-08', name: 'Deadlift', exercise_id: null }, error: null },
    { data: null, error: { message: 'sets failed' } },
    { data: null, error: null } // the cleanup delete
  );

  let ok;
  await act(async () => {
    ok = await result.current.addWorkout({ name: 'Deadlift', date: '2025-06-08', sets: [{ weight: 225, reps: 5 }] });
  });

  expect(ok).toBe(false);
  expect(result.current.workouts).toHaveLength(1);
  expect(mockFrom).toHaveBeenCalledTimes(4); // load, insert exercise, insert sets, cleanup
  expect(screen.getByRole('alert')).toHaveTextContent(/sets failed/);
});

test('deleteWorkout removes the entry now and deletes for real after the undo window', async () => {
  const { result } = await loaded();
  vi.useFakeTimers();
  queueResults({ data: null, error: null });

  act(() => result.current.deleteWorkout('ex-1'));
  expect(result.current.workouts).toEqual([]);
  expect(screen.getByText('Deleted Squat')).toBeInTheDocument();
  expect(mockFrom).toHaveBeenCalledTimes(1); // only the initial load so far

  await act(async () => {
    vi.advanceTimersByTime(UNDO_MS + 1);
  });
  expect(mockFrom).toHaveBeenCalledTimes(2);
  expect(mockFrom).toHaveBeenLastCalledWith('workout_exercises');
});

test('Undo brings the entry back and nothing is deleted', async () => {
  const { result } = await loaded();
  vi.useFakeTimers();

  act(() => result.current.deleteWorkout('ex-1'));
  expect(result.current.workouts).toEqual([]);

  act(() => userEvent.click(screen.getByRole('button', { name: 'Undo' })));
  expect(result.current.workouts.map((w) => w.id)).toEqual(['ex-1']);

  await act(async () => {
    vi.advanceTimersByTime(UNDO_MS + 1);
  });
  expect(mockFrom).toHaveBeenCalledTimes(1); // never sent a delete
});

test('a failed delete restores the entry and says so', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const { result } = await loaded();
  vi.useFakeTimers();
  queueResults({ data: null, error: { message: 'denied' } });

  act(() => result.current.deleteWorkout('ex-1'));
  await act(async () => {
    vi.advanceTimersByTime(UNDO_MS + 1);
  });

  expect(result.current.workouts.map((w) => w.id)).toEqual(['ex-1']);
  expect(screen.getByRole('alert')).toHaveTextContent(/denied/);
});

describe('with the add_workout_exercise function installed', () => {
  const saved = {
    id: 'ex-3',
    date: '2025-06-08',
    name: 'Deadlift',
    exercise_id: 'Barbell_Deadlift',
    workout_sets: [{ id: 's7', set_number: 1, weight: 225, reps: 5, set_type: 'normal' }],
  };

  test('saves in one call and uses its result', async () => {
    const { result } = await loaded();
    mockRpc.mockResolvedValue({ data: saved, error: null });

    let ok;
    await act(async () => {
      ok = await result.current.addWorkout({
        name: 'Deadlift',
        exerciseId: 'Barbell_Deadlift',
        date: '2025-06-08',
        sets: [{ weight: 225, reps: 5 }],
      });
    });

    expect(ok).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('add_workout_exercise', {
      p_date: '2025-06-08',
      p_name: 'Deadlift',
      p_exercise_id: 'Barbell_Deadlift',
      p_sets: [{ weight: 225, reps: 5 }],
    });
    expect(mockFrom).toHaveBeenCalledTimes(1); // only the initial load: no separate inserts
    expect(result.current.workouts.map((w) => w.name)).toEqual(['Deadlift', 'Squat']);
  });

  test('a real database error is reported and does not fall back', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = await loaded();
    mockRpc.mockResolvedValue({ data: null, error: { code: '23514', message: 'weight must be positive' } });

    let ok;
    await act(async () => {
      ok = await result.current.addWorkout({ name: 'Deadlift', date: '2025-06-08', sets: [{ weight: -1, reps: 5 }] });
    });

    expect(ok).toBe(false);
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent(/weight must be positive/);
  });
});
