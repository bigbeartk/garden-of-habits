import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBackHandler } from '../app/back';
import { useDeps } from '../app/deps';
import { useNav } from '../app/nav';
import { BackButton } from '../components/BackButton';
import { BackgroundPicker } from '../components/BackgroundPicker';
import { MenuIconPicker } from '../components/MenuIconPicker';
import { BottomSheet } from '../components/BottomSheet';
import { ConfirmButton } from '../components/ConfirmButton';
import { HelpIcon } from '../components/icons';
import { LanguagePicker } from '../components/LanguagePicker';
import { SettingSwitch } from '../components/SettingSwitch';
import { SupportCard } from '../components/SupportCard';
import {
  backupFileName, createBackup, parseBackup, restoreBackup, serializeBackup, type BackupFile, type RestoreMode,
} from '../db/backup';
import { getSetting, setSetting } from '../db/settings';
import { shareOrDownload } from '../db/share';
import { listTemplates } from '../domain/templateService';
import { isNative } from '../platform';
import { TemplatesScreen } from './TemplatesScreen';
import { useI18n } from '../i18n/I18nProvider';
import { dateTime, shortDateTime } from '../i18n/fmt';
import { errorText } from '../i18n/errors';
import { ResetDataSheet } from '../components/ResetDataSheet';
import './settings.css';

