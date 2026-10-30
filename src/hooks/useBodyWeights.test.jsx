import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../components/ToastProvider';
import { queryResult } from '../testUtils/queryMock';
import { useBodyWeights } from './useBodyWeights';
import { UNDO_MS } from './useWorkouts';

const mockFrom = vi.fn();
vi.mock('../utils/supabaseClient', () => ({
  supabase: { from: (...args) => mockFrom(...args) },
}));

const user = { id: 'user-1' };
const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;
const queueResults = (...results) => results.forEach((r) => mockFrom.mockImplementationOnce(() => queryResult(r)));

const loaded = async () => {
  queueResults({
    data: [
      { id: 'b1', date: '2025-06-01', weight: '180.0' },
      { id: 'b2', date: '2025-06-08', weight: '178.5' },
    ],
    error: null,
  });
  const hook = renderHook(() => useBodyWeights(user), { wrapper });
  await waitFor(() => expect(hook.result.current.bodyWeights).toHaveLength(2));
  return hook;
};

afterEach(() => vi.useRealTimers());

test('loads entries oldest first with numeric weights', async () => {
  const { result } = await loaded();
  expect(result.current.bodyWeights.map((b) => b.weight)).toEqual([180, 178.5]);
});

test('logging a date that already exists replaces that day', async () => {
  const { result } = await loaded();
  queueResults({ data: { id: 'b2', date: '2025-06-08', weight: '177.0' }, error: null });

  let ok;
  await act(async () => {
    ok = await result.current.logBodyWeight({ date: '2025-06-08', weight: 177 });
  });

  expect(ok).toBe(true);
  expect(result.current.bodyWeights).toHaveLength(2);
  expect(result.current.bodyWeights[1].weight).toBe(177);
});

test('a new date is inserted in order', async () => {
  const { result } = await loaded();
  queueResults({ data: { id: 'b3', date: '2025-06-04', weight: '179' }, error: null });
  await act(async () => {
    await result.current.logBodyWeight({ date: '2025-06-04', weight: 179 });
  });
  expect(result.current.bodyWeights.map((b) => b.date)).toEqual(['2025-06-01', '2025-06-04', '2025-06-08']);
});

test('a failed save returns false and shows an error', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const { result } = await loaded();
  queueResults({ data: null, error: { message: 'too heavy' } });

  let ok;
  await act(async () => {
    ok = await result.current.logBodyWeight({ date: '2025-06-09', weight: 9999 });
  });
  expect(ok).toBe(false);
  expect(result.current.bodyWeights).toHaveLength(2);
  expect(screen.getByRole('alert')).toHaveTextContent(/too heavy/);
});

test('delete can be undone, and otherwise happens after the undo window', async () => {
  const { result } = await loaded();
  vi.useFakeTimers();

  act(() => result.current.deleteBodyWeight('b1'));
  expect(result.current.bodyWeights.map((b) => b.id)).toEqual(['b2']);
  act(() => userEvent.click(screen.getByRole('button', { name: 'Undo' })));
  expect(result.current.bodyWeights.map((b) => b.id)).toEqual(['b1', 'b2']);
  await act(async () => {
    vi.advanceTimersByTime(UNDO_MS + 1);
  });
  expect(mockFrom).toHaveBeenCalledTimes(1);

  queueResults({ data: null, error: null });
  act(() => result.current.deleteBodyWeight('b1'));
  await act(async () => {
    vi.advanceTimersByTime(UNDO_MS + 1);
  });
  expect(mockFrom).toHaveBeenCalledTimes(2);
  expect(result.current.bodyWeights.map((b) => b.id)).toEqual(['b2']);
});
