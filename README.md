# Fitness Tracker

A free, mobile-and-desktop lifting log. Log exercises set by set, track progress per lift
(top weight, estimated 1RM, volume, PRs), and track body weight.

**Stack:** React, Vite, Vitest, Supabase (auth + Postgres), Chart.js. Everything runs on free tiers.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key
   (Supabase dashboard: Project Settings > API). Restart the dev server after changing `.env`.
3. In the Supabase SQL Editor, run these files from `supabase/`, in order:
   - `schema.sql` - workout tables and row-level security
   - `migrate_legacy_workouts.sql` - optional, copies entries from the old single-row `workouts` table
   - `body_weight.sql` - body weight tracking
   - `exercise_library.sql` - links logged exercises to the built-in exercise list
   - `add_workout_function.sql` - optional, makes saving a workout atomic (the app works without it)
4. Start the app:
   ```
   npm start
   ```

### Optional: Google sign-in

Enable the Google provider under Authentication > Providers in Supabase and add your site URL to
Authentication > URL Configuration. Google needs an OAuth client whose redirect URI is your
Supabase project's `/auth/v1/callback` URL.

## Scripts

- `npm start` (or `npm run dev`) - dev server on http://localhost:3000
- `npm test` - run tests in watch mode (`npx vitest run` for a single run)
- `npm run lint` - ESLint
- `npm run build` - production build into `build/`
- `npm run preview` - serve the production build locally

## Deploying

The app is a single-page app with real URLs (`/`, `/history`, `/profile`). `vercel.json` rewrites every path to
`index.html` so refreshing a deep link works. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the
host's environment variables, and add the deployed URL to Supabase (Authentication > URL Configuration) and, for
Google sign-in, to the OAuth client's authorized JavaScript origins.

## Project layout

- `src/App.js` - app shell and routes
- `src/hooks/` - `useAuth`, `useWorkouts`, `useBodyWeights` (all Supabase access lives here)
- `src/screens/` - Home, History, Profile
- `src/components/` - UI pieces (add-workout form, exercise picker, charts, auth, toasts)
- `src/utils/` - pure logic, unit tested: volume / 1RM (`workoutMetrics`), chart series and PRs (`progress`),
  form validation, exercise lookup
- `src/data/fundamentals.js` - the built-in exercise list
- `supabase/` - SQL to run in the Supabase dashboard

Deleting a workout or weight entry shows an Undo toast; the delete is only sent once the toast expires.

Exercise photos come from the public-domain [Free Exercise DB](https://github.com/yuhonas/free-exercise-db),
served through the jsDelivr CDN.
