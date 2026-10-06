import type { PlantDB } from '../db/db';
import { newId } from './id';
import type { Template, TemplateItem } from './types';
import { AppError } from './errors';

export function parseItems(text: string): string[] {
  return text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

function cleanName(name: string): string {
  const n = name.trim();
  if (!n) throw new AppError('emptyTemplateName');
  return n;
}

function cleanItems(items: TemplateItem[]): TemplateItem[] {
  return items.map((i) => ({ text: i.text.trim(), period: i.period })).filter((i) => i.text);
}

export function listTemplates(db: PlantDB): Promise<Template[]> {
  return db.templates.orderBy('createdAt').toArray();
}

export async function createTemplate(db: PlantDB, name: string, items: TemplateItem[], now: number): Promise<Template> {
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
  patch: { name?: string; items?: TemplateItem[] },
  now: number,
): Promise<Template> {
  return db.transaction('rw', db.templates, async () => {
    const current = await db.templates.get(id);
    if (!current) throw new AppError('templateNotFound');
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
    if (id !== null && !all.some((t) => t.id === id)) throw new AppError('templateNotFound');
    for (const t of all) {
      const shouldBeDefault = t.id === id;
      if (t.isDefault !== shouldBeDefault) await db.templates.put({ ...t, isDefault: shouldBeDefault, updatedAt: now });
    }
  });
}
