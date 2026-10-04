import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { PERIOD_LABEL, type Period } from '../domain/period';
import { PlusIcon } from './icons';

/**
 * Nút ＋ ở cuối hàng tiêu đề của một buổi: mở dòng việc trống trong buổi đó.
 * - `flushSync`: ô nhập được gắn và focus ngay trong cú chạm (Safari iOS chỉ bật bàn phím khi focus nằm trong cử chỉ người dùng).
 * - chặn `mousedown`: nút không cướp focus của dòng trống đang gõ, nếu không dòng đó đóng lại,
 *   danh sách dịch lên và cú chạm trượt khỏi nút.
 */
export function SectionAddButton({ period, onClick }: { period: Period; onClick: () => void }) {
  return (
    <button
      type="button"
      className="todo__section-add"
      aria-label={`Thêm việc buổi ${PERIOD_LABEL[period]}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => flushSync(onClick)}
    >
      <PlusIcon size={22} />
    </button>
  );
}

/**
 * Dòng việc trống để gõ ngay trong buổi. Enter: lưu rồi để trống cho việc tiếp theo.
 * Rời ô hoặc bị thay bằng dòng trống của buổi khác: lưu nếu đã gõ chữ. Escape: đóng, không lưu.
 * Việc rỗng không bao giờ được lưu. `onDone` báo dòng này muốn đóng; danh sách chỉ đóng nếu
 * dòng đang mở vẫn là của buổi này (Safari gọi blur dòng cũ sau khi dòng mới đã mở).
 */
export function DraftRow({ period, onAdd, onDone }: { period: Period; onAdd: (text: string) => void; onDone: () => void }) {
  const [text, setText] = useState('');
  const latest = useRef({ text: '', onAdd, cancelled: false });
  latest.current.onAdd = onAdd;
  const change = (value: string) => {
    latest.current.text = value;
    setText(value);
  };
  const save = () => {
    const clean = latest.current.text.trim();
    if (clean && !latest.current.cancelled) latest.current.onAdd(clean);
    change('');
    return clean !== '';
  };
  // bị gỡ khi chưa kịp blur (chuyển sang buổi khác): vẫn lưu chữ đã gõ
  useEffect(() => () => {
    const { text: t, cancelled, onAdd: add } = latest.current;
    if (!cancelled && t.trim()) add(t.trim());
  }, []);
  return (
    <li className="todo__row todo__row--draft">
      <span className="todo__bullet" aria-hidden="true" />
      <form className="todo__edit" onSubmit={(e) => { e.preventDefault(); if (!save()) onDone(); }}>
        <input
          className="input"
          autoFocus
          value={text}
          onChange={(e) => change(e.target.value)}
          onBlur={() => { save(); onDone(); }}
          onKeyDown={(e) => { if (e.key === 'Escape') { latest.current.cancelled = true; e.currentTarget.blur(); } }}
          placeholder="Việc cần làm…"
          aria-label={`Việc mới buổi ${PERIOD_LABEL[period]}`}
          maxLength={200}
          enterKeyHint="next"
        />
      </form>
    </li>
  );
}
