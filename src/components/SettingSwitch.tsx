import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { getSetting, setSetting, type BooleanSetting } from '../db/settings';
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
  const [on, setOn] = useState(stored);
  useEffect(() => setOn(stored), [stored]);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`switch-row${on ? ' is-on' : ''}`}
      onClick={() => {
        const next = !on;
        setOn(next);
        setSetting(deps.db, settingKey, next).catch((e: Error) => onError(errorText(e, t)));
      }}
    >
      <span className="switch-row__text">{label}</span>
      <span className="switch" aria-hidden="true"><span className="switch__knob" /></span>
    </button>
  );
}
