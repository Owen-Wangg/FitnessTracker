import { findExercise, exerciseKey, exerciseOptions, searchExercises, FUNDAMENTALS, GROUPS } from './exerciseLibrary';

describe('library data', () => {
  test('every exercise has a unique id and a known group', () => {
    const ids = FUNDAMENTALS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    FUNDAMENTALS.forEach((e) => expect(GROUPS).toContain(e.group));
  });
});

describe('findExercise', () => {
  test('finds by id, then by case-insensitive name', () => {
    expect(findExercise('Barbell_Squat', 'whatever').name).toBe('Squat');
    expect(findExercise(null, '  squat ').id).toBe('Barbell_Squat');
  });

  test('returns null for custom exercises', () => {
    expect(findExercise(null, 'Sled Push')).toBeNull();
  });
});

describe('exerciseKey and exerciseOptions', () => {
  test('treats a library id and a typed name of the same lift as one exercise', () => {
    const a = { exerciseId: 'Barbell_Bench_Press_-_Medium_Grip', name: 'Bench Press' };
    const b = { exerciseId: null, name: 'bench press' };
    expect(exerciseKey(a)).toBe(exerciseKey(b));
  });

  test('options are distinct, labelled, and in first-seen order', () => {
    const options = exerciseOptions([
      { exerciseId: null, name: 'Sled Push' },
      { exerciseId: 'Barbell_Squat', name: 'Squat' },
      { exerciseId: null, name: 'sled push' },
      { exerciseId: null, name: 'squat' },
    ]);
    expect(options).toEqual([
      { key: 'sled push', label: 'Sled Push' },
      { key: 'Barbell_Squat', label: 'Squat' },
    ]);
  });
});

describe('searchExercises', () => {
  test('matches name or group, all terms required', () => {
    expect(searchExercises('bench').every((e) => /bench/i.test(e.name))).toBe(true);
    expect(searchExercises('chest').length).toBeGreaterThan(0);
    expect(searchExercises('incline press').map((e) => e.name)).toContain('Incline Dumbbell Press');
  });

  test('empty query returns everything; nonsense returns nothing', () => {
    expect(searchExercises('')).toHaveLength(FUNDAMENTALS.length);
    expect(searchExercises('zzzz')).toEqual([]);
  });
});
