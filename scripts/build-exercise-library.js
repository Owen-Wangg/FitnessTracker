// Regenerates src/data/exercises.json from the public-domain Free Exercise DB
// (https://github.com/yuhonas/free-exercise-db, Unlicense).
// Usage: node scripts/build-exercise-library.js
const fs = require('fs');
const path = require('path');

const SOURCE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const OUT = path.join(__dirname, '..', 'src', 'data', 'exercises.json');

(async () => {
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const source = await res.json();

  // Keep only what the app uses. `images` is a count; files are 0.jpg, 1.jpg, ...
  const exercises = source
    .map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      equipment: e.equipment || 'other',
      level: e.level,
      primary: e.primaryMuscles || [],
      secondary: e.secondaryMuscles || [],
      instructions: e.instructions || [],
      images: (e.images || []).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(exercises));
  console.log(`Wrote ${exercises.length} exercises to ${path.relative(process.cwd(), OUT)}`);
})();
