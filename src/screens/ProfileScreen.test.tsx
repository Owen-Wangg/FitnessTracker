import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileScreen from './ProfileScreen';

const noop = { onLogBodyWeight: async () => true, onDeleteBodyWeight: () => {} };

// jsdom has no layout, so give the chart a fixed size.
vi.mock('recharts', async (importOriginal) => (await import('../testUtils/rechartsMock')).withFixedSize(importOriginal));

test('shows the Google name and photo when available', () => {
  const user = { email: 'ada@example.com', user_metadata: { full_name: 'Ada Lovelace', avatar_url: 'https://x.test/a.png' } };
  const { container } = render(<ProfileScreen user={user} {...noop} />);
  expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
  expect(container.querySelector('.profile-picture-placeholder img')).toHaveAttribute('src', 'https://x.test/a.png');
});

test('falls back to the email prefix and an initial', () => {
  render(<ProfileScreen user={{ email: 'ada@example.com' }} {...noop} />);
  expect(screen.getByRole('heading', { name: 'ada' })).toBeInTheDocument();
  expect(screen.getByText('A')).toBeInTheDocument();
});

test('shows the latest body weight and lifetime volume', () => {
  const bodyWeights = [
    { id: '1', date: '2025-06-01', weight: 180 },
    { id: '2', date: '2025-06-08', weight: 178.5 },
  ];
  render(
    <ProfileScreen
      user={{ email: 'a@b.com' }}
      bodyWeights={bodyWeights}
      lifetimeStats={{ totalWeightLifted: 12345 }}
      {...noop}
    />
  );
  expect(screen.getAllByText('178.5 lbs').length).toBeGreaterThan(0);
  expect(screen.getByText('12,345 lbs')).toBeInTheDocument();
  expect(screen.getByTestId('chart')).toBeInTheDocument();
});

test('shows the theme selector and reports changes', () => {
  const onThemeChange = vi.fn();
  render(<ProfileScreen user={{ email: 'a@b.com' }} themePreference="light" onThemeChange={onThemeChange} {...noop} />);
  expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
  userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
  expect(onThemeChange).toHaveBeenCalledWith('dark');
});

test('hides the theme selector when no handler is given', () => {
  render(<ProfileScreen user={{ email: 'a@b.com' }} {...noop} />);
  expect(screen.queryByRole('radiogroup', { name: 'Theme' })).not.toBeInTheDocument();
});
