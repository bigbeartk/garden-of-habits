import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { handleBack, useBackHandler } from '../../../src/app/back';

describe('nút Back (ngăn xếp xử lý)', () => {
  it('không có ai đăng ký thì báo chưa xử lý (app sẽ thoát)', () => {
    expect(handleBack()).toBe(false);
  });

  it('lớp cao hơn thắng dù đăng ký trước (bảng > form > màn con > tab)', () => {
    const sheet = vi.fn();
    const tab = vi.fn();
    const a = renderHook(() => useBackHandler(true, sheet, 'sheet'));
    const b = renderHook(() => useBackHandler(true, tab, 'tab'));
    expect(handleBack()).toBe(true);
    expect(sheet).toHaveBeenCalledTimes(1);
    expect(tab).not.toHaveBeenCalled();
    a.unmount();
    handleBack();
    expect(tab).toHaveBeenCalledTimes(1);
    b.unmount();
  });

  it('cùng lớp thì cái đăng ký sau thắng; tắt active thì rút khỏi ngăn xếp', () => {
    const first = vi.fn();
    const second = vi.fn();
    const a = renderHook(() => useBackHandler(true, first, 'screen'));
    const b = renderHook(({ on }) => useBackHandler(on, second, 'screen'), { initialProps: { on: true } });
    handleBack();
    expect(second).toHaveBeenCalledTimes(1);
    b.rerender({ on: false });
    handleBack();
    expect(first).toHaveBeenCalledTimes(1);
    a.unmount();
    b.unmount();
    expect(handleBack()).toBe(false);
  });

  it('luôn gọi hàm mới nhất (không giữ closure cũ)', () => {
    const v1 = vi.fn();
    const v2 = vi.fn();
    const h = renderHook(({ fn }) => useBackHandler(true, fn, 'screen'), { initialProps: { fn: v1 } });
    h.rerender({ fn: v2 });
    handleBack();
    expect(v1).not.toHaveBeenCalled();
    expect(v2).toHaveBeenCalledTimes(1);
    h.unmount();
  });
});
