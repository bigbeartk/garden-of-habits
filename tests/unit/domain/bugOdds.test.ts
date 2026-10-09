import { BASE_ODDS, STEP, bugOdds, pickTier, streakBonus, type DayBugInfo } from '../../../src/domain/bugOdds';

const perfect = (tier: DayBugInfo['tier'] = 'common'): DayBugInfo => ({ scheduled: true, perfect: true, tier });
const missed: DayBugInfo = { scheduled: true, perfect: false, tier: null };
const free: DayBugInfo = { scheduled: false, perfect: false, tier: null };

describe('streakBonus (đi lùi từ hôm qua, mới nhất trước)', () => {
  it('chưa có lịch sử → 0', () => {
    expect(streakBonus([])).toEqual({ rare: 0, epic: 0 });
  });
  it('mỗi ngày làm đủ gặp con thường cộng cả hai', () => {
    expect(streakBonus([perfect(), perfect(), perfect()])).toEqual({ rare: 3, epic: 3 });
  });
  it('bộ đếm riêng: gặp Hiếm chỉ dừng bộ Hiếm, gặp Rất hiếm chỉ dừng bộ Rất hiếm', () => {
    expect(streakBonus([perfect(), perfect('rare'), perfect(), perfect()])).toEqual({ rare: 1, epic: 4 });
    expect(streakBonus([perfect(), perfect('epic'), perfect(), perfect()])).toEqual({ rare: 4, epic: 1 });
  });
  it('ngày bỏ lỡ làm đứt chuỗi: mọi ngày trước đó không tính', () => {
    expect(streakBonus([perfect(), perfect(), missed, perfect(), perfect()])).toEqual({ rare: 2, epic: 2 });
    expect(streakBonus([missed, perfect()])).toEqual({ rare: 0, epic: 0 });
  });
  it('ngày không có lịch (ngày nghỉ, không thói quen nào) bỏ qua: không cộng, không đứt', () => {
    expect(streakBonus([perfect(), free, perfect(), free])).toEqual({ rare: 2, epic: 2 });
  });
});

describe('bugOdds', () => {
  it('gốc: Rất hiếm 2%, Hiếm 6/29', () => {
    expect(BASE_ODDS).toEqual({ rare: 6 / 29, epic: 0.02 });
    const o = bugOdds({ rare: 0, epic: 0 });
    expect(o.epic).toBeCloseTo(0.02);
    expect(o.rare).toBeCloseTo(6 / 29);
    expect(o.common).toBeCloseTo(1 - 0.02 - 6 / 29);
  });
  it('mỗi ngày trong chuỗi +1% cho nhóm', () => {
    expect(STEP).toBe(0.01);
    const o = bugOdds({ rare: 10, epic: 10 });
    expect(o.rare).toBeCloseTo(6 / 29 + 0.1);
    expect(o.epic).toBeCloseTo(0.12);
  });
  it('không vượt 100%: Rất hiếm ưu tiên, Hiếm lấy phần còn lại, thường về 0', () => {
    const o = bugOdds({ rare: 90, epic: 70 });
    expect(o.epic).toBeCloseTo(0.72);
    expect(o.rare).toBeCloseTo(0.28);
    expect(o.common).toBeCloseTo(0);
    expect(bugOdds({ rare: 0, epic: 200 })).toMatchObject({ epic: 1, rare: 0, common: 0 });
  });
});

describe('pickTier', () => {
  it('chia khoảng [0,1): Rất hiếm → Hiếm → thường', () => {
    const o = { epic: 0.125, rare: 0.25, common: 0.625 }; // số nhị phân chính xác để thử đúng biên
    expect(pickTier(o, 0)).toBe('epic');
    expect(pickTier(o, 0.124)).toBe('epic');
    expect(pickTier(o, 0.125)).toBe('rare');
    expect(pickTier(o, 0.374)).toBe('rare');
    expect(pickTier(o, 0.375)).toBe('common');
    expect(pickTier(o, 0.9999)).toBe('common');
  });
});
