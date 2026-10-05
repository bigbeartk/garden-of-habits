import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBackHandler } from '../app/back';
import { useDeps } from '../app/deps';
import { BackButton } from '../components/BackButton';
import { DeleteWithConfirm } from '../components/DeleteWithConfirm';
import { dayKey } from '../domain/dayKey';
import type { DayDeps } from '../domain/dayService';
import { addReminder, deleteReminder, editReminder, setReminderAutoToday, toggleReminderDone } from '../domain/reminderService';
import { activeReminders, doneThisWeek } from '../domain/reminderView';
import type { Reminder } from '../domain/types';
import '../components/todo.css';
import './reminders.css';

type Run = (p: Promise<unknown>) => void;

/** Màn Nhắc việc, mở từ thẻ "Nhắc việc" trong Cài đặt; `onBack` quay về Cài đặt. */
export function RemindersScreen({ onBack }: { onBack: () => void }) {
  const deps = useDeps();
  const all = useLiveQuery(() => deps.db.reminders.toArray(), [deps.db]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useBackHandler(adding, () => setAdding(false), 'form');
  const today = dayKey(deps.now());
  const run: Run = (p) => {
    setError(null);
    p.catch((e: Error) => setError(e.message));
  };
  const active = all ? activeReminders(all) : [];
  const done = all ? doneThisWeek(all, today) : [];

  return (
    <section className="screen screen--reminders" data-testid="reminders">
      <header className="tpl-page__head">
        <BackButton inline label="Quay lại Cài đặt" onClick={onBack} />
        <h1 className="screen__title">Nhắc việc</h1>
      </header>
      <p className="muted rem__hint">Việc chưa cần làm ngay thì để ở đây theo dõi. Bật <b>Hôm nay</b> thì việc tự vào buổi Sáng mỗi ngày cho tới khi xong.</p>
      {error && <p role="alert" className="error">{error}</p>}
      {adding ? (
        <NewReminder deps={deps} onError={setError} onDone={() => setAdding(false)} />
      ) : (
        <button type="button" className="tpl-new" onClick={() => setAdding(true)}>＋ Việc nhắc mới</button>
      )}

      <div className="card rem__card" data-testid="reminders-active">
        <div className="rem__cols" aria-hidden="true">
          <span className="rem__cols-text">Việc</span><span className="rem__cols-today">Hôm nay</span>
        </div>
        {all && active.length === 0 && <p className="muted rem__empty">Chưa có việc nhắc nào. Bấm ＋ để thêm nhé 🌱</p>}
        <ul className="rem__list">
          {active.map((r) => <ReminderRow key={r.id} r={r} deps={deps} run={run} />)}
        </ul>
      </div>

      <div className="card rem__card" data-testid="reminders-done">
        <h2 className="rem__title">Đã hoàn thành tuần này</h2>
        {all && done.length === 0 && <p className="muted rem__empty">Chưa xong việc nào tuần này</p>}
        <ul className="rem__list">
          {done.map((r) => (
            <li key={r.id} className="rem__row is-done">
              <button
                type="button" role="checkbox" aria-checked className="todo__check"
                aria-label={`Bỏ hoàn thành nhắc: ${r.text}`}
                onClick={() => run(toggleReminderDone(deps, r.id))}
              >✓</button>
              <span className="rem__text">{r.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ReminderRow({ r, deps, run }: { r: Reminder; deps: DayDeps; run: Run }) {
  // giữ trạng thái công tắc ngay trên giao diện để bấm nhanh liên tiếp vẫn đúng
  const [on, setOn] = useState(r.autoToday);
  useEffect(() => setOn(r.autoToday), [r.autoToday]);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(r.text);
  useBackHandler(editing, () => setEditing(false), 'form');
  const commit = () => {
    const clean = text.trim();
    if (clean && clean !== r.text) run(editReminder(deps, r.id, clean));
    setEditing(false);
  };
  return (
    <li className="rem__row" data-testid={`reminder-${r.id}`}>
      <button
        type="button" role="checkbox" aria-checked={false} className="todo__check"
        aria-label={`Hoàn thành nhắc: ${r.text}`}
        onClick={() => run(toggleReminderDone(deps, r.id))}
      />
      {editing ? (
        <form className="rem__edit" onSubmit={(e) => { e.preventDefault(); commit(); }}>
          <input
            className="input" autoFocus value={text} maxLength={200} aria-label="Sửa việc nhắc"
            onChange={(e) => setText(e.target.value)} onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
          />
        </form>
      ) : (
        <button type="button" className="rem__text" onClick={() => { setText(r.text); setEditing(true); }}>{r.text}</button>
      )}
      <button
        type="button" role="switch" aria-checked={on} aria-label={`Thêm vào hôm nay: ${r.text}`}
        className={`rem__switch${on ? ' is-on' : ''}`}
        onClick={() => {
          const next = !on;
          setOn(next);
          run(setReminderAutoToday(deps, r.id, next));
        }}
      >
        <span className="switch" aria-hidden="true"><span className="switch__knob" /></span>
      </button>
      <DeleteWithConfirm text={r.text} onConfirm={() => run(deleteReminder(deps, r.id))} />
    </li>
  );
}

function NewReminder({ deps, onDone, onError }: { deps: DayDeps; onDone: () => void; onError: (msg: string) => void }) {
  const [text, setText] = useState('');
  async function save() {
    // việc rỗng không bao giờ được lưu: chỉ đóng dòng
    if (text.trim()) {
      try {
        await addReminder(deps, text);
      } catch (e) {
        onError((e as Error).message);
        return;
      }
    }
    onDone();
  }
  return (
    <form
      className="card rem__new"
      onSubmit={(e) => { e.preventDefault(); void save(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onDone(); }}
    >
      <input
        className="input" autoFocus maxLength={200} aria-label="Việc nhắc mới" placeholder="Việc cần nhớ…"
        value={text} onChange={(e) => setText(e.target.value)}
      />
      <div className="rem__new-actions">
        <button type="submit" className="btn btn--primary">Lưu</button>
        <button type="button" className="btn btn--ghost" onClick={onDone}>Huỷ</button>
      </div>
    </form>
  );
}
