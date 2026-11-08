import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Auth from './Auth';

// Every auth call the screen can make. Reset by vitest between tests, so they are given answers below.
const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOAuth: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  resend: vi.fn(),
}));
vi.mock('../utils/supabaseClient', () => ({ supabase: { auth } }));

vi.setConfig({ testTimeout: 20000 });

beforeEach(() => {
  Object.values(auth).forEach((fn) => fn.mockResolvedValue({ data: { user: null, session: null }, error: null }));
});

const fill = (label: string | RegExp, value: string) => userEvent.type(screen.getByLabelText(label), value);
// The tab has role "tab", so the only *button* called "Log In" is the submit button.
const logInButton = () => screen.getByRole('button', { name: 'Log In' });
const createAccountButton = () => screen.getByRole('button', { name: 'Create Account' });

describe('logging in', () => {
  test('starts on the login tab with the sign-up tab available', () => {
    render(<Auth />);
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Log In' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Sign Up' })).toHaveAttribute('aria-selected', 'false');
  });

  test('signs in with the trimmed email and the password', () => {
    render(<Auth />);
    fill('Email', '  ada@example.com ');
    fill(/^password$/i, 'correct horse');
    userEvent.click(logInButton());
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'correct horse' });
  });

  test('says "Please wait..." and locks the tabs while the request is running', async () => {
    let finish: (value: unknown) => void = () => {};
    auth.signInWithPassword.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<Auth />);
    fill('Email', 'ada@example.com');
    fill(/^password$/i, 'correct horse');
    userEvent.click(logInButton());

    expect(await screen.findByRole('button', { name: 'Please wait...' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'Sign Up' })).toBeDisabled();
    finish({ error: null });
    await vi.waitFor(() => expect(logInButton()).toBeEnabled());
    expect(screen.getByRole('tab', { name: 'Sign Up' })).toBeEnabled();
  });

  test('turns wrong-password errors into plain words', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    render(<Auth />);
    fill('Email', 'ada@example.com');
    fill(/^password$/i, 'wrong password');
    userEvent.click(logInButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.');
  });

  test('turns rate-limit errors into plain words', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { message: 'Email rate limit exceeded' } });
    render(<Auth />);
    fill('Email', 'ada@example.com');
    fill(/^password$/i, 'whatever123');
    userEvent.click(logInButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts. Please wait a minute and try again.');
  });

  test('an unconfirmed email offers to resend the confirmation', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { message: 'Email not confirmed' } });
    render(<Auth />);
    fill('Email', 'ada@example.com');
    fill(/^password$/i, 'correct horse');
    userEvent.click(logInButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('Please confirm your email first.');

    userEvent.click(screen.getByRole('button', { name: 'Resend confirmation email' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Email sent again.');
    expect(auth.resend).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'signup', email: 'ada@example.com' })
    );
  });

  test('the Google button starts the Google sign-in and returns to this site', () => {
    render(<Auth />);
    userEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: window.location.origin } });
  });

  test('the eye button shows and hides the password', () => {
    render(<Auth />);
    const field = screen.getByLabelText(/^password$/i);
    expect(field).toHaveAttribute('type', 'password');
    userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(field).toHaveAttribute('type', 'text');
    userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(field).toHaveAttribute('type', 'password');
  });
});

