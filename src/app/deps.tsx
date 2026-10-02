import { createContext, useContext } from 'react';
import { CATALOG } from '../content/catalog';
import { db } from '../db/db';
import type { DayDeps } from '../domain/dayService';

export const defaultDeps: DayDeps = {
  db,
  catalog: CATALOG,
  rng: Math.random,
  now: () => new Date(),
};

const DepsContext = createContext<DayDeps>(defaultDeps);
export const DepsProvider = DepsContext.Provider;
export const useDeps = () => useContext(DepsContext);
