import { render, screen } from '@testing-library/react';
import ConfigError from './ConfigError';

test('explains which environment variables are missing', () => {
  render(<ConfigError />);
  expect(screen.getByRole('heading', { name: /setup needed/i })).toBeInTheDocument();
  expect(screen.getByText(/VITE_SUPABASE_URL/)).toBeInTheDocument();
  expect(screen.getByText(/VITE_SUPABASE_ANON_KEY/)).toBeInTheDocument();
});