export function SettingsScreen() {
  const { t, lang, setLang } = useI18n();
  const deps = useDeps();
  const nav = useNav();
  const lastBackupAt = useLiveQuery(() => getSetting(deps.db, 'lastBackupAt'), [deps.db]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  /** bảng hướng dẫn cài app lên màn hình chính (mở từ nút dấu hỏi ở hàng tiêu đề) */
  const [showInstall, setShowInstall] = useState(false);
  /** đang mở màn Mẫu (nằm trong tab Cài đặt) */
  const [showTemplates, setShowTemplates] = useState(false);
  /** bảng xác nhận xoá toàn bộ dữ liệu */
  const [showReset, setShowReset] = useState(false);
  /** app Android: đã là app cài sẵn, không cần hướng dẫn "Thêm vào MH chính" */
  const native = isNative();
  const defaultTemplate = useLiveQuery(async () => (await listTemplates(deps.db)).find((t) => t.isDefault) ?? null, [deps.db]);

  useEffect(() => {
    if (native) return;
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, [native]);

  async function doBackup() {
    setError(null);
    setStatus(null);
    try {
      const now = deps.now();
      const name = backupFileName(now);
      const file = new File([serializeBackup(await createBackup(deps.db, now.getTime()))], name, { type: 'application/json' });
      await shareOrDownload(file);
      await setSetting(deps.db, 'lastBackupAt', now.getTime());
      setStatus(t.settings.backupCreated(name, native));
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(t.settings.backupFailed(errorText(e, t)));
    }
  }

  async function onRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setStatus(null);
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setPending(null);
      setError(t.backup.errors[result.code](result.path));
      return;
    }
    setError(null);
    setPending(result.backup);
  }

  async function doRestore(mode: RestoreMode) {
    if (!pending) return;
    try {
      const res = await restoreBackup(deps.db, pending, mode);
      setPending(null);
      // file mang ngôn ngữ khác: giao diện đổi theo ngay (không đợi lần mở app sau)
      const restored = await getSetting(deps.db, 'language');
      if (restored && restored !== lang) setLang(restored);
      setStatus(t.settings.restored(res.days, res.templates));
    } catch (e) {
      setError(t.settings.restoreFailed(errorText(e, t)));
    }
  }

  useBackHandler(showTemplates, () => setShowTemplates(false), 'screen');

  if (showTemplates) return <TemplatesScreen onBack={() => setShowTemplates(false)} />;

  return (
    <section className="screen screen--settings">
      <header className="tpl-page__head">
        <BackButton inline onClick={() => nav('calendar')} />
        <h1 className="screen__title">{t.settings.title}</h1>
        {!native && (
          <button
            type="button"
            className="icon-btn settings__help-btn"
            aria-label={t.settings.installGuide}
            title={t.settings.installGuide}
            onClick={() => setShowInstall(true)}
          >
            <HelpIcon size={26} />
            {/* dữ liệu chưa được lưu bền vững: nhắc nên cài app */}
            {persisted === false && <span className="icon-btn__badge" aria-hidden="true" />}
          </button>
        )}
      </header>
      {status && <p role="status" className="toast">{status}</p>}
      {error && <p role="alert" className="error">{error}</p>}

      <div className="card settings__section">
        <h2>{t.settings.templatesTitle}</h2>
        {defaultTemplate !== undefined && (
          <p className="muted">{defaultTemplate ? t.settings.templateInUse(defaultTemplate.name) : t.settings.templateNone}</p>
        )}
        <button type="button" className="btn btn--primary" onClick={() => setShowTemplates(true)}>{t.settings.manageTemplates}</button>
      </div>

      <div className="card settings__section">
        <h2>{t.settings.habitsTitle}</h2>
        <SettingSwitch settingKey="showHabitStrip" label={t.settings.showHabitStrip} onError={setError} />
      </div>

      <div className="card settings__section">
        <h2>{t.settings.calendarTitle}</h2>
        <div className="settings__pickers">
          <div className="settings__picker">
            <BackgroundPicker />
            <span className="settings__picker-label" aria-hidden="true">{t.settings.bgCaption}</span>
          </div>
          <div className="settings__picker">
            <MenuIconPicker />
            <span className="settings__picker-label" aria-hidden="true">{t.settings.menuIconCaption}</span>
          </div>
        </div>
        <SettingSwitch settingKey="showCalendarBgButton" label={t.settings.showBgButton} onError={setError} />
        <SettingSwitch settingKey="showNoteDot" label={t.settings.showNoteDot} onError={setError} />
      </div>

      <LanguagePicker />

      <div className="card settings__section">
        <h2>{t.settings.backupTitle}</h2>
        <p className="muted">
          {lastBackupAt ? t.settings.lastBackup(dateTime(lang, lastBackupAt)) : t.settings.neverBackedUp}
        </p>
        <button type="button" className="btn btn--primary" onClick={doBackup}>{t.settings.backupNow}</button>
        <label className="btn">
          {t.settings.restoreFromFile}
          <input type="file" accept="application/json,.json" hidden onChange={onRestoreFile} data-testid="restore-input" />
        </label>
        {pending && (
          <div className="settings__preview">
            <p>
              {t.settings.preview(dateTime(lang, pending.exportedAt), pending.days.length, pending.templates.length, !!pending.calendarBg)}
            </p>
            <div className="settings__row">
              <button type="button" className="btn btn--primary" onClick={() => doRestore('merge')}>{t.settings.merge}</button>
              <ConfirmButton
                label={t.settings.replace}
                confirmLabel={t.settings.replaceConfirm}
                className="btn"
                onConfirm={() => doRestore('replace')}
              />
              <button type="button" className="btn btn--ghost" onClick={() => setPending(null)}>{t.common.cancelForm}</button>
            </div>
          </div>
        )}
        <hr className="settings__divider" />
        <button type="button" className="btn btn--danger" onClick={() => setShowReset(true)}>{t.settings.reset.button}</button>
      </div>

      <ResetDataSheet
        open={showReset}
        onClose={() => setShowReset(false)}
        onBackup={doBackup}
        onDone={() => {
          setShowReset(false);
          nav('today');
        }}
      />

      <SupportCard />

      <BottomSheet open={showInstall && !native} title={t.install.title} onClose={() => setShowInstall(false)}>
        <ol className="settings__steps">
          {t.install.steps.map((parts, i) => (
            <li key={i}>{parts.map((p, j) => (typeof p === 'string' ? p : <b key={j}>{p[0]}</b>))}</li>
          ))}
        </ol>
        <p className="muted">
          {persisted === true && t.install.persisted}
          {persisted === false && t.install.notPersisted}
        </p>
      </BottomSheet>

      <p className="muted settings__version" data-testid="app-version">
        {t.settings.version} {__APP_VERSION__} · {shortDateTime(lang, new Date(__BUILD_TIME__).getTime())}
        {native && ' · Android'}
      </p>
    </section>
  );
}
