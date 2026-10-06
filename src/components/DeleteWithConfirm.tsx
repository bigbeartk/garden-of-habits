import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

/** Nút × xoá một việc; bấm × hiện "Xoá / Thôi" ngay trên hàng, phải bấm Xoá mới xoá thật. */
export function DeleteWithConfirm({ text, onConfirm }: { text: string; onConfirm: () => void }) {
  const { t } = useI18n();
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="todo__delete" aria-label={t.common.delete(text)} onClick={() => setAsking(true)}>×</button>
    );
  }
  return (
    <span className="todo__confirm">
      <button
        type="button"
        className="todo__confirm-yes"
        aria-label={t.common.confirmDelete(text)}
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {t.common.deleteShort}
      </button>
      <button type="button" className="todo__confirm-no" onClick={() => setAsking(false)}>{t.common.cancel}</button>
    </span>
  );
}
