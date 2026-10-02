import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { DepsProvider } from '../../src/app/deps';
import { NavContext, type Tab } from '../../src/app/nav';
import { PlantDB } from '../../src/db/db';
import { mulberry32 } from '../../src/domain/random';
import type { DayDeps } from '../../src/domain/dayService';
import type { Catalog, DayRecord } from '../../src/domain/types';

export function makeDb(): PlantDB {
  return new PlantDB(`test-${crypto.randomUUID()}`);
}

export function makeDay(partial: Partial<DayRecord> & { date: string }): DayRecord {
  return {
    plantId: 'sunflower',
    potId: 'terracotta',
    specialId: null,
    isRestDay: false,
    greetedAt: null,
    note: '',
    todos: [],
    finalStage: 'seed',
    createdAt: 0,
    updatedAt: 0,
    ...partial,
  };
}

export const TEST_CATALOG: Catalog = {
  plants: [
    { id: 'sunflower', defaultPotId: 'terracotta' },
    { id: 'corn', defaultPotId: 'rattan' },
  ],
  potIds: ['terracotta', 'rattan', 'pink-cup'],
  specials: [{ id: 'glow', weight: 1 }],
};

export function makeDeps(start = new Date(2026, 9, 2, 10, 0), catalog: Catalog = TEST_CATALOG) {
  const clock = { current: start };
  const deps: DayDeps = {
    db: makeDb(),
    catalog,
    rng: mulberry32(42),
    now: () => new Date(clock.current.getTime()),
  };
  return { deps, clock };
}

export function renderWithDeps(ui: ReactElement, deps: DayDeps, nav: (tab: Tab) => void = () => {}) {
  return render(
    <DepsProvider value={deps}>
      <NavContext.Provider value={nav}>{ui}</NavContext.Provider>
    </DepsProvider>,
  );
}
