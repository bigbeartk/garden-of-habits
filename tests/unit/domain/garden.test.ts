import { gardenReport } from '../../../src/domain/garden';
import { makeDay } from '../helpers';

const IDS = ['sunflower', 'corn', 'cactus'];
const todo = (done: boolean) => ({ id: crypto.randomUUID(), text: 'x', done, doneAt: done ? 1 : null, order: 0, period: 'morning' as const });
// hôm nay 10/10, dùng app từ 30/09
const CTX = { todayKey: '2026-10-10', firstKey: '2026-09-30' };

describe('gardenReport', () => {
  const records = [
    makeDay({ date: '2026-09-30', plantId: 'corn' }), // ngoài khoảng
    makeDay({ date: '2026-10-01', plantId: 'corn', finalStage: 'bloom', todos: [todo(true), todo(true)] }),
    makeDay({ date: '2026-10-02', plantId: 'cactus', todos: [todo(true), todo(false)], finalStage: 'bud' }),
    makeDay({ date: '2026-10-03', plantId: 'corn', isRestDay: true }), // ngày nghỉ: tính riêng, không tính cho Ngô
    // 04/10: không có bản ghi → cây héo
    makeDay({ date: '2026-10-05', plantId: 'corn', finalStage: 'bloom', todos: [todo(true)] }),
    makeDay({ date: '2026-10-06', plantId: 'sunflower' }), // ngoài khoảng
  ];

  it('đếm số ngày mỗi cây được chọn trong khoảng (tính cả hai đầu), nhiều nhất đứng trước; ngày nghỉ không tính cho cây', () => {
    const r = gardenReport(records, IDS, '2026-10-01', '2026-10-05', CTX);
    expect(r.entries).toEqual([
      { plantId: 'corn', count: 2 },
      { plantId: 'cactus', count: 1 },
      { plantId: 'sunflower', count: 0 }, // vẫn có mặt, để vườn hiện đủ loài
    ]);
  });

  it('đếm riêng ngày nghỉ và cây héo (ngày bỏ lỡ, giống ô héo trên Lịch)', () => {
    const r = gardenReport(records, IDS, '2026-10-01', '2026-10-05', CTX);
    expect(r.restDays).toBe(1);
    expect(r.wiltedDays).toBe(1);
  });

  it('cây héo chỉ tính từ ngày dùng app đầu tiên tới hôm qua; hôm nay chưa có bản ghi và ngày tương lai không héo', () => {
    // khoảng 25/09 → 15/10: trước 30/09 là chưa dùng app; 07,08,09/10 bỏ lỡ; 10/10 là hôm nay; 11–15/10 là tương lai
    const r = gardenReport(records, IDS, '2026-09-25', '2026-10-15', CTX);
    expect(r.wiltedDays).toBe(4); // 04, 07, 08, 09/10
    expect(gardenReport([], IDS, '2026-10-01', '2026-10-05', { todayKey: '2026-10-10', firstKey: null }).wiltedDays).toBe(0);
  });

  it('tổng kết: số ngày có cây (kể cả ngày nghỉ), số ngày ra hoa, số việc đã xong', () => {
    const r = gardenReport(records, IDS, '2026-10-01', '2026-10-05', CTX);
    expect(r.days).toBe(4);
    expect(r.bloomDays).toBe(2);
    expect(r.todosDone).toBe(4);
  });

  it('cùng số lần thì giữ thứ tự loài trong danh sách; loài lạ (đã xoá khỏi nội dung) không có ô riêng', () => {
    const r = gardenReport(
      [makeDay({ date: '2026-10-01', plantId: 'cactus' }), makeDay({ date: '2026-10-02', plantId: 'sunflower' }), makeDay({ date: '2026-10-03', plantId: 'old-plant' })],
      IDS, '2026-10-01', '2026-10-03', CTX,
    );
    expect(r.entries.map((e) => e.plantId)).toEqual(['sunflower', 'cactus', 'corn']);
    expect(r.days).toBe(3);
  });

  it('ngày bắt đầu sau ngày kết thúc thì tự đổi chỗ', () => {
    expect(gardenReport(records, IDS, '2026-10-05', '2026-10-01', CTX)).toEqual(gardenReport(records, IDS, '2026-10-01', '2026-10-05', CTX));
  });
});

describe('gardenReport với cây đặc biệt', () => {
  const sp = [
    makeDay({ date: '2026-10-01', plantId: 'corn', specialId: 'glow' }),
    makeDay({ date: '2026-10-02', plantId: 'corn' }),
    makeDay({ date: '2026-10-03', plantId: 'cactus', specialId: 'gold' }),
    makeDay({ date: '2026-10-04', plantId: 'corn', specialId: 'glow' }),
    makeDay({ date: '2026-10-05', plantId: 'corn', specialId: 'glow', isRestDay: true }), // ngày nghỉ: không phải cây đặc biệt
  ];

  it('mặc định: cây đặc biệt vẫn tính cho loài, nhưng tổng kết có số ngày cây đặc biệt', () => {
    const r = gardenReport(sp, IDS, '2026-10-01', '2026-10-05', CTX);
    expect(r.entries.find((e) => e.plantId === 'corn')!.count).toBe(3);
    expect(r.specialDays).toBe(3);
    expect(r.specials).toEqual([]);
  });

  it('tách riêng: ngày đặc biệt thành luống theo loài + hiệu ứng, không tính cho loài thường', () => {
    const r = gardenReport(sp, IDS, '2026-10-01', '2026-10-05', { ...CTX, separateSpecial: true });
    expect(r.entries.find((e) => e.plantId === 'corn')!.count).toBe(1);
    expect(r.entries.find((e) => e.plantId === 'cactus')!.count).toBe(0);
    expect(r.specials).toEqual([
      { plantId: 'corn', specialId: 'glow', count: 2 },
      { plantId: 'cactus', specialId: 'gold', count: 1 },
    ]);
    expect(r.specialDays).toBe(3);
    expect(r.restDays).toBe(1);
  });
});

describe('gardenReport: thứ tự luống trong vườn', () => {
  const key = (b: { kind: string; plantId?: string; specialId?: string }) =>
    b.kind === 'plant' ? b.plantId : b.kind === 'special' ? `${b.plantId}|${b.specialId}` : b.kind;

  it('mọi luống > 0 ngày đứng trên luống 0 ngày; mỗi nhóm theo thứ tự loài → đặc biệt → héo → nghỉ', () => {
    const recs = [
      makeDay({ date: '2026-10-01', plantId: 'corn', specialId: 'glow' }),
      makeDay({ date: '2026-10-02', plantId: 'cactus' }),
      makeDay({ date: '2026-10-03', plantId: 'cactus' }),
      // 04, 05: héo
      makeDay({ date: '2026-10-06', plantId: 'corn' }),
    ];
    const r = gardenReport(recs, IDS, '2026-10-01', '2026-10-06', { ...CTX, separateSpecial: true });
    expect(r.beds.map((b) => [key(b), b.count])).toEqual([
      ['cactus', 2], ['corn', 1], ['corn|glow', 1], ['wilted', 2], // > 0 ngày
      ['sunflower', 0], ['rest', 0], // 0 ngày, hiện mờ phía dưới
    ]);
  });

  it('cây héo / ngày nghỉ có ngày thì đứng trên loài chưa trồng', () => {
    const recs = [makeDay({ date: '2026-10-01', plantId: 'corn', isRestDay: true })];
    const r = gardenReport(recs, IDS, '2026-10-01', '2026-10-03', CTX);
    expect(r.beds.map(key)).toEqual(['wilted', 'rest', 'sunflower', 'corn', 'cactus']);
  });
});
