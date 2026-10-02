export function IconButton({
  label, icon, onClick, pressed, disabled, badge,
}: { label: string; icon: string; onClick: () => void; pressed?: boolean; disabled?: boolean; badge?: boolean }) {
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
      <span aria-hidden="true">{icon}</span>
      {badge && <span className="icon-btn__badge" aria-hidden="true" />}
    </button>
  );
}
