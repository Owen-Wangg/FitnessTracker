// Shaping rows from Supabase into the objects the UI uses.
//   workout entry: { id, date, name, exerciseId, sets: [{ id, set_number, weight, reps, set_type }] }

export const SET_COLUMNS = 'id, set_number, weight, reps, set_type';

export const normalizeWorkout = (row, sets) => ({
  id: row.id,
  date: row.date,
  name: row.name,
  exerciseId: row.exercise_id || null, // library id; null for custom or older entries
  sets: [...(sets || [])]
    .sort((a, b) => a.set_number - b.set_number)
    .map((s) => ({ ...s, weight: Number(s.weight) })),
});

export const sortNewestFirst = (list) => [...list].sort((a, b) => b.date.localeCompare(a.date));

export const sortOldestFirst = (list) => [...list].sort((a, b) => a.date.localeCompare(b.date));

// Supabase returns numeric columns that way for exact decimals; the UI wants numbers.
export const normalizeBodyWeight = (row) => ({ ...row, weight: Number(row.weight) });
