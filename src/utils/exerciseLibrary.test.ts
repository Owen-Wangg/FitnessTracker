import { exerciseImageUrl, findExercise, exerciseKey, exerciseOptions, searchExercises, FUNDAMENTALS, GROUPS } from './exerciseLibrary';

describe('library data', () => {
  test('every exercise has a unique id and a known group', () => {
    const ids = FUNDAMENTALS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    FUNDAMENTALS.forEach((e) => expect(GROUPS).toContain(e.group));
  });
});

describe('findExercise', () => {
  test('finds by id, then by case-insensitive name', () => {
    expect(findExercise('Leg_Press', 'whatever')?.name).toBe('Leg Press Machine');
    expect(findExercise(null, '  leg press machine ')?.id).toBe('Leg_Press');
  });

  test('returns null for custom exercises', () => {
    expect(findExercise(null, 'Sled Push')).toBeNull();
  });
});

describe('exerciseKey and exerciseOptions', () => {
  test('treats a library id and a typed name of the same lift as one exercise', () => {
    const a = { exerciseId: 'Leverage_Chest_Press', name: 'Flat Chest Press Machine' };
    const b = { exerciseId: null, name: 'flat chest press machine' };
    expect(exerciseKey(a)).toBe(exerciseKey(b));
  });

  test('options are distinct, labelled, and in first-seen order', () => {
    const options = exerciseOptions([
      { exerciseId: null, name: 'Sled Push' },
      { exerciseId: 'Leg_Press', name: 'Leg Press Machine' },
      { exerciseId: null, name: 'sled push' },
      { exerciseId: null, name: 'leg press machine' },
    ]);
    expect(options).toEqual([
      { key: 'sled push', label: 'Sled Push' },
      { key: 'Leg_Press', label: 'Leg Press Machine' },
    ]);
  });
});

describe('searchExercises', () => {
  test('matches name or group, all terms required', () => {
    expect(searchExercises('press').every((e) => /press/i.test(e.name))).toBe(true);
    expect(searchExercises('chest').length).toBeGreaterThan(0);
    expect(searchExercises('incline press').map((e) => e.name)).toContain('Incline Dumbbell Press');
  });

  test('empty query returns everything; nonsense returns nothing', () => {
    expect(searchExercises('')).toHaveLength(FUNDAMENTALS.length);
    expect(searchExercises('zzzz')).toEqual([]);
  });
});

describe('exerciseImageUrl', () => {
  test('points at the bundled thumbnail, and is null for custom exercises', () => {
    expect(exerciseImageUrl({ id: 'Leg_Press' })).toBe('/exercises/Leg_Press.webp');
    expect(exerciseImageUrl(null)).toBeNull();
  });

  test('every exercise in the list has a thumbnail file', async () => {
    const fs = await import('node:fs');
    for (const { id } of FUNDAMENTALS) {
      expect(fs.existsSync(`public/exercises/${id}.webp`), id).toBe(true);
    }
  });
});
