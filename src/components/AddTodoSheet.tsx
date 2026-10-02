import { useEffect, useRef, useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { PERIODS, PERIOD_ICON, PERIOD_LABEL, type Period } from '../domain/period';

/**
 * Popup thêm việc: chọn buổi, thêm xong vẫn mở và xoá ô nhập để thêm liên tiếp
 * (giữ buổi đã chọn); đóng bằng nút Đóng. Mỗi lần mở, buổi trở về buổi hiện tại.
 */
export function AddTodoSheet({ open, defaultPeriod, onClose, onAdd }: {
  open: boolean;
  defaultPeriod: Period;
  onClose: () => void;
  onAdd: (text: string, period: Period) => void;
}) {
  const [draft, setDraft] = useState('');
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) setPeriod(defaultPeriod);
  }, [open, defaultPeriod]);

  return (
    <BottomSheet open={open} title="Thêm việc cần làm" onClose={onClose}>
      <div className="period-picker" role="radiogroup" aria-label="Buổi">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={p === period}
            className={`period-picker__item${p === period ? ' is-selected' : ''}`}
            onClick={() => setPeriod(p)}
          >
            <span aria-hidden="true">{PERIOD_ICON[p]}</span> {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>
      <form
        className="todo__add"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (text) onAdd(text, period);
          setDraft('');
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Việc cần làm…"
          aria-label="Nội dung việc"
          maxLength={200}
          enterKeyHint="send"
          autoFocus
        />
        <button className="btn btn--primary" type="submit">Thêm</button>
      </form>
    </BottomSheet>
  );
}
