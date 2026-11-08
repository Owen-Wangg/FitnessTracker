// Wording and rules shared by the login screens.

export const MIN_PASSWORD_LENGTH = 8;

// Supabase's error text turned into something a person would say. Anything unrecognised is shown as
// Supabase wrote it, and a missing message becomes a generic retry hint.
export const friendlyError = (error: unknown): string => {
  const message = (error as { message?: string } | null)?.message || 'Something went wrong. Please try again.';
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first. Check your inbox for the link.';
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Please wait a minute and try again.';
  return message;
};
