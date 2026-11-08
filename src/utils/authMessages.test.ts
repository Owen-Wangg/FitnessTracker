import { MIN_PASSWORD_LENGTH, friendlyError } from './authMessages';

describe('friendlyError', () => {
  test('turns known Supabase messages into plain words', () => {
    expect(friendlyError({ message: 'Invalid login credentials' })).toBe('Incorrect email or password.');
    expect(friendlyError({ message: 'Email not confirmed' })).toBe('Please confirm your email first. Check your inbox for the link.');
    expect(friendlyError({ message: 'Email rate limit exceeded' })).toBe('Too many attempts. Please wait a minute and try again.');
    expect(friendlyError({ message: 'Too many requests' })).toBe('Too many attempts. Please wait a minute and try again.');
  });

  test('matches regardless of capitalisation', () => {
    expect(friendlyError({ message: 'INVALID LOGIN CREDENTIALS' })).toBe('Incorrect email or password.');
  });

  test('shows any other message as it was written', () => {
    expect(friendlyError(new Error('Signups not allowed'))).toBe('Signups not allowed');
  });

  test('falls back to a generic hint when there is no message', () => {
    expect(friendlyError(null)).toBe('Something went wrong. Please try again.');
    expect(friendlyError(undefined)).toBe('Something went wrong. Please try again.');
    expect(friendlyError({})).toBe('Something went wrong. Please try again.');
    expect(friendlyError('plain string')).toBe('Something went wrong. Please try again.');
  });
});

test('passwords must be at least 8 characters', () => {
  expect(MIN_PASSWORD_LENGTH).toBe(8);
});
