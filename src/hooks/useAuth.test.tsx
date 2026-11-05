import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ToastProvider } from '../components/ToastProvider';
import { useAuth } from './useAuth';

type AuthListener = (event: string, session: unknown) => void;

let mockSession: { user: { id: string; email?: string } } | null = null;
let mockListener: AuthListener | null = null;
let mockSignOutError: { message: string } | null = null;
const mockUnsubscribe = vi.fn();

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: mockSession } }),
      onAuthStateChange: (cb: AuthListener) => {
        mockListener = cb;
        return { data: { subscription: { unsubscribe: () => mockUnsubscribe() } } };
      },
      signOut: () => Promise.resolve({ error: mockSignOutError }),
    },
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => <ToastProvider>{children}</ToastProvider>;

beforeEach(() => {
  mockSession = null;
  mockListener = null;
  mockSignOutError = null;
});

test('starts loading, then reports no user when signed out', async () => {
  const { result } = renderHook(() => useAuth(), { wrapper });
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.user).toBeNull();
});

test('exposes the user from an existing session', async () => {
  mockSession = { user: { id: 'u1', email: 'a@b.com' } };
  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.user).toEqual({ id: 'u1', email: 'a@b.com' }));
});

test('follows auth state changes, including password recovery', async () => {
  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));

  act(() => mockListener!('SIGNED_IN', { user: { id: 'u2' } }));
  expect(result.current.user!.id).toBe('u2');
  expect(result.current.recovering).toBe(false);

  act(() => mockListener!('PASSWORD_RECOVERY', { user: { id: 'u2' } }));
  expect(result.current.recovering).toBe(true);

  act(() => result.current.clearRecovery());
  expect(result.current.recovering).toBe(false);
});

test('unsubscribes on unmount', async () => {
  const { unmount } = renderHook(() => useAuth(), { wrapper });
  unmount();
  expect(mockUnsubscribe).toHaveBeenCalled();
});

test('signOut resolves true on success and false (with a toast) on failure', async () => {
  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));

  let ok;
  await act(async () => {
    ok = await result.current.signOut();
  });
  expect(ok).toBe(true);

  mockSignOutError = { message: 'network down' };
  await act(async () => {
    ok = await result.current.signOut();
  });
  expect(ok).toBe(false);
  expect(document.body).toHaveTextContent(/network down/);
});
