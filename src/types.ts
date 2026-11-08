// Shared data shapes. Database rows use snake_case (as Supabase returns them); the objects the UI
// works with are camelCase and are built by utils/workoutData.ts.

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export const GROUPS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'] as const;
export type Group = (typeof GROUPS)[number];

// How an exercise is loaded. 'external' (the default): `weight` is the weight lifted.
// 'bodyweight': `weight` is optional extra weight (belt, vest) on top of the lifter's body weight.
export type LoadType = 'external' | 'bodyweight';

// A built-in exercise from the curated library.
export interface Exercise {
  id: string;
  name: string;
  group: Group;
  loadType?: LoadType; // omitted means 'external'
}

// What the UI keeps for one set. Saved sets have id and set_number; sets being edited may not yet.
export interface WorkoutSet {
  id?: string;
  set_number?: number;
  weight: number;
  reps: number;
  set_type?: SetType;
  // The load the metrics use, when it differs from `weight`: body weight + added weight for
  // bodyweight exercises. Computed in memory (see applyBodyWeight), never saved.
  load?: number;
}

// One exercise performed on a date, with its sets.
export interface Workout {
  id: string;
  date: string; // 'YYYY-MM-DD'
  name: string;
  exerciseId?: string | null; // library id; null for custom or older entries
  sets: WorkoutSet[];
}

// Rows as Supabase returns them.
export interface SetRow {
  id?: string;
  set_number: number;
  weight: number | string; // numeric columns can arrive as strings
  reps: number;
  set_type?: SetType;
}

export interface WorkoutRow {
  id: string;
  date: string;
  name: string;
  exercise_id?: string | null;
  workout_sets?: SetRow[];
}

export interface BodyWeightRow {
  id: string;
  date: string;
  weight: number | string;
}

export interface BodyWeight {
  id: string;
  date: string;
  weight: number;
}

// A set as typed into the form: raw input strings.
export interface SetInput {
  weight: string;
  reps: string;
  set_type?: SetType;
  // When editing in kilograms: the weight as first shown and its exact pounds. Left unedited,
  // the pounds are kept so converting back and forth cannot nudge saved weights.
  source?: { shown: string; lbs: number };
}

// What the add/edit form hands back to be saved.
export interface WorkoutDraft {
  name: string;
  exerciseId: string | null;
  date: string;
  sets: WorkoutSet[];
}

// The part of a signed-in user the data hooks need.
export interface UserRef {
  id: string;
}

// A body weight entry as the log form submits it.
export interface BodyWeightDraft {
  date: string;
  weight: number;
}

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';
export type Metric = 'top' | 'e1rm' | 'volume' | 'reps';
