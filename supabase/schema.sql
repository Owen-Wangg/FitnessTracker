-- Per-set workout logging schema.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- workout_exercises: one row per exercise performed on a date (e.g. "Bench Press" on 2025-06-01)
-- workout_sets:      one row per set within that exercise (weight x reps)
--
-- The old single-row `workouts` table is left untouched. See migrate_legacy_workouts.sql
-- to copy existing entries into the new tables.

create table if not exists public.workout_exercises (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date        date not null,
  name        text not null check (char_length(btrim(name)) > 0),
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists workout_exercises_user_date_idx
  on public.workout_exercises (user_id, date desc);
create index if not exists workout_exercises_user_name_idx
  on public.workout_exercises (user_id, lower(name));

create table if not exists public.workout_sets (
  id                    uuid primary key default gen_random_uuid(),
  workout_exercise_id   uuid not null references public.workout_exercises (id) on delete cascade,
  user_id               uuid not null default auth.uid() references auth.users (id) on delete cascade,
  set_number            integer not null check (set_number > 0),
  weight                numeric(7, 2) not null default 0 check (weight >= 0),
  reps                  integer not null check (reps > 0),
  set_type              text not null default 'normal'
                          check (set_type in ('normal', 'warmup', 'drop', 'failure')),
  created_at            timestamptz not null default now(),
  unique (workout_exercise_id, set_number)
);

create index if not exists workout_sets_exercise_idx
  on public.workout_sets (workout_exercise_id);

-- Row Level Security: users can only see and change their own rows.
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

drop policy if exists "own exercises" on public.workout_exercises;
create policy "own exercises" on public.workout_exercises
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own sets" on public.workout_sets;
create policy "own sets" on public.workout_sets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.workout_exercises we
      where we.id = workout_exercise_id and we.user_id = (select auth.uid())
    )
  );
