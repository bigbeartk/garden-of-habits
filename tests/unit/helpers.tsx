import { PlantDB } from '../../src/db/db';
import type { DayRecord } from '../../src/domain/types';

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
