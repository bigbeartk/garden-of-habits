import { useState, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';

/** `icon`: nút chỉ hiện icon, `label` thành tên đọc được (aria-label). */
export function ConfirmButton({ label, confirmLabel, onConfirm, className = 'btn btn--ghost', icon }: {
  label: string; confirmLabel: string; onConfirm: () => void; className?: string; icon?: ReactNode;
}) {
  const { t } = useI18n();
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className={className} aria-label={icon ? label : undefined} title={icon ? label : undefined} onClick={() => setAsking(true)}>
        {icon ?? label}
      </button>
    );
  }
  return (
    <span className="confirm">
      <button type="button" className="btn btn--danger" onClick={() => { setAsking(false); onConfirm(); }}>{confirmLabel}</button>
      <button type="button" className="btn btn--ghost" onClick={() => setAsking(false)}>{t.common.cancel}</button>
    </span>
  );
}
