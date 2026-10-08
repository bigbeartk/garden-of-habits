import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBackHandler } from '../app/back';
import { useDeps } from '../app/deps';
import { useNav } from '../app/nav';
import { BackButton } from '../components/BackButton';
import { ConfirmButton } from '../components/ConfirmButton';
import { TemplateForm } from '../components/TemplateForm';
import { WEEK_ORDER } from '../components/WeekdayPicker';
import { addTodos, ensureToday } from '../domain/dayService';
import { createTemplate, deleteTemplate, listTemplates, setDefaultTemplate, updateTemplate } from '../domain/templateService';
import { PERIODS } from '../domain/period';
import { CalendarIcon, PeriodIcon, StarIcon } from '../components/icons';
import type { Template } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';
import './templates.css';

/** Màn Mẫu, mở từ thẻ "Mẫu việc" trong Cài đặt; `onBack` quay về Cài đặt. */
export function TemplatesScreen({ onBack }: { onBack: () => void }) {
  const i18n = useI18n();
  const deps = useDeps();
  const nav = useNav();
  const templates = useLiveQuery(() => listTemplates(deps.db), [deps.db]) ?? [];
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  useBackHandler(editing !== null, () => setEditing(null), 'form');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nowMs = () => deps.now().getTime();

  async function applyToToday(t: Template) {
    try {
      const day = await ensureToday(deps);
      await addTodos(deps, day.date, t.items);
      setMessage(i18n.t.templates.added(t.items.length));
    } catch (e) {
      setError(errorText(e, i18n.t));
    }
  }

  return (
    <section className="screen screen--templates">
      <header className="tpl-page__head">
        <BackButton inline label={i18n.t.nav.backToSettings} onClick={onBack} />
        <h1 className="screen__title">{i18n.t.templates.title}</h1>
      </header>
      <p className="muted tpl-page__hint">
        {i18n.t.templates.hintBefore} <span className="tpl-page__hint-star"><StarIcon size={18} filled /></span> {i18n.t.templates.hintAfter}
      </p>
      {editing !== 'new' && (
        <button type="button" className="tpl-new" onClick={() => setEditing('new')}>{i18n.t.templates.newTemplate}</button>
      )}
      {message && (
        <p role="status" className="toast">
          {message} <button type="button" className="link" onClick={() => nav('today')}>{i18n.t.templates.view}</button>
        </p>
      )}
      {error && <p role="alert" className="error">{error}</p>}
      {editing === 'new' && (
        <TemplateForm
          onCancel={() => setEditing(null)}
          onSave={async (name, items, weekdays) => {
            await createTemplate(deps.db, name, items, nowMs(), weekdays);
            setEditing(null);
          }}
        />
      )}
      {templates.length === 0 && editing !== 'new' && (
        <p className="empty card">{i18n.t.templates.empty}</p>
      )}
      <ul className="tpl__list">
        {templates.map((t) => (
          <li key={t.id} className={`card tpl${t.isDefault ? ' is-default' : ''}`}>
            {editing === t.id ? (
              <TemplateForm
                initialName={t.name}
                initialItems={t.items}
                initialWeekdays={t.weekdays}
                onCancel={() => setEditing(null)}
                onSave={async (name, items, weekdays) => {
                  await updateTemplate(deps.db, t.id, { name, items, weekdays }, nowMs());
                  setEditing(null);
                }}
              />
            ) : (
              <>
                <div className="tpl__head">
                  <h2 className="tpl__name">{t.name}</h2>
                  <button
                    type="button"
                    className={`tpl__star${t.isDefault ? ' is-on' : ''}`}
                    aria-pressed={t.isDefault}
                    aria-label={t.isDefault ? i18n.t.templates.unsetDefault(t.name) : i18n.t.templates.setDefault(t.name)}
                    onClick={() => setDefaultTemplate(deps.db, t.isDefault ? null : t.id, nowMs())}
                  >
                    <StarIcon size={22} filled={t.isDefault} />
                    <span>{t.isDefault ? i18n.t.templates.isDefault : i18n.t.templates.makeDefault}</span>
                  </button>
                </div>
                {(t.weekdays?.length ?? 0) > 0 && (
                  <p className="tpl__days" data-testid="tpl-weekdays">
                    <CalendarIcon size={20} />
                    <span>{i18n.t.templates.autoDays(WEEK_ORDER.filter((d) => t.weekdays!.includes(d)).map((d) => i18n.t.templateForm.dayShort[d]).join(' · '))}</span>
                  </p>
                )}
                <div className="tpl__periods">
                  {PERIODS.filter((p) => t.items.some((i) => i.period === p)).map((p) => {
                    const items = t.items.filter((i) => i.period === p);
                    return (
                      <div key={p} className={`tpl__period todo__section--${p}`}>
                        <h3 className="tpl__period-title">
                          <PeriodIcon period={p} size={24} />
                          <span>{i18n.t.period[p]}</span>
                          <span className="tpl__period-count">{items.length}</span>
                        </h3>
                        <ul className="tpl__items">
                          {items.map((item, i) => <li key={i}>{item.text}</li>)}
                        </ul>
                      </div>
                    );
                  })}
                  {t.items.length === 0 && <p className="muted tpl__empty">{i18n.t.templates.noItems}</p>}
                </div>
                <div className="tpl__actions">
                  <button type="button" className="btn btn--primary tpl__apply" onClick={() => applyToToday(t)}>{i18n.t.templates.addToToday}</button>
                  <button type="button" className="tpl__mini" onClick={() => setEditing(t.id)}>{i18n.t.templates.edit}</button>
                  <ConfirmButton label={i18n.t.templates.delete} confirmLabel={i18n.t.templates.deleteConfirm} className="tpl__mini" onConfirm={() => deleteTemplate(deps.db, t.id)} />
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
