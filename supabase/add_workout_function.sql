-- Saves an exercise and all its sets in one transaction (all or nothing).
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- The app uses this when it exists and falls back to separate inserts when it does not.
--
-- p_sets is a JSON array in set order: [{"weight": 135, "reps": 8}, ...]
-- Runs as the calling user, so row-level security still applies.

create or replace function public.add_workout_exercise(
  p_date        date,
  p_name        text,
  p_exercise_id text,
  p_sets        jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_id uuid;
  result jsonb;
begin
  if jsonb_typeof(p_sets) <> 'array' or jsonb_array_length(p_sets) = 0 then
    raise exception 'at least one set is required';
  end if;

  insert into public.workout_exercises (date, name, exercise_id)
  values (p_date, btrim(p_name), p_exercise_id)
  returning id into new_id;

  insert into public.workout_sets (workout_exercise_id, set_number, weight, reps)
  select new_id, t.ord::int, (t.s ->> 'weight')::numeric, (t.s ->> 'reps')::int
  from jsonb_array_elements(p_sets) with ordinality as t(s, ord);

  select jsonb_build_object(
    'id', e.id,
    'date', e.date,
    'name', e.name,
    'exercise_id', e.exercise_id,
    'workout_sets', coalesce(
      (select jsonb_agg(
         jsonb_build_object('id', ws.id, 'set_number', ws.set_number, 'weight', ws.weight,
                            'reps', ws.reps, 'set_type', ws.set_type)
         order by ws.set_number)
       from public.workout_sets ws
       where ws.workout_exercise_id = e.id),
      '[]'::jsonb)
  )
  into result
  from public.workout_exercises e
  where e.id = new_id;

  return result;
end;
$$;

grant execute on function public.add_workout_exercise(date, text, text, jsonb) to authenticated;
