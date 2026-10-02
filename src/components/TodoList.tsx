import { useEffect, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { PERIODS, PERIOD_LABEL, type Period } from '../domain/period';
import { PeriodIcon } from './icons';
import type { Todo } from '../domain/types';
import './todo.css';

export interface TodoListProps {
  todos: Todo[];
  /** buổi hiện tại, được làm nổi bật */
  currentPeriod: Period;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  /** thứ tự mới của các việc trong một buổi */
  onReorder: (ids: string[]) => void;
}

export function TodoList({ todos, currentPeriod, onToggle, onEdit, onDelete, onReorder }: TodoListProps) {
  const [items, setItems] = useState(todos);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => setItems(todos), [todos]);

  return (
    <div className="todo">
      {items.length === 0 && <p className="todo__hint muted">Bấm ＋ để thêm việc và tưới cây nhé 💧</p>}
      {PERIODS.map((p) => {
        const group = items.filter((t) => t.period === p);
        const done = group.filter((t) => t.done).length;
        return (
          <section
            key={p}
            className={`todo__section todo__section--${p}${p === currentPeriod ? ' is-current' : ''}`}
            data-testid={`todo-section-${p}`}
          >
            <header className="todo__section-head">
              <h2 className="todo__section-title">
                <PeriodIcon period={p} /> {PERIOD_LABEL[p]}
              </h2>
              {group.length > 0 && <span className="todo__section-count">{done}/{group.length}</span>}
            </header>
            {group.length === 0 ? (
              <p className="todo__empty muted">Chưa có việc</p>
            ) : (
              <Reorder.Group
                axis="y"
                values={group}
                onReorder={(next: Todo[]) => setItems((prev) => [...prev.filter((t) => t.period !== p), ...next])}
                className="todo__list"
                as="ul"
              >
                {group.map((t) => (
                  <TodoRow
                    key={t.id}
                    todo={t}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDragEnd={() => onReorder(itemsRef.current.filter((x) => x.period === p).map((x) => x.id))}
                  />
                ))}
              </Reorder.Group>
            )}
          </section>
        );
      })}
    </div>
  );
}

function TodoRow({
  todo, onToggle, onEdit, onDelete, onDragEnd,
}: { todo: Todo; onToggle: (id: string) => void; onEdit: (id: string, text: string) => void; onDelete: (id: string) => void; onDragEnd: () => void }) {
  const controls = useDragControls();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);
  const commit = () => {
    const clean = text.trim();
    if (clean && clean !== todo.text) onEdit(todo.id, clean);
    setEditing(false);
  };
  return (
    <Reorder.Item
      value={todo}
      as="li"
      className={`todo__row${todo.done ? ' is-done' : ''}`}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
    >
      <button
        type="button"
        className="todo__check"
        role="checkbox"
        aria-checked={todo.done}
        aria-label={todo.done ? `Bỏ hoàn thành: ${todo.text}` : `Hoàn thành: ${todo.text}`}
        onClick={() => onToggle(todo.id)}
      >
        {todo.done ? '✓' : ''}
      </button>
      {editing ? (
        <form className="todo__edit" onSubmit={(e) => { e.preventDefault(); commit(); }}>
          <input className="input" autoFocus value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} aria-label="Sửa việc" maxLength={200} />
        </form>
      ) : (
        <span className="todo__text" onClick={() => { setText(todo.text); setEditing(true); }}>{todo.text}</span>
      )}
      <button type="button" className="todo__delete" aria-label={`Xoá: ${todo.text}`} onClick={() => onDelete(todo.id)}>×</button>
      <span className="todo__handle" aria-hidden="true" onPointerDown={(e) => controls.start(e)}>⋮⋮</span>
    </Reorder.Item>
  );
}
