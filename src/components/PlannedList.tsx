import { useState } from 'react';
import { PERIODS, PERIOD_ICON, PERIOD_LABEL } from '../domain/period';
import type { PlannedTodo } from '../domain/types';
import './todo.css';

/** Danh sách việc đã lên lịch cho một ngày tương lai, chia 3 buổi; sửa/xoá được, không có ô tick. */
export function PlannedList({ items, onEdit, onDelete }: {
  items: PlannedTodo[];
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="todo">
      {items.length === 0 && <p className="todo__hint muted">Bấm ＋ để lên lịch việc cho ngày này 🌱</p>}
      {PERIODS.map((p) => {
        const group = items.filter((t) => t.period === p);
        return (
          <section key={p} className={`todo__section todo__section--${p}`} data-testid={`todo-section-${p}`}>
            <header className="todo__section-head">
              <h2 className="todo__section-title">
                <span aria-hidden="true">{PERIOD_ICON[p]}</span> {PERIOD_LABEL[p]}
              </h2>
              {group.length > 0 && <span className="todo__section-count">{group.length}</span>}
            </header>
            {group.length === 0 ? (
              <p className="todo__empty muted">Chưa có việc</p>
            ) : (
              <ul className="todo__list">
                {group.map((t) => <PlannedRow key={t.id} item={t} onEdit={onEdit} onDelete={onDelete} />)}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function PlannedRow({ item, onEdit, onDelete }: { item: PlannedTodo; onEdit: (id: string, text: string) => void; onDelete: (id: string) => void }) {
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
          <input className="input" autoFocus value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} aria-label="Sửa việc" maxLength={200} />
        </form>
      ) : (
        <span className="todo__text" onClick={() => { setText(item.text); setEditing(true); }}>{item.text}</span>
      )}
      <button type="button" className="todo__delete" aria-label={`Xoá: ${item.text}`} onClick={() => onDelete(item.id)}>×</button>
    </li>
  );
}
