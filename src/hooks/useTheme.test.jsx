import { act, renderHook } from '@testing-library/react';
import { THEME_KEY } from '../utils/theme';
import { useTheme } from './useTheme';

// jsdom has no matchMedia; this stand-in lets a test flip the device setting.
const installMatchMedia = (initialDark) => {
  let matches = initialDark;
  const listeners = new Set();
  window.matchMedia = (media) => ({
    media,
    get matches() {
      return matches;
    },
    addEventListener: (_event, fn) => listeners.add(fn),
    removeEventListener: (_event, fn) => listeners.delete(fn),
  });
  return {
    setDark: (value) => {
      matches = value;
      listeners.forEach((fn) => fn({ matches: value }));
    },
    listenerCount: () => listeners.size,
  };
};

const metaColor = () => document.querySelector('meta[name="theme-color"]').getAttribute('content');

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  const meta = document.createElement('meta');
  meta.setAttribute('name', 'theme-color');
  meta.setAttribute('content', '#000000');
  document.head.appendChild(meta);
});

afterEach(() => {
  document.head.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
  delete window.matchMedia;
});

test('follows a dark device by default and applies it to the page', () => {
  installMatchMedia(true);
  const { result } = renderHook(() => useTheme());
  expect(result.current.preference).toBe('system');
  expect(result.current.resolved).toBe('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(metaColor()).toBe('#0a0c10');
});

test('follows a light device by default', () => {
  installMatchMedia(false);
  const { result } = renderHook(() => useTheme());
  expect(result.current.resolved).toBe('light');
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(metaColor()).toBe('#f4f5f7');
});

test('choosing a theme applies it and remembers it', () => {
  installMatchMedia(true);
  const { result } = renderHook(() => useTheme());

  act(() => result.current.setPreference('light'));
  expect(result.current.resolved).toBe('light');
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(window.localStorage.getItem(THEME_KEY)).toBe('light');

  act(() => result.current.setPreference('system'));
  expect(result.current.resolved).toBe('dark'); // back to following the device
  expect(window.localStorage.getItem(THEME_KEY)).toBeNull();
});

test('starts from the saved choice, even against the device setting', () => {
  installMatchMedia(true);
  window.localStorage.setItem(THEME_KEY, 'light');
  const { result } = renderHook(() => useTheme());
  expect(result.current.preference).toBe('light');
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('live-follows the device while on system, but not when a theme is forced', () => {
  const media = installMatchMedia(false);
  const { result } = renderHook(() => useTheme());
  expect(result.current.resolved).toBe('light');

  act(() => media.setDark(true));
  expect(result.current.resolved).toBe('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');

  act(() => result.current.setPreference('light'));
  act(() => media.setDark(false));
  act(() => media.setDark(true));
  expect(result.current.resolved).toBe('light'); // forced, so the device change is ignored
});

test('stops listening to the device setting when unmounted', () => {
  const media = installMatchMedia(false);
  const { unmount } = renderHook(() => useTheme());
  expect(media.listenerCount()).toBe(1);
  unmount();
  expect(media.listenerCount()).toBe(0);
});

test('still works in a browser without matchMedia', () => {
  const { result } = renderHook(() => useTheme());
  expect(result.current.resolved).toBe('light');
  act(() => result.current.setPreference('dark'));
  expect(document.documentElement.dataset.theme).toBe('dark');
});
