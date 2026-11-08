# Fitness Tracker

A free, mobile-and-desktop lifting log for you and your friends. Log exercises set by set, see what you did
last time, and track your progress, consistency and body weight.

**Stack:** React, TypeScript, Vite, Vitest, Supabase (auth + Postgres), Recharts. Everything runs on free tiers.

## What it does

- **Log** each exercise set by set from a fixed, curated exercise list. The form shows what you did last time
  (with a "Use these sets" button) and works in pounds or kilograms.
- **Bodyweight exercises** (pull-ups, push-ups, dips, back extensions, leg raises) take optional added weight.
  Body weight is counted for strength and progress charts but never in volume totals.
- **Home** shows today's summary, this week (days trained, sets and days since each muscle group, PRs) and the
  month so far compared with the same point last month.
- **History** has a calendar, an Add button for the selected day, and a progress chart per exercise (top weight,
  estimated 1RM, volume, reps, strength relative to body weight) with a trend line and a time range.
- **Profile** has your training totals, weekly streak and average (with an adjustable weekly goal), personal
  records, muscle balance, the weight unit, the theme and a body weight log.

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
   - `add_workout_function.sql` - recommended, makes saving a new workout atomic
   - `update_workout_function.sql` - recommended, makes saving edits atomic

   The app works without the two functions, but then a failure part-way through a save can leave an exercise
   half-saved.
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
- `npm run lint` - type-check (`tsc`) then ESLint; `npm run typecheck` runs just the type check
- `npm run build` - production build into `build/`
- `npm run preview` - serve the production build locally
- `npm run icons` - redraw the exercise thumbnails
- `npm run app-icons` - redraw the app icon

## Deploying

The app is a single-page app with real URLs (`/`, `/history`, `/profile`). `vercel.json` rewrites every path to
`index.html` so refreshing a deep link works. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the
host's environment variables (the older `REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY` names are still
read), and add the deployed URL to Supabase (Authentication > URL Configuration) and, for Google sign-in, to the
OAuth client's authorized JavaScript origins.

## Project layout

- `src/App.tsx` - app shell and routes
- `src/hooks/` - `useAuth`, `useAuthFlow`, `useWorkouts`, `useBodyWeights` (all Supabase access lives here), plus
  `useToday` (a date that rolls over at midnight), `useTheme` and `useDialog` (keyboard and focus for dialogs)
- `src/screens/` - Home, History, Profile
- `src/components/` - UI pieces (exercise form and picker, charts, summary cards, toasts); the login screens are
  `Auth.tsx` plus one small component per step in `authForms/`
- `src/utils/` - pure logic, unit tested: volume and 1RM (`workoutMetrics`), chart series and PRs (`progress`),
  records, streaks (`consistency`), week and month summaries, muscle split, units, formatting, form validation
- `src/data/fundamentals.ts` - the exercise list
- `supabase/` - SQL to run in the Supabase dashboard

## How the numbers work

- Weights are always stored in pounds. The lbs/kg setting only changes what is shown and typed, so switching
  never changes saved data. Editing a workout in kg keeps the exact stored pounds for any weight you don't touch.
- Warm-up sets are left out of every metric.
- For a bodyweight exercise, the weight field means *added* weight (blank = bodyweight only). Strength measures
  and the exercise's own chart use body weight plus added weight, taken from the nearest body weight entry on or
  before that date. Totals and summaries count added weight only.
- A weekly streak is consecutive Monday-to-Sunday weeks with at least your goal of training days; the week in
  progress never breaks it.

## Editing the exercise list

The list is curated, so there is no way to add a custom exercise in the app. To add one, put an entry in
`src/data/fundamentals.ts` (with `loadType: 'bodyweight'` if it is done against body weight), add a drawing for it
in `scripts/make-exercise-icons.ts` and run `npm run icons`. Thumbnails are simple equipment illustrations (no
people) written to `public/exercises/` and served by the app itself. Older entries that were logged by name
before the list was fixed still display, chart and edit.

The app icon (favicon, home-screen icons) is a dumbbell drawn by `scripts/make-app-icons.ts` into `public/`;
change the drawing there and run `npm run app-icons` to regenerate all the sizes.

Deleting a workout or weight entry shows an Undo toast; the delete is only sent once the toast expires.
