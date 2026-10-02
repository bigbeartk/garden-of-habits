import type { PlantDB } from './db';
import type { DayRecord } from '../domain/types';

export function listDaysInRange(db: PlantDB, from: string, to: string): Promise<DayRecord[]> {
  return db.days.where('date').between(from, to, true, true).toArray();
}

export async function firstDayKey(db: PlantDB): Promise<string | null> {
  const first = await db.days.orderBy('date').first();
  return first?.date ?? null;
}

export async function oldestCreatedAt(db: PlantDB): Promise<number | null> {
  const first = await db.days.orderBy('date').first();
  return first?.createdAt ?? null;
}
