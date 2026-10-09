import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { getSetting, setSetting, type BooleanSetting } from '../db/settings';
import { useOptimisticToggle } from '../hooks/useOptimisticToggle';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';

/** Công tắc bật/tắt một setting kiểu boolean; chưa lưu thì lấy `defaultOn`. */
export function SettingSwitch({ settingKey, label, defaultOn = true, onError }: {
  settingKey: BooleanSetting;
  label: string;
  defaultOn?: boolean;
  onError: (msg: string) => void;
}) {
  const { t } = useI18n();
  const deps = useDeps();
  const stored = useLiveQuery(async () => (await getSetting(deps.db, settingKey)) ?? defaultOn, [deps.db, settingKey, defaultOn], defaultOn);
  // giữ trạng thái ngay trên giao diện để bấm nhanh liên tiếp vẫn đổi đúng
  const { on, toggle } = useOptimisticToggle(stored, (v) => setSetting(deps.db, settingKey, v), (e) => onError(errorText(e, t)));
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`switch-row${on ? ' is-on' : ''}`}
      onClick={toggle}
    >
      <span className="switch-row__text">{label}</span>
      <span className="switch" aria-hidden="true"><span className="switch__knob" /></span>
    </button>
  );
}
