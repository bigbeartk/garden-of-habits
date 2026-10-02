import type { ReactNode } from 'react';

export function IconButton({
  label, icon, onClick, pressed, disabled, badge,
}: { label: string; icon: ReactNode; onClick: () => void; pressed?: boolean; disabled?: boolean; badge?: boolean }) {
  return (
    <button
      type="button"
      className={`icon-btn${pressed ? ' is-pressed' : ''}`}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      {badge && <span className="icon-btn__badge" aria-hidden="true" />}
    </button>
  );
}
