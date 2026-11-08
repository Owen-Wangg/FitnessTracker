import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDialog } from './useDialog';

const Dialog = ({ onClose }: { onClose: () => void }) => {
  const dialog = useDialog(onClose);
  return (
    <div ref={dialog.ref} role="dialog" aria-label="Test dialog" tabIndex={-1} onKeyDown={dialog.onKeyDown}>
      <button>First</button>
      <input aria-label="Middle" data-autofocus />
      <button disabled>Disabled</button>
      <button>Last</button>
    </div>
  );
};

// A page with a button that opens the dialog, like the real app.
const Page = ({ onClose = () => {} }: { onClose?: () => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <button>Behind</button>
      {open && (
        <Dialog
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        />
      )}
    </>
  );
};

const open = (onClose?: () => void) => {
  render(<Page onClose={onClose} />);
  const opener = screen.getByRole('button', { name: 'Open' });
  opener.focus();
  userEvent.click(opener);
  return opener;
};

test('moves focus into the dialog, to the element marked data-autofocus', () => {
  open();
  expect(screen.getByLabelText('Middle')).toHaveFocus();
});

test('Escape closes the dialog and gives focus back to what opened it', () => {
  const onClose = vi.fn();
  const opener = open(onClose);
  userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
});

test('Tab from the last control wraps to the first, skipping disabled ones', () => {
  open();
  screen.getByRole('button', { name: 'Last' }).focus();
  userEvent.tab();
  expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
});

test('Shift+Tab from the first control wraps to the last', () => {
  open();
  screen.getByRole('button', { name: 'First' }).focus();
  userEvent.tab({ shift: true });
  expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
});

test('Tab in the middle moves normally and never reaches the page behind', () => {
  open();
  screen.getByLabelText('Middle').focus();
  userEvent.tab();
  expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  userEvent.tab();
  userEvent.tab();
  userEvent.tab();
  expect(screen.getByRole('button', { name: 'Behind' })).not.toHaveFocus();
  expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
});

test('other keys are left alone', () => {
  const onClose = vi.fn();
  open(onClose);
  userEvent.keyboard('abc{Enter}');
  expect(onClose).not.toHaveBeenCalled();
});
