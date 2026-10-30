import { act, renderHook, waitFor } from '@testing-library/react';
import { ToastProvider } from '../components/ToastProvider';
import { useAuth } from './useAuth';

let mockSession = null;
let mockListener = null;
let mockSignOutError = null;
const mockUnsubscribe = jest.fn();

jest.mock('../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: mockSession } }),
      onAuthStateChange: (cb) => {
        mockListener = cb;
        return { data: { subscription: { unsubscribe: () => mockUnsubscribe() } } };
      },
      signOut: () => Promise.resolve({ error: mockSignOutError }),
    },
  },
}));

const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;

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

  act(() => mockListener('SIGNED_IN', { user: { id: 'u2' } }));
  expect(result.current.user.id).toBe('u2');
  expect(result.current.recovering).toBe(false);

  act(() => mockListener('PASSWORD_RECOVERY', { user: { id: 'u2' } }));
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
