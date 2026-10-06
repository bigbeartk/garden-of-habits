import { BackIcon } from './icons';
import { useI18n } from '../i18n/I18nProvider';

/** Nút quay lại (mặc định về Lịch): chỉ có mũi tên, không nền/viền. `inline` = nằm trong hàng tiêu đề thay vì nổi trên trời. */
export function BackButton({ onClick, inline, label: custom }: { onClick: () => void; inline?: boolean; label?: string }) {
  const { t } = useI18n();
  const label = custom ?? t.nav.backToCalendar;
  return (
    <button type="button" className={`back-btn${inline ? ' back-btn--inline' : ''}`} aria-label={label} onClick={onClick}>
      <BackIcon size={34} />
    </button>
  );
}
