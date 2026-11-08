import { act, renderHook } from '@testing-library/react';
import { useToday } from './useToday';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2025, 5, 11, 23, 59, 30)); // 30 seconds before midnight, Wed 11 June 2025
});
afterEach(() => vi.useRealTimers());

test('starts as the current local date', () => {
  const { result } = renderHook(() => useToday());
  expect(result.current).toBe('2025-06-11');
});

test('rolls over to the next day just after midnight', () => {
  const { result } = renderHook(() => useToday());
  act(() => {
    vi.advanceTimersByTime(29_000); // 23:59:59, still the same day
  });
  expect(result.current).toBe('2025-06-11');
  act(() => {
    vi.advanceTimersByTime(3_000); // past midnight
  });
  expect(result.current).toBe('2025-06-12');
});

test('keeps rolling over on later nights', () => {
  const { result } = renderHook(() => useToday());
  act(() => {
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 40_000);
  });
  expect(result.current).toBe('2025-06-13');
});

test('catches up when the app returns to the foreground after a long sleep', () => {
  const { result } = renderHook(() => useToday());
  vi.setSystemTime(new Date(2025, 5, 14, 8, 0, 0)); // timers did not run while the device slept
  act(() => {
    window.dispatchEvent(new Event('focus'));
  });
  expect(result.current).toBe('2025-06-14');

  vi.setSystemTime(new Date(2025, 5, 15, 8, 0, 0));
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(result.current).toBe('2025-06-15');
});

test('stops listening and timing when unmounted', () => {
  const { unmount } = renderHook(() => useToday());
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
