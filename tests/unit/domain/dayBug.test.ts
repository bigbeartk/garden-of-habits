import { makeDay, makeDeps } from '../helpers';
import { BUGS } from '../../../src/content/bugs';
import { legacyBugFor, pickBugInTier } from '../../../src/domain/bugOdds';
import { addDays } from '../../../src/domain/dayKey';
import { dayBugId, ensureDayBug, toggleHabit } from '../../../src/domain/habitService';
import type { Rng } from '../../../src/domain/random';

const TODAY = '2026-10-02'; // makeDeps mặc định
const rarityOf = (id: string | null) => BUGS.find((b) => b.id === id)?.rarity;
/** RNG trả lần lượt các số cho trước (lần 1 chọn nhóm, lần 2 chọn con trong nhóm). */
const seq = (...xs: number[]): Rng => { let i = 0; return () => xs[i++ % xs.length]; };

/** Thói quen mỗi ngày từ `start`; tick các ngày `done`; mỗi ngày có bản ghi (ngày đã làm đủ ghi sẵn `bugId` thường). */
async function setup(start: string, done: string[], opts: { tickToday?: boolean } = {}) {
  const { deps, clock } = makeDeps();
  await deps.db.habits.put({ id: 'h', name: 'Nước', icon: '💧', color: 'sky', weekdays: [0, 1, 2, 3, 4, 5, 6], order: 0, startDate: start, createdAt: 0, updatedAt: 0 });
  for (let k = start; k < TODAY; k = addDays(k, 1)) {
    await deps.db.days.put(makeDay({ date: k, bugId: done.includes(k) ? 'ladybug' : undefined }));
  }
  await deps.db.days.put(makeDay({ date: TODAY }));
  await deps.db.habitChecks.bulkPut(done.map((date) => ({ habitId: 'h', date, at: 1 })));
  if (opts.tickToday !== false) await deps.db.habitChecks.put({ habitId: 'h', date: TODAY, at: 1 });
  return { deps, clock };
}

const range = (from: string, to: string) => { const out: string[] = []; for (let k = from; k <= to; k = addDays(k, 1)) out.push(k); return out; };

describe('con của ngày: bốc thật, lưu lại', () => {
  it('chưa làm đủ thì không bốc, không ghi', async () => {
    const { deps } = await setup('2026-09-28', [], { tickToday: false });
    expect(await ensureDayBug(deps, TODAY, BUGS)).toBeNull();
    expect((await deps.db.days.get(TODAY))!.bugId).toBeUndefined();
  });

  it('làm đủ thì bốc một lần và lưu; gọi lại (vd. bỏ tick rồi tick lại) giữ đúng con cũ', async () => {
    const { deps } = await setup('2026-09-28', []);
    const id = await ensureDayBug(deps, TODAY, BUGS);
    expect(BUGS.map((b) => b.id)).toContain(id);
    expect((await deps.db.days.get(TODAY))!.bugId).toBe(id);
    await toggleHabit(deps, 'h'); // bỏ tick
    await toggleHabit(deps, 'h'); // tick lại
    deps.rng = seq(0.99, 0.99);
    expect(await ensureDayBug(deps, TODAY, BUGS)).toBe(id);
    expect((await deps.db.days.get(TODAY))!.bugId).toBe(id);
  });

  it('chuỗi 5 ngày làm đủ: Rất hiếm 7% → số 0,05 ra Rất hiếm (không chuỗi thì chỉ 2% → ra Hiếm)', async () => {
    const five = range('2026-09-27', '2026-10-01');
    const a = await setup('2026-09-27', five);
    a.deps.rng = seq(0.05, 0);
    expect(rarityOf(await ensureDayBug(a.deps, TODAY, BUGS))).toBe('epic');

    // hôm qua bỏ lỡ → chuỗi đứt
    const b = await setup('2026-09-27', five.slice(0, 4));
    b.deps.rng = seq(0.05, 0);
    expect(rarityOf(await ensureDayBug(b.deps, TODAY, BUGS))).toBe('rare');
  });

  it('ngày đã gặp Rất hiếm reset bộ đếm Rất hiếm, bộ Hiếm vẫn cộng', async () => {
    const five = range('2026-09-27', '2026-10-01');
    const { deps } = await setup('2026-09-27', five);
    await deps.db.days.update('2026-10-01', { bugId: 'dragonfly' }); // hôm qua gặp Rất hiếm
    deps.rng = seq(0.05, 0); // Rất hiếm chỉ còn 2% → không trúng; Hiếm 20,7% + 5% → trúng
    expect(rarityOf(await ensureDayBug(deps, TODAY, BUGS))).toBe('rare');
  });

  it('chỉ bốc cho hôm nay; ngày cũ không có bugId thì hiển thị theo cách bốc sẵn cũ', async () => {
    const { deps } = await setup('2026-09-28', ['2026-09-30']);
    expect(await ensureDayBug(deps, '2026-09-30', BUGS)).toBeNull();
    expect(dayBugId({ date: '2026-09-29' }, '2026-09-29', TODAY, BUGS)).toBe(legacyBugFor('2026-09-29', BUGS));
    expect(dayBugId({ date: TODAY }, TODAY, TODAY, BUGS)).toBeNull();
    expect(dayBugId({ date: TODAY, bugId: 'ant' }, TODAY, TODAY, BUGS)).toBe('ant');
  });

  it('pickBugInTier chia trong nhóm theo weight', () => {
    expect(pickBugInTier(BUGS, 'epic', 0)).toBe('dragonfly');
    expect(pickBugInTier(BUGS, 'epic', 0.99)).toBe('luna-moth');
    expect(pickBugInTier(BUGS, 'common', 0)).toBe('ladybug');
  });
});
