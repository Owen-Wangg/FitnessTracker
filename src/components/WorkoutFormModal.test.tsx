import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkoutFormModal from './WorkoutFormModal';
import type { Workout } from '../types';

// Typing into several fields is slow when the whole suite runs in parallel.
vi.setConfig({ testTimeout: 20000 });

const setup = (props: Partial<ComponentProps<typeof WorkoutFormModal>> = {}) => {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(true);
  const onClose = props.onClose ?? vi.fn();
  render(<WorkoutFormModal onClose={onClose} {...props} onSubmit={onSubmit} />);
  return { onSubmit, onClose };
};

const pickExercise = (name: string) => {
  userEvent.click(screen.getByRole('button', { name: /choose an exercise|change$/i }));
  const dialog = screen.getByRole('dialog', { name: /choose an exercise/i });
  userEvent.click(within(dialog).getByRole('button', { name: new RegExp(`^${name}$`, 'i') }));
};

describe('last time', () => {
  const history: Workout[] = [
    {
      id: 'old',
      date: '2025-06-01',
      name: 'Leg Press Machine',
      exerciseId: 'Leg_Press',
      sets: [{ weight: 225, reps: 5 }, { weight: 245, reps: 3 }],
    },
  ];

  test('shows the previous session once the exercise is picked', () => {
    setup({ history });
    expect(screen.queryByText(/last time/i)).not.toBeInTheDocument();
    pickExercise('Leg Press Machine');
    expect(screen.getByText('Last time')).toBeInTheDocument();
    expect(screen.getByText(/days ago · Jun 1/)).toBeInTheDocument();
    expect(screen.getByText('1 × 5 @ 225 lbs')).toBeInTheDocument();
    expect(screen.getByText('1 × 3 @ 245 lbs')).toBeInTheDocument();
  });

  test('"Use these sets" fills the form, and only when asked', () => {
    setup({ history });
    pickExercise('Leg Press Machine');
    expect(screen.getByLabelText(/set 1 weight/i)).toHaveValue(null); // nothing is pre-filled

    userEvent.click(screen.getByRole('button', { name: /use these sets/i }));
    expect(screen.getByLabelText(/set 1 weight/i)).toHaveValue(225);
    expect(screen.getByLabelText(/set 1 reps/i)).toHaveValue(5);
    expect(screen.getByLabelText(/set 2 weight/i)).toHaveValue(245);
    expect(screen.getByLabelText(/set 2 reps/i)).toHaveValue(3);
    // once the form matches there is nothing left to apply
    expect(screen.queryByRole('button', { name: /use these sets/i })).not.toBeInTheDocument();
  });

  test('copies the numbers but not set tags like "failure", which describe that earlier session', async () => {
    const tagged: Workout[] = [
      {
        id: 'old',
        date: '2025-06-01',
        name: 'Leg Press Machine',
        exerciseId: 'Leg_Press',
        sets: [{ weight: 225, reps: 5 }, { weight: 245, reps: 3, set_type: 'failure' }],
      },
    ];
    const { onSubmit } = setup({ history: tagged });
    pickExercise('Leg Press Machine');
    userEvent.click(screen.getByRole('button', { name: /use these sets/i }));
    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ sets: [{ weight: 225, reps: 5 }, { weight: 245, reps: 3 }] }));
    await screen.findByRole('button', { name: 'Save' });
  });

  test('the button comes back if you change a set afterwards', () => {
    setup({ history });
    pickExercise('Leg Press Machine');
    userEvent.click(screen.getByRole('button', { name: /use these sets/i }));
    userEvent.clear(screen.getByLabelText(/set 1 weight/i));
    userEvent.type(screen.getByLabelText(/set 1 weight/i), '230');
    expect(screen.getByRole('button', { name: /use these sets/i })).toBeInTheDocument();
  });

  test('says nothing for an exercise with no history', () => {
    setup({ history });
    pickExercise('Lat Pulldown Machine');
    expect(screen.queryByText(/last time/i)).not.toBeInTheDocument();
  });
});

