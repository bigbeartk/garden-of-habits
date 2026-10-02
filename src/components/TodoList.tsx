import { useEffect, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import type { Todo } from '../domain/types';
import './todo.css';

export interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onAdd: (text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
}

export function TodoList({ todos, onToggle, onAdd, onEdit, onDelete, onReorder }: TodoListProps) {
  const [items, setItems] = useState(todos);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => setItems(todos), [todos]);
  const [draft, setDraft] = useState('');

  return (
    <div className="todo">
      <form
        className="todo__add"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text) return;
          onAdd(text);
          setDraft('');
        }}
      >
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Thêm việc cần làm…"
          aria-label="Thêm việc cần làm"
          maxLength={200}
          enterKeyHint="done"
        />
        <button className="btn btn--primary btn--round" type="submit" aria-label="Thêm">＋</button>
      </form>
      {items.length === 0 ? (
        <p className="todo__empty muted">Chưa có việc nào. Thêm một việc nhỏ để tưới cây nhé 💧</p>
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="todo__list" as="ul">
          {items.map((t) => (
            <TodoRow
              key={t.id}
              todo={t}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onDragEnd={() => onReorder(itemsRef.current.map((i) => i.id))}
            />
          ))}
        </Reorder.Group>
      )}
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
