import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkoutItem from './WorkoutItem';

const workout = {
  id: 'w1',
  date: '2025-06-01',
  name: 'Squat',
  exerciseId: 'Barbell_Squat',
  sets: [
    { id: 's1', set_number: 1, weight: 135, reps: 8 },
    { id: 's2', set_number: 2, weight: 185, reps: 5 },
  ],
};

test('lists each set and the total volume', () => {
  render(<WorkoutItem workout={workout} />);
  expect(screen.getByRole('heading', { name: 'Squat' })).toBeInTheDocument();
  expect(screen.getByText('135 lbs')).toBeInTheDocument();
  expect(screen.getByText('185 lbs')).toBeInTheDocument();
  expect(screen.getByText('2,005 lbs total')).toBeInTheDocument(); // 135x8 + 185x5
});

test('the edit button passes the whole workout to onEdit', () => {
  const onEdit = vi.fn();
  render(<WorkoutItem workout={workout} onEdit={onEdit} onDelete={() => {}} />);
  userEvent.click(screen.getByRole('button', { name: 'Edit Squat' }));
  expect(onEdit).toHaveBeenCalledWith(workout);
});

test('the delete button passes the id to onDelete', () => {
  const onDelete = vi.fn();
  render(<WorkoutItem workout={workout} onDelete={onDelete} />);
  userEvent.click(screen.getByRole('button', { name: 'Delete Squat' }));
  expect(onDelete).toHaveBeenCalledWith('w1');
});

test('shows no action buttons when no handlers are given', () => {
  render(<WorkoutItem workout={workout} />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

test('only shows the buttons that have a handler', () => {
  render(<WorkoutItem workout={workout} onEdit={() => {}} />);
  expect(screen.getByRole('button', { name: 'Edit Squat' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Delete Squat' })).not.toBeInTheDocument();
});
