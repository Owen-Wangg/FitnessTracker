import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoadError from './LoadError';

test('announces the failure and retries on click', () => {
  const onRetry = vi.fn();
  render(<LoadError onRetry={onRetry} />);
  expect(screen.getByRole('alert')).toHaveTextContent(/could not load/i);
  userEvent.click(screen.getByRole('button', { name: /retry/i }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});
