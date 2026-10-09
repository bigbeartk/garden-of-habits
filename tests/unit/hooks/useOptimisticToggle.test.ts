import { vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useOptimisticToggle } from '../../../src/hooks/useOptimisticToggle';

function deferred() {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe('useOptimisticToggle', () => {
  it('bấm nhanh hai lần: giá trị DB cũ về muộn (lúc còn đang lưu) không làm công tắc nhảy ngược', async () => {
    const saves: ReturnType<typeof deferred>[] = [];
    const save = (_v: boolean) => { const d = deferred(); saves.push(d); return d.promise; };
    const { result, rerender } = renderHook(({ stored }) => useOptimisticToggle(stored, save, () => {}), { initialProps: { stored: true } });
    act(() => result.current.toggle()); // → false
    act(() => result.current.toggle()); // → true
    expect(result.current.on).toBe(true);
    rerender({ stored: false }); // kết quả đọc sau lần lưu thứ nhất về muộn
    expect(result.current.on).toBe(true);
    await act(async () => { saves[0].resolve(); saves[1].resolve(); await Promise.resolve(); });
    rerender({ stored: true });
    expect(result.current.on).toBe(true);
  });

  it('không đang lưu thì theo giá trị DB (đổi từ nơi khác)', () => {
    const { result, rerender } = renderHook(({ stored }) => useOptimisticToggle(stored, async () => {}, () => {}), { initialProps: { stored: true } });
    rerender({ stored: false });
    expect(result.current.on).toBe(false);
  });

  it('lưu lỗi thì báo lỗi và quay về giá trị trong DB', async () => {
    const d = deferred();
    const onError = vi.fn();
    const { result } = renderHook(() => useOptimisticToggle(true, () => d.promise, onError));
    act(() => result.current.toggle());
    expect(result.current.on).toBe(false);
    await act(async () => { d.reject(new Error('hỏng')); await d.promise.catch(() => {}); await Promise.resolve(); });
    expect(onError).toHaveBeenCalled();
    expect(result.current.on).toBe(true);
  });
});
