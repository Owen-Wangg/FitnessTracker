import { UNIT_KEY, fromDisplay, readUnit, saveUnit, toDisplay, toInputValue } from './units';

describe('conversion', () => {
  test('pounds pass through unchanged', () => {
    expect(toDisplay(135.5, 'lbs')).toBe(135.5);
    expect(toInputValue(135.5, 'lbs')).toBe('135.5');
    expect(fromDisplay(135.5, 'lbs')).toBe(135.5);
  });

  test('kilograms are rounded to 0.1 for display and 0.01 for inputs', () => {
    expect(toDisplay(135, 'kg')).toBe(61.2);
    expect(toInputValue(135, 'kg')).toBe('61.23');
    expect(toInputValue(100, 'kg')).toBe('45.36');
  });

  test('a value typed in kg round-trips to the same kg', () => {
    for (const kg of [20, 21.25, 60, 102.5]) {
      expect(Number(toInputValue(fromDisplay(kg, 'kg'), 'kg'))).toBeCloseTo(kg, 1);
    }
    expect(fromDisplay(20, 'kg')).toBe(44.09);
  });
});

describe('saved unit', () => {
  const storage = (value: string | null) => ({ getItem: () => value, setItem: vi.fn() });

  test('defaults to lbs for a missing or unknown value', () => {
    expect(readUnit(storage(null))).toBe('lbs');
    expect(readUnit(storage('stone'))).toBe('lbs');
  });

  test('reads kg back and tolerates blocked storage', () => {
    expect(readUnit(storage('kg'))).toBe('kg');
    expect(readUnit({ getItem: () => { throw new Error('blocked'); } })).toBe('lbs');
  });

  test('saves under its key', () => {
    const s = storage(null);
    saveUnit(s, 'kg');
    expect(s.setItem).toHaveBeenCalledWith(UNIT_KEY, 'kg');
  });
});
