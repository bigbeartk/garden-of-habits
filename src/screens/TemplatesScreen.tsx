import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { useNav } from '../app/nav';
import { ConfirmButton } from '../components/ConfirmButton';
import { TemplateForm } from '../components/TemplateForm';
import { addTodos, ensureToday } from '../domain/dayService';
import { createTemplate, deleteTemplate, listTemplates, setDefaultTemplate, updateTemplate } from '../domain/templateService';
import type { Template } from '../domain/types';
import './templates.css';

export function TemplatesScreen() {
  const deps = useDeps();
  const nav = useNav();
  const templates = useLiveQuery(() => listTemplates(deps.db), [deps.db]) ?? [];
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nowMs = () => deps.now().getTime();

  async function applyToToday(t: Template) {
    try {
      const day = await ensureToday(deps);
      await addTodos(deps, day.date, t.items);
      setMessage(`Đã thêm ${t.items.length} việc vào hôm nay 🌱`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="screen screen--templates">
      <header className="screen__head">
        <h1 className="screen__title">Mẫu việc cần làm</h1>
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>＋ Mẫu mới</button>
      </header>
      <p className="muted">Mẫu có ⭐ sẽ tự động lên danh sách mỗi sáng (từ 4 giờ).</p>
      {message && (
        <p role="status" className="toast">
          {message} <button type="button" className="link" onClick={() => nav('today')}>Xem</button>
        </p>
      )}
      {error && <p role="alert" className="error">{error}</p>}
      {editing === 'new' && (
        <TemplateForm
          onCancel={() => setEditing(null)}
          onSave={async (name, items) => {
            await createTemplate(deps.db, name, items, nowMs());
            setEditing(null);
          }}
        />
      )}
      {templates.length === 0 && editing !== 'new' && (
        <p className="empty card">Chưa có mẫu nào. Tạo một mẫu cho buổi sáng nhé ☀️</p>
      )}
      <ul className="tpl__list">
        {templates.map((t) => (
          <li key={t.id} className="card tpl">
            {editing === t.id ? (
              <TemplateForm
                initialName={t.name}
                initialItems={t.items}
                onCancel={() => setEditing(null)}
                onSave={async (name, items) => {
                  await updateTemplate(deps.db, t.id, { name, items }, nowMs());
                  setEditing(null);
                }}
              />
            ) : (
              <>
                <div className="tpl__head">
                  <button
                    type="button"
                    className={`tpl__star${t.isDefault ? ' is-on' : ''}`}
                    aria-pressed={t.isDefault}
                    aria-label={t.isDefault ? `Bỏ mặc định: ${t.name}` : `Đặt làm mặc định: ${t.name}`}
                    onClick={() => setDefaultTemplate(deps.db, t.isDefault ? null : t.id, nowMs())}
                  >
                    {t.isDefault ? '⭐' : '☆'}
                  </button>
                  <h2 className="tpl__name">{t.name}</h2>
                </div>
                <ul className="tpl__items">
                  {t.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
                <div className="tpl__actions">
                  <button type="button" className="btn" onClick={() => applyToToday(t)}>Thêm vào hôm nay</button>
                  <button type="button" className="btn btn--ghost" onClick={() => setEditing(t.id)}>Sửa</button>
                  <ConfirmButton label="Xoá" confirmLabel="Chắc chắn xoá" onConfirm={() => deleteTemplate(deps.db, t.id)} />
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
