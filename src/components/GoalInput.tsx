import { useEffect, useRef, useState } from 'react';

/** Ô mục tiêu của một ngày: lưu khi rời ô (Enter cũng rời ô). */
export function GoalInput({ value, label, placeholder, onSave }: {
  value: string;
  label: string;
  placeholder: string;
  onSave: (goal: string) => void;
}) {
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
        placeholder={placeholder}
        aria-label={label}
        maxLength={60}
        enterKeyHint="done"
      />
    </form>
  );
}
