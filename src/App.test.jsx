import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './components/ToastProvider';

// The real client needs env vars and a network; stub just what App uses.
// Plain functions (not vi.fn) because mockReset clears mock implementations between tests.
let mockSession = null;
vi.mock('./utils/supabaseClient', async () => {
  const { queryResult } = await import('./testUtils/queryMock');
  return {
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: mockSession } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => queryResult({ data: [], error: null }),
    },
  };
});

vi.mock('recharts', async (importOriginal) => (await import('./testUtils/rechartsMock')).withFixedSize(importOriginal));

// History and Profile are lazy-loaded; their first import can be slow when the whole suite runs in parallel.
const SLOW = { timeout: 15000 };
vi.setConfig({ testTimeout: 20000 });

const renderApp = (path = '/') =>
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </ToastProvider>
  );

beforeEach(() => {
  mockSession = null;
});

test('shows the login screen when there is no session', async () => {
  renderApp();
  expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /log in/i })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: /sign up/i })).toHaveAttribute('aria-selected', 'false');
});

describe('signed in', () => {
  beforeEach(() => {
    mockSession = { user: { id: 'u1', email: 'ada@example.com' } };
  });

  test('the home route shows today\'s workouts', async () => {
    renderApp('/');
    expect(await screen.findByRole('heading', { name: /today's workouts/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  test('deep links open the right screen', async () => {
    renderApp('/history');
    expect(await screen.findByRole('heading', { name: /workout history/i }, SLOW)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute('aria-current', 'page');
  });

  test('the nav links change screens', async () => {
    renderApp('/');
    await screen.findByRole('heading', { name: /today's workouts/i });
    userEvent.click(screen.getByRole('link', { name: 'Profile' }));
    expect(await screen.findByRole('heading', { name: /my profile/i }, SLOW)).toBeInTheDocument();
  });

  test('unknown paths redirect home', async () => {
    renderApp('/nope');
    expect(await screen.findByRole('heading', { name: /today's workouts/i })).toBeInTheDocument();
  });
});
