import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

export function ConfirmButton({ label, confirmLabel, onConfirm, className = 'btn btn--ghost' }: {
  label: string; confirmLabel: string; onConfirm: () => void; className?: string;
}) {
  const { t } = useI18n();
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return <button type="button" className={className} onClick={() => setAsking(true)}>{label}</button>;
  }
  return (
    <span className="confirm">
      <button type="button" className="btn btn--danger" onClick={() => { setAsking(false); onConfirm(); }}>{confirmLabel}</button>
      <button type="button" className="btn btn--ghost" onClick={() => setAsking(false)}>{t.common.cancel}</button>
    </span>
  );
}
