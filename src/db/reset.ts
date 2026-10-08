import type { PlantDB } from './db';
import { getSetting, setSetting } from './settings';

export interface DataSummary {
  days: number;
  templates: number;
  reminders: number;
  planned: number;
  habits: number;
}

/** Đếm những gì sẽ mất khi xoá toàn bộ dữ liệu (hiện trong bảng xác nhận). */
export async function dataSummary(db: PlantDB): Promise<DataSummary> {
  const [days, templates, reminders, planned, habits] = await Promise.all([
    db.days.count(),
    db.templates.count(),
    db.reminders.count(),
    db.planned.count(),
    db.habits.count(),
  ]);
  return { days, templates, reminders, planned, habits };
}

/**
 * Xoá toàn bộ dữ liệu để bắt đầu lại như máy mới cài: mọi bảng và mọi cài đặt, trong một transaction
 * (xoá hết hoặc không xoá gì). Chỉ giữ ngôn ngữ đang dùng để giao diện không nhảy sang tiếng khác.
 */
export async function resetAllData(db: PlantDB): Promise<void> {
  await db.transaction('rw', [db.days, db.templates, db.settings, db.planned, db.plannedGoals, db.reminders, db.habits, db.habitChecks], async () => {
    const language = await getSetting(db, 'language');
    await db.days.clear();
    await db.templates.clear();
    await db.planned.clear();
    await db.plannedGoals.clear();
    await db.reminders.clear();
    await db.habits.clear();
    await db.habitChecks.clear();
    await db.settings.clear();
    if (language) await setSetting(db, 'language', language);
  });
}
