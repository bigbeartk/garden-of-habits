import type { Catalog } from '../domain/types';
import { PLANTS } from './plants/registry';
import { POTS } from './pots/registry';
import { SPECIALS } from './specials/registry';

export const CATALOG: Catalog = {
  plants: PLANTS.map((p) => ({
    id: p.id,
    defaultPotId: p.defaultPotId,
    styles: (p.styles ?? []).map((s) => ({ id: s.id, unlockAt: s.unlockAt })),
    ...(p.locked ? { locked: true } : {}),
  })),
  potIds: POTS.map((p) => p.id),
  specials: SPECIALS.map((s) => ({ id: s.id, weight: s.weight })),
};
