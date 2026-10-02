import { BackIcon } from './icons';

/** Nút quay lại Lịch: chỉ có mũi tên, không nền/viền. `inline` = nằm trong hàng tiêu đề thay vì nổi trên trời. */
export function BackButton({ onClick, inline }: { onClick: () => void; inline?: boolean }) {
  return (
    <button type="button" className={`back-btn${inline ? ' back-btn--inline' : ''}`} aria-label="Quay lại Lịch" onClick={onClick}>
      <BackIcon size={34} />
    </button>
  );
}