describe('adding', () => {
  test('shows an inline error and does not save without an exercise', () => {
    const { onSubmit } = setup();
    userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/choose an exercise/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('names the incomplete set', () => {
    const { onSubmit } = setup();
    pickExercise('Leg Press Machine');
    userEvent.type(screen.getByLabelText(/set 1 weight/i), '225');
    userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/set 1/);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('saves a picked exercise with its sets', async () => {
    const { onSubmit } = setup();
    expect(screen.getByRole('heading', { name: 'Add Exercise' })).toBeInTheDocument();
    pickExercise('Leg Press Machine');
    userEvent.type(screen.getByLabelText(/set 1 weight/i), '225');
    userEvent.type(screen.getByLabelText(/set 1 reps/i), '5');
    userEvent.click(screen.getByRole('button', { name: /add set/i }));
    // the new set starts as a copy of the previous one
    expect(screen.getByLabelText(/set 2 weight/i)).toHaveValue(225);
    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Leg Press Machine',
        exerciseId: 'Leg_Press',
        sets: [{ weight: 225, reps: 5 }, { weight: 225, reps: 5 }],
      })
    );
    await screen.findByRole('button', { name: 'Save' }); // let the async save settle
  });

  test('a custom exercise can be added from the search box', async () => {
    const { onSubmit } = setup();
    userEvent.click(screen.getByRole('button', { name: /choose an exercise/i }));
    userEvent.type(screen.getByLabelText(/search exercises/i), 'Sled Push');
    userEvent.click(screen.getByRole('button', { name: /use .*sled push.* as a custom exercise/i }));
    userEvent.type(screen.getByLabelText(/set 1 weight/i), '90');
    userEvent.type(screen.getByLabelText(/set 1 reps/i), '4');
    userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sled Push', exerciseId: null }));
    await screen.findByRole('button', { name: 'Save' });
  });

  test('Cancel calls onClose', () => {
    const { onClose } = setup();
    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('editing', () => {
  const workout: Workout = {
    id: 'ex-1',
    date: '2025-06-01',
    name: 'Leg Press Machine',
    exerciseId: 'Leg_Press',
    sets: [
      { id: 's1', set_number: 1, weight: 95, reps: 10, set_type: 'warmup' },
      { id: 's2', set_number: 2, weight: 225, reps: 5, set_type: 'normal' },
    ],
  };

  test('opens prefilled with the saved values', () => {
    setup({ initial: workout });
    expect(screen.getByRole('heading', { name: 'Edit Exercise' })).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toHaveValue('2025-06-01');
    expect(screen.getByText('Leg Press Machine')).toBeInTheDocument();
    expect(screen.getByLabelText(/set 1 weight/i)).toHaveValue(95);
    expect(screen.getByLabelText(/set 2 weight/i)).toHaveValue(225);
    expect(screen.getByLabelText(/set 2 reps/i)).toHaveValue(5);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  test('saving without changes resubmits the same values, keeping the warm-up tag', async () => {
    const { onSubmit } = setup({ initial: workout });
    userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Leg Press Machine',
      exerciseId: 'Leg_Press',
      date: '2025-06-01',
      sets: [{ weight: 95, reps: 10, set_type: 'warmup' }, { weight: 225, reps: 5 }],
    });
    await screen.findByRole('button', { name: 'Save changes' });
  });

  test('changed weight, date, an added set and a different exercise are all submitted', async () => {
    const { onSubmit } = setup({ initial: workout });
    userEvent.clear(screen.getByLabelText('Date'));
    userEvent.type(screen.getByLabelText('Date'), '2025-06-02');
    userEvent.clear(screen.getByLabelText(/set 2 weight/i));
    userEvent.type(screen.getByLabelText(/set 2 weight/i), '235');
    userEvent.click(screen.getByRole('button', { name: /add set/i }));
    pickExercise('Leg Extension Machine');
    userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Leg Extension Machine',
      exerciseId: 'Leg_Extensions',
      date: '2025-06-02',
      sets: [
        { weight: 95, reps: 10, set_type: 'warmup' },
        { weight: 235, reps: 5 },
        { weight: 235, reps: 5 }, // the added set copies the previous numbers, not its warm-up tag
      ],
    });
    await screen.findByRole('button', { name: 'Save changes' });
  });

  test('an older entry with a custom name opens as a custom exercise', () => {
    setup({ initial: { ...workout, name: 'Sled Push', exerciseId: null } });
    expect(screen.getByText('Sled Push')).toBeInTheDocument();
    expect(screen.getByText('Custom exercise')).toBeInTheDocument();
  });

  test('stays open and shows the error text when a set becomes invalid', () => {
    const { onSubmit } = setup({ initial: workout });
    userEvent.clear(screen.getByLabelText(/set 2 reps/i));
    userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/set 2/);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('editing keeps set tags', () => {
  test('a drop set stays a drop set when the entry is saved again', async () => {
    const workout: Workout = {
      id: 'w9',
      date: '2025-06-01',
      name: 'Leg Press Machine',
      exerciseId: 'Leg_Press',
      sets: [{ id: 's1', set_number: 1, weight: 225, reps: 5 }, { id: 's2', set_number: 2, weight: 185, reps: 8, set_type: 'drop' }],
    };
    const { onSubmit } = setup({ initial: workout });
    userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ sets: [{ weight: 225, reps: 5 }, { weight: 185, reps: 8, set_type: 'drop' }] })
    );
    await screen.findByRole('button', { name: /save changes/i });
  });
});
