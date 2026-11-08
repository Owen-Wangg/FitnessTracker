import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './components/ToastProvider';

// The real client needs env vars and a network; stub just what App uses.
// Plain functions (not vi.fn) because mockReset clears mock implementations between tests.
let mockSession: unknown = null;
vi.mock('./utils/supabaseClient', async () => {
  const { queryResult } = await import('./testUtils/queryMock');
  const { formatLocalDate } = await import('./utils/workoutMetrics');
  const today = formatLocalDate(new Date());
  const sets = (weight: number) => [{ id: 's1', set_number: 1, weight, reps: 5, set_type: 'normal' }];
  const squat = (weight: number) => ({ id: 'ex-1', date: today, name: 'Squat', exercise_id: 'Barbell_Squat', workout_sets: sets(weight) });
  return {
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: mockSession } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: null }),
      },
      // one saved workout today; everything else is empty
      from: (table: string) => queryResult({ data: table === 'workout_exercises' ? [squat(135)] : [], error: null }),
      // editing saves through the database function, which returns the updated entry
      rpc: () => Promise.resolve({ data: squat(205), error: null }),
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

describe('editing a saved exercise', () => {
  beforeEach(() => {
    mockSession = { user: { id: 'u1', email: 'ada@example.com' } };
  });

  test('Edit opens the form with the saved values, and saving updates the list', async () => {
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Squat' })).toBeInTheDocument();
    expect(screen.getByText('135 lbs')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Edit Squat' }));
    expect(screen.getByRole('heading', { name: 'Edit Exercise' })).toBeInTheDocument();
    expect(screen.getByLabelText(/set 1 weight/i)).toHaveValue(135);

    userEvent.clear(screen.getByLabelText(/set 1 weight/i));
    userEvent.type(screen.getByLabelText(/set 1 weight/i), '205');
    userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    // the list shows the new weight and the form closes
    expect(await screen.findByText('205 lbs')).toBeInTheDocument();
    expect(screen.queryByText('135 lbs')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Edit Exercise' })).not.toBeInTheDocument();
  });

  test('Cancel closes the form without changing anything', async () => {
    renderApp('/');
    await screen.findByRole('heading', { name: 'Squat' });
    userEvent.click(screen.getByRole('button', { name: 'Edit Squat' }));
    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('heading', { name: 'Edit Exercise' })).not.toBeInTheDocument();
    expect(screen.getByText('135 lbs')).toBeInTheDocument();
  });

  test('Add opens an empty form', async () => {
    renderApp('/');
    await screen.findByRole('heading', { name: 'Squat' });
    userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(screen.getByRole('heading', { name: 'Add Exercise' })).toBeInTheDocument();
    expect(screen.getByLabelText(/set 1 weight/i)).toHaveValue(null);
  });
});

describe('adding from the history screen', () => {
  beforeEach(() => {
    mockSession = { user: { id: 'u1', email: 'ada@example.com' } };
  });

  test('the form opens on the day picked in the calendar', async () => {
    const { container } = renderApp('/history');
    await screen.findByRole('heading', { name: 'Workout History' }, SLOW);

    const now = new Date();
    const day = now.getDate() === 1 ? 2 : 1;
    const dayButton = [...container.querySelectorAll('.rdp-day:not(.rdp-outside) .rdp-day_button')].find((b) => b.textContent === String(day))!;
    userEvent.click(dayButton);
    userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(screen.getByRole('heading', { name: 'Add Exercise' })).toBeInTheDocument();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    expect(screen.getByLabelText('Date')).toHaveValue(expected);
  });
});
