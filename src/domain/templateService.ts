import type { PlantDB } from '../db/db';
import { newId } from './id';
import type { Template } from './types';

export function parseItems(text: string): string[] {
  return text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

function cleanName(name: string): string {
  const n = name.trim();
  if (!n) throw new Error('Tên mẫu không được để trống');
  return n;
}

function cleanItems(items: string[]): string[] {
  return items.map((s) => s.trim()).filter(Boolean);
}

export function listTemplates(db: PlantDB): Promise<Template[]> {
  return db.templates.orderBy('createdAt').toArray();
}

export async function createTemplate(db: PlantDB, name: string, items: string[], now: number): Promise<Template> {
  const template: Template = {
    id: newId(),
    name: cleanName(name),
    items: cleanItems(items),
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.templates.add(template);
  return template;
}

export async function updateTemplate(
  db: PlantDB,
  id: string,
  patch: { name?: string; items?: string[] },
  now: number,
): Promise<Template> {
  return db.transaction('rw', db.templates, async () => {
    const current = await db.templates.get(id);
    if (!current) throw new Error('Không tìm thấy mẫu');
    const next: Template = { ...current, updatedAt: now };
    if (patch.name !== undefined) next.name = cleanName(patch.name);
    if (patch.items !== undefined) next.items = cleanItems(patch.items);
    await db.templates.put(next);
    return next;
  });
}

export async function deleteTemplate(db: PlantDB, id: string): Promise<void> {
  await db.templates.delete(id);
}

export async function setDefaultTemplate(db: PlantDB, id: string | null, now: number): Promise<void> {
  await db.transaction('rw', db.templates, async () => {
    const all = await db.templates.toArray();
    if (id !== null && !all.some((t) => t.id === id)) throw new Error('Không tìm thấy mẫu');
    for (const t of all) {
      const shouldBeDefault = t.id === id;
      if (t.isDefault !== shouldBeDefault) await db.templates.put({ ...t, isDefault: shouldBeDefault, updatedAt: now });
    }
  });
}
