import { useEffect, useRef } from 'react';

/**
 * Nút Back cứng của Android. Mỗi màn/bảng đang mở đăng ký một hàm "lùi lại" qua `useBackHandler`;
 * bấm Back thì gọi hàm ở lớp cao nhất (cùng lớp: hàm đăng ký sau cùng). Không còn hàm nào thì app thoát.
 * Lớp cố định thay vì chỉ dựa thứ tự đăng ký, vì effect của con chạy trước effect của cha.
 * Thêm màn con / bảng mới thì nhớ đăng ký, nếu không Back sẽ nhảy qua nó.
 */
export type BackLayer = 'tab' | 'screen' | 'form' | 'sheet';
const RANK: Record<BackLayer, number> = { tab: 0, screen: 1, form: 2, sheet: 3 };

interface Entry { layer: BackLayer; seq: number; run: () => void }
const entries = new Set<Entry>();
let seq = 0;

/** Xử lý một lần bấm Back; trả về false khi không còn gì để lùi (app nên thoát). */
export function handleBack(): boolean {
  let top: Entry | null = null;
  for (const e of entries) {
    if (!top || RANK[e.layer] > RANK[top.layer] || (RANK[e.layer] === RANK[top.layer] && e.seq > top.seq)) top = e;
  }
  top?.run();
  return top !== null;
}

export function useBackHandler(active: boolean, fn: () => void, layer: BackLayer): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (!active) return;
    const entry: Entry = { layer, seq: ++seq, run: () => fnRef.current() };
    entries.add(entry);
    return () => {
      entries.delete(entry);
    };
  }, [active, layer]);
}
