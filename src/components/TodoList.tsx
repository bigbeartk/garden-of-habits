import { useEffect, useRef, useState } from 'react';
import { DeleteWithConfirm } from './DeleteWithConfirm';
import { DraftRow, SectionAddButton } from './InlineAdd';
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
  /** kéo thả: chuyển việc sang buổi `period`, đứng ở vị trí `index` trong buổi đó */
  onMove: (id: string, period: Period, index: number) => void;
  /** thêm việc (đã bỏ khoảng trắng, không rỗng) vào buổi `period` */
  onAdd: (text: string, period: Period) => void;
}

interface DropTarget { period: Period; index: number; lineY: number | null }
interface Drag { id: string; startY: number; startScroll: number; y: number; dy: number; target: DropTarget | null }

const EDGE = 56; // kéo tới gần mép vùng cuộn thì tự cuộn
const MAX_SCROLL_STEP = 6; // px mỗi khung hình

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement ?? null; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}

/** Đặt `id` vào buổi `period` ở vị trí `index` (giống moveTodo ở tầng domain) để giao diện đổi ngay. */
function applyMove(todos: Todo[], id: string, period: Period, index: number): Todo[] {
  const moved = todos.find((t) => t.id === id);
  if (!moved) return todos;
  const rest = todos.filter((t) => t.id !== id);
  const target = rest.filter((t) => t.period === period);
  target.splice(Math.max(0, Math.min(index, target.length)), 0, { ...moved, period });
  return PERIODS.flatMap((p) => (p === period ? target : rest.filter((t) => t.period === p)));
}

