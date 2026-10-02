import { useState } from 'react';

export function ConfirmButton({ label, confirmLabel, onConfirm, className = 'btn btn--ghost' }: {
  label: string; confirmLabel: string; onConfirm: () => void; className?: string;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return <button type="button" className={className} onClick={() => setAsking(true)}>{label}</button>;
  }
  return (
    <span className="confirm">
      <button type="button" className="btn btn--danger" onClick={() => { setAsking(false); onConfirm(); }}>{confirmLabel}</button>
      <button type="button" className="btn btn--ghost" onClick={() => setAsking(false)}>Thôi</button>
    </span>
  );
}
