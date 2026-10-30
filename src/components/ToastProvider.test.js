import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './ToastProvider';

let api;
const Capture = () => {
  api = useToast();
  return null;
};
const setup = () => render(<ToastProvider><Capture /></ToastProvider>);

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('shows a message and removes it after its duration', () => {
  setup();
  act(() => {
    api.show('Saved', { duration: 3000 });
  });
  expect(screen.getByText('Saved')).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(3001));
  expect(screen.queryByText('Saved')).not.toBeInTheDocument();
});

test('errors are announced as alerts', () => {
  setup();
  act(() => {
    api.show('Could not save', { type: 'error' });
  });
  expect(screen.getByRole('alert')).toHaveTextContent('Could not save');
});

test('an action button runs its handler and dismisses the toast', () => {
  setup();
  const onUndo = jest.fn();
  act(() => {
    api.show('Deleted', { duration: 0, action: { label: 'Undo', onClick: onUndo } });
  });
  // userEvent v13 is synchronous; fake timers need no special handling here.
  userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(onUndo).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Deleted')).not.toBeInTheDocument();
});

test('duration 0 keeps the toast until dismissed', () => {
  setup();
  let id;
  act(() => {
    id = api.show('Sticky', { duration: 0 });
  });
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.getByText('Sticky')).toBeInTheDocument();
  act(() => api.dismiss(id));
  expect(screen.queryByText('Sticky')).not.toBeInTheDocument();
});
