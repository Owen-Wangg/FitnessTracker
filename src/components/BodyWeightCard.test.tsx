import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BodyWeightCard from './BodyWeightCard';

vi.mock('recharts', async (importOriginal) => (await import('../testUtils/rechartsMock')).withFixedSize(importOriginal));

const entries = [
  { id: 'b1', date: '2025-06-01', weight: 180 },
  { id: 'b2', date: '2025-06-08', weight: 178.5 },
];

test('shows current weight, change since the first entry and the entry count', () => {
  render(<BodyWeightCard entries={entries} onLog={async () => true} onDelete={() => {}} />);
  const stat = (label: string) => screen.getByText(label).nextSibling?.textContent;
  expect(stat('Current')).toBe('178.5 lbs');
  expect(stat('Change')).toBe('-1.5 lbs');
  expect(stat('Entries')).toBe('2');
});

test('draws the chart only once there are two entries', () => {
  const { rerender } = render(<BodyWeightCard entries={[entries[0]]} onLog={async () => true} onDelete={() => {}} />);
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  expect(screen.getByText(/log one more day/i)).toBeInTheDocument();
  rerender(<BodyWeightCard entries={entries} onLog={async () => true} onDelete={() => {}} />);
  expect(screen.getByRole('img', { name: /body weight over time/i })).toBeInTheDocument();
});

test('logs a weight for the chosen date and clears the field on success', async () => {
  const onLog = vi.fn().mockResolvedValue(true);
  render(<BodyWeightCard entries={entries} onLog={onLog} onDelete={() => {}} />);
  userEvent.clear(screen.getByLabelText('Date'));
  userEvent.type(screen.getByLabelText('Date'), '2025-06-09');
  userEvent.type(screen.getByLabelText(/weight \(lbs\)/i), '177.4');
  userEvent.click(screen.getByRole('button', { name: 'Log' }));

  expect(onLog).toHaveBeenCalledWith({ date: '2025-06-09', weight: 177.4 });
  expect(await screen.findByLabelText(/weight \(lbs\)/i)).toHaveValue(null);
});

test('deleting an entry calls onDelete with its id', () => {
  const onDelete = vi.fn();
  render(<BodyWeightCard entries={entries} onLog={async () => true} onDelete={onDelete} />);
  userEvent.click(screen.getAllByRole('button', { name: /delete entry/i })[0]);
  expect(onDelete).toHaveBeenCalledWith('b2'); // most recent first
});

test('shows an empty state with no entries', () => {
  render(<BodyWeightCard entries={[]} onLog={async () => true} onDelete={() => {}} />);
  expect(screen.getByText(/no entries yet/i)).toBeInTheDocument();
});
