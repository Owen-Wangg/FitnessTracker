import { PREFERENCES, THEME_KEY, readPreference, resolveTheme, savePreference } from './theme';

const fakeStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    removeItem: (k) => {
      delete data[k];
    },
    data,
  };
};

describe('resolveTheme', () => {
  test('an explicit choice wins over the device setting', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });

  test('system follows the device setting', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  test('anything unrecognised behaves like system', () => {
    expect(resolveTheme('purple', true)).toBe('dark');
    expect(resolveTheme(undefined, false)).toBe('light');
  });
});

describe('readPreference / savePreference', () => {
  test('defaults to system when nothing is saved or the value is junk', () => {
    expect(readPreference(fakeStorage())).toBe('system');
    expect(readPreference(fakeStorage({ [THEME_KEY]: 'neon' }))).toBe('system');
  });

  test('round-trips light and dark', () => {
    const storage = fakeStorage();
    savePreference(storage, 'dark');
    expect(readPreference(storage)).toBe('dark');
    savePreference(storage, 'light');
    expect(readPreference(storage)).toBe('light');
  });

  test('choosing system clears the saved value', () => {
    const storage = fakeStorage({ [THEME_KEY]: 'dark' });
    savePreference(storage, 'system');
    expect(THEME_KEY in storage.data).toBe(false);
    expect(readPreference(storage)).toBe('system');
  });

  test('blocked storage never throws', () => {
    const blocked = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    expect(readPreference(blocked)).toBe('system');
    expect(() => savePreference(blocked, 'dark')).not.toThrow();
  });

  test('every preference the UI offers is accepted', () => {
    PREFERENCES.forEach((p) => {
      const storage = fakeStorage();
      savePreference(storage, p);
      expect(readPreference(storage)).toBe(p);
    });
  });
});
