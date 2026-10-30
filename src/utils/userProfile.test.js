import { displayNameFor, avatarUrlFor } from './userProfile';

describe('displayNameFor', () => {
  test('prefers the full name from Google', () => {
    expect(displayNameFor({ email: 'a@b.com', user_metadata: { full_name: 'Ada Lovelace' } })).toBe('Ada Lovelace');
  });

  test('falls back to the email prefix', () => {
    expect(displayNameFor({ email: 'ada.l@example.com' })).toBe('ada.l');
  });

  test('falls back to a generic name', () => {
    expect(displayNameFor(null)).toBe('Athlete');
    expect(displayNameFor({})).toBe('Athlete');
  });
});

describe('avatarUrlFor', () => {
  test('reads avatar_url or picture', () => {
    expect(avatarUrlFor({ user_metadata: { avatar_url: 'a.png' } })).toBe('a.png');
    expect(avatarUrlFor({ user_metadata: { picture: 'p.png' } })).toBe('p.png');
  });

  test('returns null when there is none', () => {
    expect(avatarUrlFor({ email: 'a@b.com' })).toBeNull();
    expect(avatarUrlFor(undefined)).toBeNull();
  });
});
