import { FUNDAMENTALS, GROUPS } from '../data/fundamentals';

export { FUNDAMENTALS, GROUPS };

// Photos come from the public-domain Free Exercise DB via the jsDelivr CDN (free, no hosting needed).
const IMAGE_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';

export const exerciseImageUrl = (exercise) => (exercise ? `${IMAGE_BASE}/${exercise.id}/0.jpg` : null);

const byId = new Map(FUNDAMENTALS.map((e) => [e.id, e]));
const byName = new Map(FUNDAMENTALS.map((e) => [e.name.toLowerCase(), e]));

// Library entry for a logged workout: by id, else by exact (case-insensitive) name for older entries.
// Returns null for custom exercises.
export const findExercise = (exerciseId, name) =>
  (exerciseId && byId.get(exerciseId)) || (name && byName.get(name.trim().toLowerCase())) || null;

export const searchExercises = (query) => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return FUNDAMENTALS;
  return FUNDAMENTALS.filter((e) => {
    const haystack = `${e.name} ${e.group}`.toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
};
