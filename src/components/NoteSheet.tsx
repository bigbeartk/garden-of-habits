import { useEffect, useState } from 'react';
import { BottomSheet } from './BottomSheet';

export function NoteSheet({ open, initial, onClose, onSave }: { open: boolean; initial: string; onClose: () => void; onSave: (note: string) => void }) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    if (open) setText(initial);
  }, [open, initial]);
  return (
    <BottomSheet open={open} title="Ghi chú hôm nay" onClose={onClose}>
      <textarea className="textarea" aria-label="Nội dung ghi chú" value={text} onChange={(e) => setText(e.target.value)} placeholder="Hôm nay thế nào nè?" />
      <button type="button" className="btn btn--primary sheet__save" onClick={() => onSave(text)}>Lưu</button>
    </BottomSheet>
  );
}
