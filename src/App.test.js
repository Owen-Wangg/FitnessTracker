import { render, screen } from '@testing-library/react';
import App from './App';

// The real client needs env vars and a network; stub just what App uses.
// Plain functions (not jest.fn) because CRA resets mock implementations between tests.
jest.mock('./utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}));

test('shows the login screen when there is no session', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /log in/i })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: /sign up/i })).toHaveAttribute('aria-selected', 'false');
});
