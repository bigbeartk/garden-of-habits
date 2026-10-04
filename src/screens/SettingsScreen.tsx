import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { useNav } from '../app/nav';
import { BackButton } from '../components/BackButton';
import { BackgroundPicker } from '../components/BackgroundPicker';
import { BottomSheet } from '../components/BottomSheet';
import { ConfirmButton } from '../components/ConfirmButton';
import { HelpIcon } from '../components/icons';
import { SettingSwitch } from '../components/SettingSwitch';
import { SupportCard } from '../components/SupportCard';
import {
  backupFileName, createBackup, parseBackup, restoreBackup, serializeBackup, type BackupFile, type RestoreMode,
} from '../db/backup';
import { getSetting, setSetting } from '../db/settings';
import { shareOrDownload } from '../db/share';
import { listTemplates } from '../domain/templateService';
import { TemplatesScreen } from './TemplatesScreen';
import './settings.css';

const formatDateTime = (ms: number) =>
  new Date(ms).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function SettingsScreen() {
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
  const defaultTemplate = useLiveQuery(async () => (await listTemplates(deps.db)).find((t) => t.isDefault) ?? null, [deps.db]);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

  async function doBackup() {
    setError(null);
    setStatus(null);
    try {
      const now = deps.now();
      const name = backupFileName(now);
      const file = new File([serializeBackup(await createBackup(deps.db, now.getTime()))], name, { type: 'application/json' });
      await shareOrDownload(file);
      await setSetting(deps.db, 'lastBackupAt', now.getTime());
      setStatus(`Đã tạo file ${name} ✓ Nhớ lưu vào Tệp hoặc iCloud Drive nhé.`);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(`Không sao lưu được: ${(e as Error).message}`);
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
      setError(result.error);
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
      setStatus(`Đã khôi phục ${res.days} ngày và ${res.templates} mẫu ✓`);
    } catch (e) {
      setError(`Khôi phục thất bại, dữ liệu hiện tại vẫn được giữ nguyên. ${(e as Error).message}`);
    }
  }

  if (showTemplates) return <TemplatesScreen onBack={() => setShowTemplates(false)} />;

  return (
    <section className="screen screen--settings">
      <header className="tpl-page__head">
        <BackButton inline onClick={() => nav('calendar')} />
        <h1 className="screen__title">Cài đặt</h1>
        <button
          type="button"
          className="icon-btn settings__help-btn"
          aria-label="Hướng dẫn cài app"
          title="Hướng dẫn cài app"
          onClick={() => setShowInstall(true)}
        >
          <HelpIcon size={26} />
          {/* dữ liệu chưa được lưu bền vững: nhắc nên cài app */}
          {persisted === false && <span className="icon-btn__badge" aria-hidden="true" />}
        </button>
      </header>
      {status && <p role="status" className="toast">{status}</p>}
      {error && <p role="alert" className="error">{error}</p>}

      <div className="card settings__section">
        <h2>Mẫu việc</h2>
        {defaultTemplate !== undefined && (
          <p className="muted">{defaultTemplate ? `⭐ Đang dùng: ${defaultTemplate.name}` : 'Chưa có mẫu mặc định'}</p>
        )}
        <button type="button" className="btn btn--primary" onClick={() => setShowTemplates(true)}>Quản lý mẫu</button>
      </div>

      <div className="card settings__section">
        <h2>Lịch</h2>
        <BackgroundPicker />
        <SettingSwitch settingKey="showCalendarBgButton" label="Hiện nút đổi hình nền ở trang Lịch" onError={setError} />
        <SettingSwitch settingKey="showNoteDot" label="Hiện chấm đỏ ở ngày có ghi chú" onError={setError} />
      </div>

      <div className="card settings__section">
        <h2>Sao lưu & khôi phục</h2>
        <p className="muted">
          {lastBackupAt ? `Lần sao lưu gần nhất: ${formatDateTime(lastBackupAt)}` : 'Bạn chưa sao lưu lần nào.'}
        </p>
        <button type="button" className="btn btn--primary" onClick={doBackup}>💾 Sao lưu dữ liệu</button>
        <label className="btn">
          📂 Khôi phục từ file
          <input type="file" accept="application/json,.json" hidden onChange={onRestoreFile} data-testid="restore-input" />
        </label>
        {pending && (
          <div className="settings__preview">
            <p>
              File sao lưu ngày {formatDateTime(pending.exportedAt)}: {pending.days.length} ngày · {pending.templates.length} mẫu
              {pending.calendarBg ? ' · có ảnh nền' : ''}
            </p>
            <div className="settings__row">
              <button type="button" className="btn btn--primary" onClick={() => doRestore('merge')}>Gộp với dữ liệu hiện tại</button>
              <ConfirmButton
                label="Thay thế toàn bộ"
                confirmLabel="Chắc chắn thay thế"
                className="btn"
                onConfirm={() => doRestore('replace')}
              />
              <button type="button" className="btn btn--ghost" onClick={() => setPending(null)}>Huỷ</button>
            </div>
          </div>
        )}
      </div>

      <SupportCard />

      <BottomSheet open={showInstall} title="Cài app lên màn hình chính" onClose={() => setShowInstall(false)}>
        <ol className="settings__steps">
          <li>Mở trang này bằng <b>Safari</b> trên iPhone.</li>
          <li>Bấm nút <b>Chia sẻ</b> (ô vuông có mũi tên lên).</li>
          <li>Chọn <b>Thêm vào MH chính</b> → <b>Thêm</b>.</li>
          <li>Từ giờ mở app bằng biểu tượng chậu cây — dùng được cả khi không có mạng.</li>
        </ol>
        <p className="muted">
          {persisted === true && 'Dữ liệu đang được lưu bền vững trên máy 🌱'}
          {persisted === false && 'Hãy cài app lên màn hình chính để dữ liệu không bị Safari tự xoá.'}
        </p>
      </BottomSheet>

      <p className="muted settings__version" data-testid="app-version">
        Phiên bản {__APP_VERSION__} · {new Date(__BUILD_TIME__).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
      </p>
    </section>
  );
}
