// Light/dark theme helpers. The preference is 'system' (follow the device), 'light' or 'dark'.
// NOTE: index.html has a tiny inline script with the same logic so the right theme is applied
// before the first paint (no flash). Keep the storage key and rules there in sync.
export const THEME_KEY = 'fitness-theme';
export const PREFERENCES = ['system', 'light', 'dark'];

// The theme actually shown: 'light' or 'dark'.
export const resolveTheme = (preference, systemPrefersDark) =>
  preference === 'dark' || (preference !== 'light' && systemPrefersDark) ? 'dark' : 'light';

export const readPreference = (storage) => {
  try {
    const saved = storage.getItem(THEME_KEY);
    return PREFERENCES.includes(saved) ? saved : 'system';
  } catch {
    return 'system'; // storage blocked (private mode, etc.)
  }
};

export const savePreference = (storage, preference) => {
  try {
    if (preference === 'system') storage.removeItem(THEME_KEY);
    else storage.setItem(THEME_KEY, preference);
  } catch {
    // ignore: the theme still applies for this visit
  }
};

// Browser chrome color (address bar on phones) for each theme; matches --bg.
export const THEME_COLORS = { dark: '#0a0c10', light: '#f4f5f7' };
