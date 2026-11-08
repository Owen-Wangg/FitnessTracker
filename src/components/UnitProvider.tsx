import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { readUnit, saveUnit, type Unit } from '../utils/units';

export interface UnitApi {
  unit: Unit;
  setUnit: (unit: Unit) => void;
}

// Without a provider (tests, isolated components) everything shows in pounds.
const UnitContext = createContext<UnitApi>({ unit: 'lbs', setUnit: () => {} });

export const useUnit = (): UnitApi => useContext(UnitContext);

// The chosen weight unit, remembered on this device.
export const UnitProvider = ({ children }: { children?: ReactNode }) => {
  const [unit, setUnitState] = useState<Unit>(() => readUnit(window.localStorage));

  const setUnit = useCallback((next: Unit) => {
    saveUnit(window.localStorage, next);
    setUnitState(next);
  }, []);

  const value = useMemo(() => ({ unit, setUnit }), [unit, setUnit]);
  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
};
