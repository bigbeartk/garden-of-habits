import { useEffect, useRef, useState } from 'react';

/** Ô tiêu đề của ngày hôm nay: lưu khi rời ô (Enter cũng rời ô). */
export function DayTitleInput({ value, onSave }: { value: string; onSave: (title: string) => void }) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setDraft(value), [value]);
  return (
    <form
      className="day-title"
      onSubmit={(e) => {
        e.preventDefault();
        inputRef.current?.blur();
      }}
    >
      <input
        ref={inputRef}
        className="input day-title__input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft.trim() !== value) onSave(draft);
        }}
        placeholder="Đặt tiêu đề cho hôm nay…"
        aria-label="Tiêu đề hôm nay"
        maxLength={60}
        enterKeyHint="done"
      />
    </form>
  );
}
