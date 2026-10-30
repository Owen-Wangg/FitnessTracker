import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddWorkoutModal from './AddWorkoutModal';

// Typing into several fields is slow when the whole suite runs in parallel.
vi.setConfig({ testTimeout: 20000 });

const setup = (onAddWorkout = vi.fn().mockResolvedValue(true)) => {
  render(<AddWorkoutModal show onClose={() => {}} onAddWorkout={onAddWorkout} />);
  return onAddWorkout;
};

const pickExercise = (name) => {
  userEvent.click(screen.getByRole('button', { name: /choose an exercise/i }));
  const dialog = screen.getByRole('dialog', { name: /choose an exercise/i });
  userEvent.click(within(dialog).getByRole('button', { name: new RegExp(`^${name}$`, 'i') }));
};

test('shows an inline error and does not save without an exercise', () => {
  const onAdd = setup();
  userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByRole('alert')).toHaveTextContent(/choose an exercise/i);
  expect(onAdd).not.toHaveBeenCalled();
});

test('names the incomplete set', () => {
  const onAdd = setup();
  pickExercise('Squat');
  userEvent.type(screen.getByLabelText(/set 1 weight/i), '225');
  userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByRole('alert')).toHaveTextContent(/set 1/);
  expect(onAdd).not.toHaveBeenCalled();
});

test('saves a picked exercise with its sets', async () => {
  const onAdd = setup();
  pickExercise('Squat');
  userEvent.type(screen.getByLabelText(/set 1 weight/i), '225');
  userEvent.type(screen.getByLabelText(/set 1 reps/i), '5');
  userEvent.click(screen.getByRole('button', { name: /add set/i }));
  // the new set starts as a copy of the previous one
  expect(screen.getByLabelText(/set 2 weight/i)).toHaveValue(225);
  userEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(onAdd).toHaveBeenCalledTimes(1);
  expect(onAdd).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'Squat',
      exerciseId: 'Barbell_Squat',
      sets: [{ weight: 225, reps: 5 }, { weight: 225, reps: 5 }],
    })
  );
  expect(await screen.findByRole('button', { name: /choose an exercise/i })).toBeInTheDocument(); // form reset
});

test('a custom exercise can be added from the search box', async () => {
  const onAdd = setup();
  userEvent.click(screen.getByRole('button', { name: /choose an exercise/i }));
  userEvent.type(screen.getByLabelText(/search exercises/i), 'Sled Push');
  userEvent.click(screen.getByRole('button', { name: /use .*sled push.* as a custom exercise/i }));
  userEvent.type(screen.getByLabelText(/set 1 weight/i), '90');
  userEvent.type(screen.getByLabelText(/set 1 reps/i), '4');
  userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sled Push', exerciseId: null }));
  await screen.findByRole('button', { name: /choose an exercise/i }); // let the async save settle
});

test('does not render when hidden', () => {
  const { container } = render(<AddWorkoutModal show={false} onClose={() => {}} onAddWorkout={() => {}} />);
  expect(container).toBeEmptyDOMElement();
});