export function TodoList({ todos, currentPeriod, onToggle, onEdit, onDelete, onMove, onAdd }: TodoListProps) {
  const [items, setItems] = useState(todos);
  /** buổi đang có dòng việc trống để gõ */
  const [draft, setDraft] = useState<Period | null>(null);
  useEffect(() => setItems(todos), [todos]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);

  const update = (next: Drag | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  /** Tìm buổi và vị trí sẽ thả theo toạ độ y của ngón tay. */
  const findTarget = (id: string, y: number): DropTarget | null => {
    const root = rootRef.current;
    if (!root) return null;
    const sections = [...root.querySelectorAll<HTMLElement>('[data-period]')];
    if (sections.length === 0) return null;
    const dist = (r: DOMRect) => (y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0);
    const section = sections.reduce((best, s) => (dist(s.getBoundingClientRect()) < dist(best.getBoundingClientRect()) ? s : best));
    const rootTop = root.getBoundingClientRect().top;
    const rows = [...section.querySelectorAll<HTMLElement>('[data-todo-id]')].filter((r) => r.dataset.todoId !== id);
    const rects = rows.map((r) => r.getBoundingClientRect());
    const index = rects.filter((r) => r.top + r.height / 2 < y).length;
    // buổi trống (hoặc chỉ có chính việc đang kéo): không vẽ vạch, viền buổi đã đủ báo chỗ thả
    const lineY = rects.length === 0 ? null : (index < rects.length ? rects[index].top - 4 : rects[rects.length - 1].bottom + 4) - rootTop;
    return { period: section.dataset.period as Period, index, lineY };
  };

  const moveTo = (y: number) => {
    const d = dragRef.current;
    if (!d) return;
    const scroll = scrollerRef.current?.scrollTop ?? 0;
    update({ ...d, y, dy: y - d.startY + (scroll - d.startScroll), target: findTarget(d.id, y) });
  };

  // tự cuộn khi kéo tới gần mép trên/dưới của vùng danh sách
  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    let frame = 0;
    const tick = () => {
      const d = dragRef.current;
      const sc = scrollerRef.current;
      if (d && sc) {
        const r = sc.getBoundingClientRect();
        // càng sát mép cuộn càng nhanh
        const up = r.top + EDGE - d.y;
        const down = d.y - (r.bottom - EDGE);
        const step = up > 0 ? -Math.ceil((MAX_SCROLL_STEP * Math.min(up, EDGE)) / EDGE)
          : down > 0 ? Math.ceil((MAX_SCROLL_STEP * Math.min(down, EDGE)) / EDGE) : 0;
        const before = sc.scrollTop;
        if (step) sc.scrollTop = before + step;
        if (sc.scrollTop !== before) moveTo(d.y);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dragging]);

  const startDrag = (id: string, e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    scrollerRef.current = scrollParent(rootRef.current);
    const startScroll = scrollerRef.current?.scrollTop ?? 0;
    update({ id, startY: e.clientY, startScroll, y: e.clientY, dy: 0, target: findTarget(id, e.clientY) });
  };

  const endDrag = (commit: boolean) => {
    const d = dragRef.current;
    update(null);
    if (!commit || !d?.target) return;
    const { period, index } = d.target;
    const cur = items.find((t) => t.id === d.id);
    if (!cur) return;
    const curIndex = items.filter((t) => t.period === cur.period).findIndex((t) => t.id === d.id);
    if (period === cur.period && index === curIndex) return;
    setItems((prev) => applyMove(prev, d.id, period, index));
    onMove(d.id, period, index);
  };

  return (
    <div className={`todo${drag ? ' is-dragging' : ''}`} ref={rootRef}>
      {items.length === 0 && <p className="todo__hint muted">Bấm ＋ để thêm việc và tưới cây nhé 💧</p>}
      {PERIODS.map((p) => {
        const group = items.filter((t) => t.period === p);
        const done = group.filter((t) => t.done).length;
        const isDrop = drag?.target?.period === p;
        return (
          <section
            key={p}
            className={`todo__section todo__section--${p}${p === currentPeriod ? ' is-current' : ''}${isDrop ? ' is-drop-target' : ''}`}
            data-testid={`todo-section-${p}`}
            data-period={p}
          >
            <header className="todo__section-head">
              <h2 className="todo__section-title">
                <PeriodIcon period={p} /> {PERIOD_LABEL[p]}
              </h2>
              {group.length > 0 && <span className="todo__section-count">{done}/{group.length}</span>}
              <SectionAddButton period={p} onClick={() => setDraft(p)} />
            </header>
            {group.length === 0 && draft !== p ? (
              <p className="todo__empty muted">Chưa có việc</p>
            ) : (
              <ul className="todo__list">
                {group.map((t) => (
                  <TodoRow
                    key={t.id}
                    todo={t}
                    dragY={drag?.id === t.id ? drag.dy : null}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onHandleDown={(e) => startDrag(t.id, e)}
                    onHandleMove={(e) => { if (dragRef.current) moveTo(e.clientY); }}
                    onHandleUp={() => endDrag(true)}
                    onHandleCancel={() => endDrag(false)}
                  />
                ))}
                {draft === p && <DraftRow period={p} onAdd={(text) => onAdd(text, p)} onDone={() => setDraft((d) => (d === p ? null : d))} />}
              </ul>
            )}
          </section>
        );
      })}
      {drag?.target?.lineY != null && <div className="todo__drop-line" aria-hidden="true" style={{ top: drag.target.lineY }} />}
    </div>
  );
}

function TodoRow({
  todo, dragY, onToggle, onEdit, onDelete, onHandleDown, onHandleMove, onHandleUp, onHandleCancel,
}: {
  todo: Todo;
  /** độ lệch dọc khi đang được kéo; null = không kéo */
  dragY: number | null;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onHandleDown: (e: React.PointerEvent<HTMLElement>) => void;
  onHandleMove: (e: React.PointerEvent<HTMLElement>) => void;
  onHandleUp: () => void;
  onHandleCancel: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);
  const commit = () => {
    const clean = text.trim();
    if (clean && clean !== todo.text) onEdit(todo.id, clean);
    setEditing(false);
  };
  return (
    <li
      className={`todo__row${todo.done ? ' is-done' : ''}${dragY !== null ? ' is-lifted' : ''}`}
      data-todo-id={todo.id}
      style={dragY !== null ? { transform: `translateY(${dragY}px) scale(1.02)` } : undefined}
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
      <DeleteWithConfirm text={todo.text} onConfirm={() => onDelete(todo.id)} />
      <span
        className="todo__handle"
        aria-hidden="true"
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        onPointerCancel={onHandleCancel}
      >⋮⋮</span>
    </li>
  );
}
