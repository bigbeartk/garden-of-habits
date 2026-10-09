import { useEffect, useRef, useState } from 'react';

/**
 * Công tắc đọc từ DB nhưng đổi ngay trên giao diện khi bấm (optimistic).
 * Trong lúc còn lần lưu chưa xong, bỏ qua giá trị DB báo về: đó có thể là kết quả đọc cũ về muộn
 * (bấm nhanh hai lần trên máy bận thì công tắc từng nhảy ngược). Lưu xong hết thì lại theo DB, nên đổi
 * từ nơi khác (khôi phục sao lưu…) vẫn hiện đúng. Lưu lỗi: báo lỗi và quay về giá trị trong DB.
 */
export function useOptimisticToggle(stored: boolean, save: (v: boolean) => Promise<void>, onError: (e: Error) => void) {
  const [on, setOn] = useState(stored);
  const pending = useRef(0);
  const latestStored = useRef(stored);
  latestStored.current = stored;
  useEffect(() => {
    if (pending.current === 0) setOn(stored);
  }, [stored]);

  /** trả về giá trị mới (để gọi thêm hiệu ứng khi vừa bật) */
  function toggle(): boolean {
    const next = !on;
    setOn(next);
    pending.current += 1;
    save(next)
      .then(() => {
        pending.current -= 1;
      })
      .catch((e: Error) => {
        pending.current -= 1;
        if (pending.current === 0) setOn(latestStored.current);
        onError(e);
      });
    return next;
  }

  return { on, toggle };
}
