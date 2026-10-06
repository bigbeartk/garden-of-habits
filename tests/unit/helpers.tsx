import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { DepsProvider } from '../../src/app/deps';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import type { Lang } from '../../src/i18n/lang';
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
    { id: 'sunflower', defaultPotId: 'terracotta', styles: [{ id: 'mini', unlockAt: 10 }, { id: 'giant', unlockAt: 20 }] },
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

/** Render trong deps + i18n; mặc định tiếng Việt (jsdom báo máy en-US), truyền `'en'` để thử tiếng Anh. */
export function renderWithDeps(ui: ReactElement, deps: DayDeps, nav: (tab: Tab) => void = () => {}, lang: Lang = 'vi') {
  return render(
    <DepsProvider value={deps}>
      <I18nProvider lang={lang}>
        <NavContext.Provider value={nav}>{ui}</NavContext.Provider>
      </I18nProvider>
    </DepsProvider>,
  );
}
