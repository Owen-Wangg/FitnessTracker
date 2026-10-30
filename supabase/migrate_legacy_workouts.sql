-- One-time copy of entries from the old `workouts` table into the per-set tables.
-- Run AFTER schema.sql. Each old row (weight, sets, reps) becomes one exercise
-- with `sets` identical sets of `weight` x `reps`.
-- Safe to re-run: it does nothing if workout_exercises already has rows.

do $$
declare
  old_row record;
  new_id  uuid;
begin
  if exists (select 1 from public.workout_exercises) then
    raise notice 'workout_exercises already has data; skipping migration.';
    return;
  end if;

  for old_row in
    select user_id, date, name, weight, sets, reps
    from public.workouts
    where name is not null and date is not null
    order by date, name
  loop
    -- Skip rows the new schema cannot hold (likely typos) and report them.
    if coalesce(old_row.weight, 0) < 0 or coalesce(old_row.weight, 0) >= 100000
       or coalesce(old_row.sets, 1) > 100 then
      raise notice 'Skipped % on %: weight=%, sets=%, reps=%',
        old_row.name, old_row.date, old_row.weight, old_row.sets, old_row.reps;
      continue;
    end if;

    insert into public.workout_exercises (user_id, date, name)
    values (old_row.user_id, old_row.date::date, old_row.name)
    returning id into new_id;

    insert into public.workout_sets (workout_exercise_id, user_id, set_number, weight, reps)
    select new_id, old_row.user_id, n, coalesce(old_row.weight, 0), greatest(coalesce(old_row.reps, 1), 1)
    from generate_series(1, greatest(coalesce(old_row.sets, 1), 1)) as n;
  end loop;
end $$;
