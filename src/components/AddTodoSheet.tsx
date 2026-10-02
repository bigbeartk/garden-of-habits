import { useRef, useState } from 'react';
import { BottomSheet } from './BottomSheet';

/** Popup thêm việc: thêm xong vẫn mở và xoá ô nhập để thêm liên tiếp; đóng bằng nút Đóng. */
export function AddTodoSheet({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (text: string) => void }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <BottomSheet open={open} title="Thêm việc cần làm" onClose={onClose}>
      <form
        className="todo__add"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (text) onAdd(text);
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
