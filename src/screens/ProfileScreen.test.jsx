import { render, screen } from '@testing-library/react';
import ProfileScreen from './ProfileScreen';

// jsdom has no canvas, so stand in for the chart.
vi.mock('react-chartjs-2', () => ({ Line: () => <div data-testid="chart" /> }));

test('shows the Google name and photo when available', () => {
  const user = { email: 'ada@example.com', user_metadata: { full_name: 'Ada Lovelace', avatar_url: 'https://x.test/a.png' } };
  const { container } = render(<ProfileScreen user={user} />);
  expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
  expect(container.querySelector('.profile-picture-placeholder img')).toHaveAttribute('src', 'https://x.test/a.png');
});

test('falls back to the email prefix and an initial', () => {
  render(<ProfileScreen user={{ email: 'ada@example.com' }} />);
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
      onLogBodyWeight={() => {}}
      onDeleteBodyWeight={() => {}}
    />
  );
  expect(screen.getAllByText('178.5 lbs').length).toBeGreaterThan(0);
  expect(screen.getByText('12,345 lbs')).toBeInTheDocument();
  expect(screen.getByTestId('chart')).toBeInTheDocument();
});
