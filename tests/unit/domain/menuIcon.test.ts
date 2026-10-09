import { resolveMenuIcon } from '../../../src/domain/menuIcon';

describe('resolveMenuIcon', () => {
  it('chưa chọn hoặc "Theo hình nền": theo kiểu nền lịch; mặc định và ảnh riêng là bông hoa', () => {
    expect(resolveMenuIcon(undefined, 'default')).toBe('flower');
    expect(resolveMenuIcon('auto', 'photo')).toBe('flower');
    for (const t of ['cat', 'dog', 'grass', 'rain', 'gamer'] as const) expect(resolveMenuIcon('auto', t)).toBe(t);
  });

  it('đã chọn riêng thì dùng icon đó, bất kể nền', () => {
    expect(resolveMenuIcon('rain', 'dog')).toBe('rain');
    expect(resolveMenuIcon('flower', 'cat')).toBe('flower');
    expect(resolveMenuIcon('heart', 'photo')).toBe('heart');
  });
});
