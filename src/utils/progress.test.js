import { buildSeries, valueFor, personalRecordFlags } from './progress';

const entry = (date, name, sets, extra = {}) => ({ id: `${date}-${name}`, date, name, sets, ...extra });

describe('buildSeries', () => {
  const workouts = [
    entry('2025-06-08', 'Bench Press', [{ weight: 190, reps: 5 }]),
    entry('2025-06-01', 'bench press', [{ weight: 185, reps: 5 }, { weight: 175, reps: 8 }]),
    entry('2025-06-01', 'Squat', [{ weight: 275, reps: 5 }]),
  ];

  test('groups one lift across name casing and sorts oldest first', () => {
    const series = buildSeries(workouts, 'Barbell_Bench_Press_-_Medium_Grip');
    expect(series.map((d) => d.date)).toEqual(['2025-06-01', '2025-06-08']);
    expect(series[0].top).toEqual({ weight: 185, reps: 5 });
    expect(series[0].volume).toBe(185 * 5 + 175 * 8);
  });

  test('merges multiple entries on the same day', () => {
    const twice = [
      entry('2025-06-01', 'Bench Press', [{ weight: 135, reps: 10 }]),
      entry('2025-06-01', 'Bench Press', [{ weight: 205, reps: 3 }]),
    ];
    const [day] = buildSeries(twice, 'Barbell_Bench_Press_-_Medium_Grip');
    expect(day.top).toEqual({ weight: 205, reps: 3 });
    expect(day.volume).toBe(1350 + 615);
  });

  test('matches custom exercises by lowercased name', () => {
    const custom = [entry('2025-06-01', 'Sled Push', [{ weight: 90, reps: 4 }])];
    expect(buildSeries(custom, 'sled push')).toHaveLength(1);
    expect(buildSeries(custom, 'squat')).toHaveLength(0);
  });

  test('skips days with only warm-up sets', () => {
    const warm = [entry('2025-06-01', 'Squat', [{ weight: 95, reps: 10, set_type: 'warmup' }])];
    expect(buildSeries(warm, 'Barbell_Squat')).toEqual([]);
  });
});

describe('valueFor', () => {
  const day = { top: { weight: 200, reps: 3 }, e1rm: 220, volume: 600 };
  test('selects the chosen metric', () => {
    expect(valueFor(day, 'top')).toBe(200);
    expect(valueFor(day, 'e1rm')).toBe(220);
    expect(valueFor(day, 'volume')).toBe(600);
  });
});

describe('personalRecordFlags', () => {
  test('flags only points that beat everything before them', () => {
    expect(personalRecordFlags([100, 105, 105, 102, 110])).toEqual([false, true, false, false, true]);
  });

  test('the first point is a baseline, never a PR', () => {
    expect(personalRecordFlags([100])).toEqual([false]);
    expect(personalRecordFlags([])).toEqual([]);
  });
});
