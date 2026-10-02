import { useState } from 'react';

/** Nút × xoá một việc; bấm × hiện "Xoá / Thôi" ngay trên hàng, phải bấm Xoá mới xoá thật. */
export function DeleteWithConfirm({ text, onConfirm }: { text: string; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="todo__delete" aria-label={`Xoá: ${text}`} onClick={() => setAsking(true)}>×</button>
    );
  }
  return (
    <span className="todo__confirm">
      <button
        type="button"
        className="todo__confirm-yes"
        aria-label={`Xác nhận xoá: ${text}`}
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        Xoá
      </button>
      <button type="button" className="todo__confirm-no" onClick={() => setAsking(false)}>Thôi</button>
    </span>
  );
}
