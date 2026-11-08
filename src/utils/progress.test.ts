import type { WorkoutSet } from '../types';
import { buildSeries, valueFor, personalRecordFlags, niceScale } from './progress';

const entry = (date: string, name: string, sets: WorkoutSet[], extra = {}) => ({ id: `${date}-${name}`, date, name, sets, ...extra });

describe('buildSeries', () => {
  const workouts = [
    entry('2025-06-08', 'Flat Chest Press Machine', [{ weight: 190, reps: 5 }]),
    entry('2025-06-01', 'flat chest press machine', [{ weight: 185, reps: 5 }, { weight: 175, reps: 8 }]),
    entry('2025-06-01', 'Leg Press Machine', [{ weight: 275, reps: 5 }]),
  ];

  test('groups one lift across name casing and sorts oldest first', () => {
    const series = buildSeries(workouts, 'Leverage_Chest_Press');
    expect(series.map((d) => d.date)).toEqual(['2025-06-01', '2025-06-08']);
    expect(series[0].top).toEqual({ weight: 185, reps: 5 });
    expect(series[0].volume).toBe(185 * 5 + 175 * 8);
  });

  test('merges multiple entries on the same day', () => {
    const twice = [
      entry('2025-06-01', 'Flat Chest Press Machine', [{ weight: 135, reps: 10 }]),
      entry('2025-06-01', 'Flat Chest Press Machine', [{ weight: 205, reps: 3 }]),
    ];
    const [day] = buildSeries(twice, 'Leverage_Chest_Press');
    expect(day.top).toEqual({ weight: 205, reps: 3 });
    expect(day.volume).toBe(1350 + 615);
  });

  test('matches custom exercises by lowercased name', () => {
    const custom = [entry('2025-06-01', 'Sled Push', [{ weight: 90, reps: 4 }])];
    expect(buildSeries(custom, 'sled push')).toHaveLength(1);
    expect(buildSeries(custom, 'squat')).toHaveLength(0);
  });

  test('tracks the most reps in a set, even when added weight is 0', () => {
    const chinUps = [
      entry('2025-06-01', 'Pull-Up', [{ weight: 0, reps: 8 }, { weight: 0, reps: 10 }], { exerciseId: 'Pull_Up' }),
      entry('2025-06-08', 'Pull-Up', [{ weight: 0, reps: 11 }], { exerciseId: 'Pull_Up' }),
    ];
    const series = buildSeries(chinUps, 'Pull_Up');
    expect(series.map((d) => d.reps)).toEqual([10, 11]);
  });

  test('skips days with only warm-up sets', () => {
    const warm = [entry('2025-06-01', 'Leg Press Machine', [{ weight: 95, reps: 10, set_type: 'warmup' }])];
    expect(buildSeries(warm, 'Leg_Press')).toEqual([]);
  });
});

describe('valueFor', () => {
  const day = { date: '2025-06-01', top: { weight: 200, reps: 3 }, e1rm: 220, volume: 600, reps: 5 };
  test('selects the chosen metric', () => {
    expect(valueFor(day, 'top')).toBe(200);
    expect(valueFor(day, 'e1rm')).toBe(220);
    expect(valueFor(day, 'volume')).toBe(600);
    expect(valueFor(day, 'reps')).toBe(5);
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

describe('niceScale', () => {
  const evenlySpaced = (ticks: number[]) => ticks.every((t, i) => i === 0 || Math.abs(t - ticks[i - 1] - (ticks[1] - ticks[0])) < 1e-9);

  test('rounds the bounds and ticks to friendly numbers around the data', () => {
    const { domain, ticks } = niceScale(175, 200);
    expect(domain).toEqual([170, 210]);
    expect(ticks).toEqual([170, 180, 190, 200, 210]);
  });

  test('always contains the data, spaces ticks evenly, and uses a handful of ticks', () => {
    const cases = [[178.5, 182], [185, 185], [0, 0.4], [1200, 4800], [99, 101], [20000, 90000], [-5, 15]];
    for (const [min, max] of cases) {
      const { domain, ticks } = niceScale(min, max);
      expect(domain[0]).toBeLessThanOrEqual(min);
      expect(domain[1]).toBeGreaterThanOrEqual(max);
      expect(ticks[0]).toBe(domain[0]);
      expect(ticks[ticks.length - 1]).toBe(domain[1]);
      expect(evenlySpaced(ticks)).toBe(true);
      expect(ticks.length).toBeGreaterThanOrEqual(3);
      expect(ticks.length).toBeLessThanOrEqual(9);
    }
  });

  test('handles decimals without floating-point noise', () => {
    const { ticks } = niceScale(0, 0.4);
    expect(ticks.every((t) => Number.isInteger(t * 100) || Math.abs(t * 100 - Math.round(t * 100)) < 1e-9)).toBe(true);
  });

  test('a single value still gets a sensible range', () => {
    const { domain } = niceScale(185, 185);
    expect(domain[0]).toBeLessThan(185);
    expect(domain[1]).toBeGreaterThan(185);
  });
});
