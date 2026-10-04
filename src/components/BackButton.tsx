import { BackIcon } from './icons';

/** Nút quay lại (mặc định về Lịch): chỉ có mũi tên, không nền/viền. `inline` = nằm trong hàng tiêu đề thay vì nổi trên trời. */
export function BackButton({ onClick, inline, label = 'Quay lại Lịch' }: { onClick: () => void; inline?: boolean; label?: string }) {
  return (
    <button type="button" className={`back-btn${inline ? ' back-btn--inline' : ''}`} aria-label={label} onClick={onClick}>
      <BackIcon size={34} />
    </button>
  );
}
