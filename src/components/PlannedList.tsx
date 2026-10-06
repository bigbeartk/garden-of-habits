import { useState } from 'react';
import { DeleteWithConfirm } from './DeleteWithConfirm';
import { DraftRow, SectionAddButton } from './InlineAdd';
import { PERIODS, type Period } from '../domain/period';
import { PeriodIcon } from './icons';
import type { PlannedTodo } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import './todo.css';

/** Danh sách việc đã lên lịch cho một ngày tương lai, chia 3 buổi; sửa/xoá được, không có ô tick. */
export function PlannedList({ items, onEdit, onDelete, onAdd }: {
  items: PlannedTodo[];
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onAdd: (text: string, period: Period) => void;
}) {
  const { t } = useI18n();
  /** buổi đang có dòng việc trống để gõ */
  const [draft, setDraft] = useState<Period | null>(null);
  return (
    <div className="todo">
      {items.length === 0 && <p className="todo__hint muted">{t.todo.plannedHint}</p>}
      {PERIODS.map((p) => {
        const group = items.filter((t) => t.period === p);
        return (
          <section key={p} className={`todo__section todo__section--${p}`} data-testid={`todo-section-${p}`}>
            <header className="todo__section-head">
              <h2 className="todo__section-title">
                <PeriodIcon period={p} /> {t.period[p]}
              </h2>
              {group.length > 0 && <span className="todo__section-count">{group.length}</span>}
              <SectionAddButton period={p} onClick={() => setDraft(p)} />
            </header>
            {group.length === 0 && draft !== p ? (
              <p className="todo__empty muted">{t.common.noTasks}</p>
            ) : (
              <ul className="todo__list">
                {group.map((t) => <PlannedRow key={t.id} item={t} onEdit={onEdit} onDelete={onDelete} />)}
                {draft === p && <DraftRow period={p} onAdd={(text) => onAdd(text, p)} onDone={() => setDraft((d) => (d === p ? null : d))} />}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function PlannedRow({ item, onEdit, onDelete }: { item: PlannedTodo; onEdit: (id: string, text: string) => void; onDelete: (id: string) => void }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const commit = () => {
    const clean = text.trim();
    if (clean && clean !== item.text) onEdit(item.id, clean);
    setEditing(false);
  };
  return (
    <li className="todo__row todo__row--planned">
      <span className="todo__bullet" aria-hidden="true" />
      {editing ? (
        <form className="todo__edit" onSubmit={(e) => { e.preventDefault(); commit(); }}>
          <input className="input" autoFocus value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} aria-label={t.common.editTask} maxLength={200} />
        </form>
      ) : (
        <span className="todo__text" onClick={() => { setText(item.text); setEditing(true); }}>{item.text}</span>
      )}
      <DeleteWithConfirm text={item.text} onConfirm={() => onDelete(item.id)} />
    </li>
  );
}
