import { useCallback, useEffect, useState } from 'react';
import type { ResolvedTheme, ThemePreference } from '../types';
import { THEME_COLORS, readPreference, resolveTheme, savePreference } from '../utils/theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const systemPrefersDark = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;

// Applies the chosen theme to the page (data-theme on <html>) and remembers the choice.
//   preference: 'system' | 'light' | 'dark'      resolved: 'light' | 'dark' (what is actually shown)
export interface UseThemeResult {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
}

export const useTheme = (): UseThemeResult => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readPreference(window.localStorage));
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // Follow the device setting while the preference is 'system'.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const resolved = resolveTheme(preference, systemDark);

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved]);
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    savePreference(window.localStorage, next);
    setPreferenceState(next);
  }, []);

  return { preference, resolved, setPreference };
};
