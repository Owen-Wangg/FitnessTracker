import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import '../assets/styles/Toast.css';

export type ToastType = 'info' | 'error' | 'success';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  action?: ToastAction | null;
}

export interface ToastApi {
  show: (message: string, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  action: ToastAction | null;
}

const ToastContext = createContext<ToastApi | null>(null);

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

let nextId = 1;

// show(message, { type: 'info' | 'error' | 'success', duration, action: { label, onClick } })
// Returns the toast id; dismiss(id) removes it early. Pass duration 0 to keep it until dismissed.
export const ToastProvider = ({ children }: { children?: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, { type = 'info', duration = 4000, action = null }: ToastOptions = {}) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type, action }]);
      if (duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), duration));
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((timer) => clearTimeout(timer));
  }, []);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
            <span className="toast-message">{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
