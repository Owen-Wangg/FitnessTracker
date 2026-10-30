-- Saves edits to a logged exercise (date, name, and its sets) in one transaction.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- The app uses this when it exists and falls back to separate statements when it does not.
--
-- The exercise's sets are replaced by p_sets, in order:
--   [{"weight": 135, "reps": 8, "set_type": "normal"}, ...]   (set_type is optional)
-- Runs as the calling user, so row-level security still applies.

create or replace function public.update_workout_exercise(
  p_id          uuid,
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
  result jsonb;
begin
  if jsonb_typeof(p_sets) <> 'array' or jsonb_array_length(p_sets) = 0 then
    raise exception 'at least one set is required';
  end if;

  update public.workout_exercises
  set date = p_date, name = btrim(p_name), exercise_id = p_exercise_id
  where id = p_id;

  if not found then
    raise exception 'workout not found';
  end if;

  delete from public.workout_sets where workout_exercise_id = p_id;

  insert into public.workout_sets (workout_exercise_id, set_number, weight, reps, set_type)
  select p_id, t.ord::int, (t.s ->> 'weight')::numeric, (t.s ->> 'reps')::int,
         coalesce(t.s ->> 'set_type', 'normal')
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
  where e.id = p_id;

  return result;
end;
$$;

grant execute on function public.update_workout_exercise(uuid, date, text, text, jsonb) to authenticated;
