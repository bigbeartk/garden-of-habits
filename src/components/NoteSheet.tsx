import { useEffect, useRef, useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { SettingSwitch } from './SettingSwitch';

const AUTOSAVE_MS = 400;

// Ghi chú tự lưu: lưu sau khi ngừng gõ một chút, và lưu ngay khi đóng bảng.
export function NoteSheet({ open, initial, onClose, onSave }: { open: boolean; initial: string; onClose: () => void; onSave: (note: string) => void }) {
  const [text, setText] = useState(initial);
  const saved = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ text, onSave });
  latest.current = { text, onSave };
  const initialRef = useRef(initial);
  initialRef.current = initial;

  const flush = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const { text: t, onSave: save } = latest.current;
    if (t !== saved.current) {
      saved.current = t;
      save(t);
    }
  };

  // Chỉ nạp lại nội dung khi vừa mở bảng; không ghi đè chữ đang gõ khi DB cập nhật.
  useEffect(() => {
    if (open) {
      setText(initialRef.current);
      saved.current = initialRef.current;
    }
  }, [open]);

  useEffect(() => () => flush(), []);

  const change = (value: string) => {
    setText(value);
    latest.current = { ...latest.current, text: value };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, AUTOSAVE_MS);
  };

  const close = () => {
    flush();
    onClose();
  };

  return (
    <BottomSheet open={open} title="Ghi chú hôm nay" onClose={close}>
      <textarea className="textarea" aria-label="Nội dung ghi chú" value={text} onChange={(e) => change(e.target.value)} onBlur={flush} placeholder="Hôm nay thế nào nè?" />
      <SettingSwitch settingKey="plantSaysNote" label="Cây nói ghi chú" defaultOn={false} onError={() => {}} />
      <p className="sheet__hint">Ghi chú được tự động lưu</p>
    </BottomSheet>
  );
}
