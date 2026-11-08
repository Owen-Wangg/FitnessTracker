import { useEffect, useRef, type KeyboardEvent } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// Keyboard and focus behaviour a modal dialog should have:
//  - focus moves into the dialog when it opens (to the element marked data-autofocus, else the first control)
//  - Tab and Shift+Tab stay inside it instead of wandering onto the page behind
//  - Escape closes it
//  - focus goes back to whatever had it before, when the dialog closes
// Attach `ref` and `onKeyDown` to the dialog element, which should also have tabIndex={-1}. Escape and Tab
// are handled here and not passed up, so a dialog opened on top of another (the exercise picker over the
// form) only affects itself.
export const useDialog = (onClose: () => void) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    if (dialog && !dialog.contains(document.activeElement)) {
      const target = dialog.querySelector<HTMLElement>('[data-autofocus]') ?? dialog.querySelector<HTMLElement>(FOCUSABLE) ?? dialog;
      target.focus();
    }
    return () => {
      if (previous && previous.isConnected) previous.focus();
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    event.stopPropagation();

    const dialog = ref.current;
    if (!dialog) return;
    const controls = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (controls.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return { ref, onKeyDown };
};
