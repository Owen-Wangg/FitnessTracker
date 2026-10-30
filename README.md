# Fitness Tracker

A free, mobile-and-desktop lifting log. Log exercises set by set, track progress per lift
(top weight, estimated 1RM, volume, PRs), and track body weight.

**Stack:** React (Create React App), Supabase (auth + Postgres), Chart.js. Everything runs on free tiers.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key
   (Supabase dashboard: Project Settings > API).
3. In the Supabase SQL Editor, run these files from `supabase/`, in order:
   - `schema.sql` - workout tables and row-level security
   - `migrate_legacy_workouts.sql` - optional, copies entries from the old single-row `workouts` table
   - `body_weight.sql` - body weight tracking
   - `exercise_library.sql` - links logged exercises to the built-in exercise list
4. Start the app:
   ```
   npm start
   ```

### Optional: Google sign-in

Enable the Google provider under Authentication > Providers in Supabase and add your site URL to
Authentication > URL Configuration. Google needs an OAuth client whose redirect URI is your
Supabase project's `/auth/v1/callback` URL.

## Scripts

- `npm start` - dev server on http://localhost:3000
- `npm test` - run tests
- `npm run build` - production build

## Project layout

- `src/App.js` - app shell, data loading, auth state
- `src/screens/` - Home, History, Profile
- `src/components/` - UI pieces (add-workout form, exercise picker, charts, auth)
- `src/utils/workoutMetrics.js` - volume, top set, estimated 1RM (unit tested)
- `src/data/fundamentals.js` - the built-in exercise list
- `supabase/` - SQL to run in the Supabase dashboard

Exercise photos come from the public-domain [Free Exercise DB](https://github.com/yuhonas/free-exercise-db),
served through the jsDelivr CDN.
