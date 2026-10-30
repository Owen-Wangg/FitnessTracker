import { useEffect, useState } from 'react';

// Photos come from the public-domain Free Exercise DB via the jsDelivr CDN (free, no hosting needed).
const IMAGE_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';

export const exerciseImageUrl = (exercise, index = 0) =>
  exercise && exercise.images > index ? `${IMAGE_BASE}/${exercise.id}/${index}.jpg` : null;

// Loaded once, in its own chunk, the first time something needs the library.
let libraryPromise = null;
let byId = new Map();
let byName = new Map();

export const loadExerciseLibrary = () => {
  if (!libraryPromise) {
    libraryPromise = import('../data/exercises.json').then((module) => {
      const list = module.default;
      byId = new Map(list.map((e) => [e.id, e]));
      byName = new Map(list.map((e) => [e.name.toLowerCase(), e]));
      return list;
    });
  }
  return libraryPromise;
};

export const useExerciseLibrary = () => {
  const [exercises, setExercises] = useState([]);
  useEffect(() => {
    let cancelled = false;
    loadExerciseLibrary().then((list) => {
      if (!cancelled) setExercises(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return exercises;
};

// Library entry for a logged workout: by id, else by exact (case-insensitive) name for older entries.
export const findExercise = (exerciseId, name) =>
  (exerciseId && byId.get(exerciseId)) || (name && byName.get(name.trim().toLowerCase())) || null;

export const MUSCLE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'chest', label: 'Chest' },
  { id: 'lats', label: 'Back', also: ['middle back', 'lower back', 'traps'] },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'quadriceps', label: 'Quads' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'calves', label: 'Calves' },
  { id: 'abdominals', label: 'Abs' },
  { id: 'forearms', label: 'Forearms' },
];

export const titleCase = (s) => (s || '').replace(/\b\w/g, (c) => c.toUpperCase());

export const filterExercises = (exercises, { query = '', muscle = 'all', equipment = 'all' }) => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const group = MUSCLE_FILTERS.find((m) => m.id === muscle);
  const muscles = group && muscle !== 'all' ? [group.id, ...(group.also || [])] : null;

  return exercises.filter((e) => {
    if (muscles && !e.primary.some((m) => muscles.includes(m))) return false;
    if (equipment !== 'all' && e.equipment !== equipment) return false;
    if (terms.length === 0) return true;
    const haystack = `${e.name} ${e.equipment} ${e.primary.join(' ')}`.toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
};
