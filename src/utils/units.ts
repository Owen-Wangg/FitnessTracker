// Weight units. Everything is stored in pounds; kilograms are only a display and input choice, so
// switching units never changes saved data.
export type Unit = 'lbs' | 'kg';

export const UNIT_KEY = 'fitness-unit';
export const UNITS: Unit[] = ['lbs', 'kg'];

const KG_PER_LB = 0.45359237;

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

// Pounds -> the number to show: unchanged for lbs, rounded to 0.1 for kg.
export const toDisplay = (lbs: number, unit: Unit): number =>
  unit === 'kg' ? Math.round(lbs * KG_PER_LB * 10) / 10 : lbs;

// Pounds -> text for a form field: kg keeps two decimals so 21.25 kg plates survive.
export const toInputValue = (lbs: number, unit: Unit): string =>
  unit === 'kg' ? String(Number((lbs * KG_PER_LB).toFixed(2))) : String(lbs);

// A value typed in the chosen unit -> pounds, as stored (the column holds two decimals).
export const fromDisplay = (value: number, unit: Unit): number =>
  unit === 'kg' ? Number((value / KG_PER_LB).toFixed(2)) : value;

export const readUnit = (storage: ReadableStorage): Unit => {
  try {
    const saved = storage.getItem(UNIT_KEY);
    return UNITS.includes(saved as Unit) ? (saved as Unit) : 'lbs';
  } catch {
    return 'lbs'; // storage blocked (private mode, etc.)
  }
};

export const saveUnit = (storage: WritableStorage, unit: Unit): void => {
  try {
    storage.setItem(UNIT_KEY, unit);
  } catch {
    // ignore: the unit still applies for this visit
  }
};