describe('signing up', () => {
  const openSignUp = () => {
    render(<Auth />);
    userEvent.click(screen.getByRole('tab', { name: 'Sign Up' }));
  };

  test('shows the sign-up form with the password rule', () => {
    openSignUp();
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters.')).toBeInTheDocument();
    expect(createAccountButton()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Forgot password?' })).not.toBeInTheDocument();
  });

  test('switching tabs clears what you typed and any error', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    render(<Auth />);
    fill('Email', 'ada@example.com');
    fill(/^password$/i, 'wrong password');
    userEvent.click(logInButton());
    await screen.findByRole('alert');

    userEvent.click(screen.getByRole('tab', { name: 'Sign Up' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toHaveValue('');
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com'); // the email is kept
  });

  test('a password under 8 characters is not sent', () => {
    openSignUp();
    fill('Email', 'ada@example.com');
    fill(/^password$/i, 'short');
    userEvent.click(createAccountButton());
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  test('on success it asks you to check your email, and Back returns to login', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [{ id: 'x' }] }, session: null }, error: null });
    openSignUp();
    fill('Email', ' ada@example.com ');
    fill(/^password$/i, 'long enough password');
    userEvent.click(createAccountButton());

    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'long enough password',
      options: { emailRedirectTo: window.location.origin },
    });
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Click it to activate your account/)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Back to log in' }));
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  test('the confirmation screen can resend the email', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [{ id: 'x' }] }, session: null }, error: null });
    openSignUp();
    fill('Email', 'ada@example.com');
    fill(/^password$/i, 'long enough password');
    userEvent.click(createAccountButton());
    await screen.findByRole('heading', { name: 'Check your email' });

    userEvent.click(screen.getByRole('button', { name: 'Did not get it? Resend' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Email sent again.');
  });

  test('an email that already has an account says so', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [] }, session: null }, error: null });
    openSignUp();
    fill('Email', 'ada@example.com');
    fill(/^password$/i, 'long enough password');
    userEvent.click(createAccountButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('An account with this email already exists.');
    expect(screen.queryByRole('heading', { name: 'Check your email' })).not.toBeInTheDocument();
  });

  test('with email confirmation off there is already a session, so no "check your email" screen', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [{ id: 'x' }] }, session: { access_token: 't' } }, error: null });
    openSignUp();
    fill('Email', 'ada@example.com');
    fill(/^password$/i, 'long enough password');
    userEvent.click(createAccountButton());
    await vi.waitFor(() => expect(auth.signUp).toHaveBeenCalled());
    expect(screen.queryByRole('heading', { name: 'Check your email' })).not.toBeInTheDocument();
  });

  test('shows a server error from sign-up', async () => {
    auth.signUp.mockResolvedValue({ data: {}, error: { message: 'Signups not allowed' } });
    openSignUp();
    fill('Email', 'ada@example.com');
    fill(/^password$/i, 'long enough password');
    userEvent.click(createAccountButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('Signups not allowed');
  });
});

describe('forgotten password', () => {
  test('sends a reset link and says the same thing whether or not the account exists', async () => {
    render(<Auth />);
    userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument();

    fill('Email', ' ada@example.com ');
    userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('ada@example.com', { redirectTo: window.location.origin });
    expect(screen.getByText(/a reset link is on its way/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resend/i })).not.toBeInTheDocument(); // only for confirmation emails
  });

  test('Back to log in returns to the login form', () => {
    render(<Auth />);
    userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    userEvent.click(screen.getByRole('button', { name: 'Back to log in' }));
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  test('shows an error from the reset request', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: { message: 'Email rate limit exceeded' } });
    render(<Auth />);
    userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    fill('Email', 'ada@example.com');
    userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts.');
  });
});

describe('choosing a new password after a reset email', () => {
  test('opens straight on the new password form', () => {
    render(<Auth recoveryMode />);
    expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByText('At least 8 characters.')).toBeInTheDocument();
  });

  test('saves the new password and tells the app', async () => {
    const onPasswordUpdated = vi.fn();
    render(<Auth recoveryMode onPasswordUpdated={onPasswordUpdated} />);
    fill('New password', 'a brand new password');
    userEvent.click(screen.getByRole('button', { name: 'Update password' }));
    await vi.waitFor(() => expect(onPasswordUpdated).toHaveBeenCalledTimes(1));
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'a brand new password' });
  });

  test('shows an error instead of continuing when it fails', async () => {
    auth.updateUser.mockResolvedValue({ error: { message: 'New password should be different' } });
    const onPasswordUpdated = vi.fn();
    render(<Auth recoveryMode onPasswordUpdated={onPasswordUpdated} />);
    fill('New password', 'a brand new password');
    userEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('New password should be different');
    expect(onPasswordUpdated).not.toHaveBeenCalled();
  });
});
