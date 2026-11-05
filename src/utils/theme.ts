// Light/dark theme helpers. The preference is 'system' (follow the device), 'light' or 'dark'.
// NOTE: index.html has a tiny inline script with the same logic so the right theme is applied
// before the first paint (no flash). Keep the storage key and rules there in sync.
import type { ResolvedTheme, ThemePreference } from '../types';

export const THEME_KEY = 'fitness-theme';
export const PREFERENCES: ThemePreference[] = ['system', 'light', 'dark'];

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'removeItem' | 'setItem'>;

// The theme actually shown: 'light' or 'dark'.
export const resolveTheme = (preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme =>
  preference === 'dark' || (preference !== 'light' && systemPrefersDark) ? 'dark' : 'light';

export const readPreference = (storage: ReadableStorage): ThemePreference => {
  try {
    const saved = storage.getItem(THEME_KEY);
    return PREFERENCES.includes(saved as ThemePreference) ? (saved as ThemePreference) : 'system';
  } catch {
    return 'system'; // storage blocked (private mode, etc.)
  }
};

export const savePreference = (storage: WritableStorage, preference: ThemePreference): void => {
  try {
    if (preference === 'system') storage.removeItem(THEME_KEY);
    else storage.setItem(THEME_KEY, preference);
  } catch {
    // ignore: the theme still applies for this visit
  }
};

// Browser chrome color (address bar on phones) for each theme; matches --bg.
export const THEME_COLORS: Record<ResolvedTheme, string> = { dark: '#0a0c10', light: '#f4f5f7' };
