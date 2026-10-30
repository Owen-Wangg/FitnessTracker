import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeSelector from './ThemeSelector';

test('offers system, light and dark, with the current one selected', () => {
  render(<ThemeSelector value="light" onChange={() => {}} />);
  expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'false');
  expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'false');
});

test('reports the chosen option', () => {
  const onChange = vi.fn();
  render(<ThemeSelector value="system" onChange={onChange} />);
  userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
  expect(onChange).toHaveBeenCalledWith('dark');
});

test('defaults to system', () => {
  render(<ThemeSelector onChange={() => {}} />);
  expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true');
});
