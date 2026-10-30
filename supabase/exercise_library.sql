-- Link logged exercises to the built-in exercise library.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- exercise_id is the library id (e.g. 'Barbell_Bench_Press_-_Medium_Grip').
-- It is null for custom exercises and for entries logged before the library existed.

alter table public.workout_exercises
  add column if not exists exercise_id text;

create index if not exists workout_exercises_user_exercise_idx
  on public.workout_exercises (user_id, exercise_id);
