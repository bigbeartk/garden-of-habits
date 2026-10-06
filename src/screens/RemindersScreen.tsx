import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBackHandler } from '../app/back';
import { useDeps } from '../app/deps';
import { BackButton } from '../components/BackButton';
import { DeleteWithConfirm } from '../components/DeleteWithConfirm';
import { BellIcon, SproutIcon, SunIcon } from '../components/icons';
import { dayKey } from '../domain/dayKey';
import type { DayDeps } from '../domain/dayService';
import { addReminder, deleteReminder, editReminder, setReminderAutoToday, toggleReminderDone } from '../domain/reminderService';
import { activeReminders, doneThisWeek } from '../domain/reminderView';
import type { Reminder } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';
import '../components/todo.css';
import './reminders.css';

type Run = (p: Promise<unknown>) => void;

/** Màu thẻ việc nhắc xoay vòng theo thứ tự. */
const TONES = ['peach', 'mint', 'butter', 'lavender'] as const;
type Tone = (typeof TONES)[number];

/** Màn Nhắc việc, mở từ thẻ "Nhắc việc" trong Cài đặt; `onBack` quay về Cài đặt. */
export function RemindersScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const deps = useDeps();
  const all = useLiveQuery(() => deps.db.reminders.toArray(), [deps.db]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // tăng mỗi lần bật "Hôm nay" để chuông ở thẻ đầu trang lắc lại
  const [ring, setRing] = useState(0);
  useBackHandler(adding, () => setAdding(false), 'form');
  const today = dayKey(deps.now());
  const run: Run = (p) => {
    setError(null);
    p.catch((e: Error) => setError(errorText(e, t)));
  };
  const active = all ? activeReminders(all) : [];
  const done = all ? doneThisWeek(all, today) : [];

  return (
    <section className="screen screen--reminders" data-testid="reminders">
      <header className="tpl-page__head">
        <BackButton inline label="Quay lại Cài đặt" onClick={onBack} />
        <h1 className="screen__title">Nhắc việc</h1>
      </header>

      <div className="rem-hero" data-testid="reminders-hero">
        <span key={ring} className={`rem-hero__bell${ring ? ' is-ringing' : ''}`}>
          <BellBuddy sleeping={!!all && active.length === 0} />
        </span>
        <div className="rem-hero__body">
          <div className="rem-hero__stats">
            <p className="rem-stat">
              <b data-testid="rem-stat-active">{active.length}</b>
              <span>đang theo dõi</span>
            </p>
            <p className="rem-stat rem-stat--done">
              <b data-testid="rem-stat-done">{done.length}</b>
              <span>xong tuần này</span>
            </p>
          </div>
          <p className="rem-hero__hint">
            Bật <span className="rem-hero__chip"><SunIcon size={14} /> Hôm nay</span> thì việc tự vào buổi Sáng mỗi ngày cho tới khi xong.
          </p>
        </div>
      </div>

      {error && <p role="alert" className="error">{error}</p>}
      {adding ? (
        <NewReminder deps={deps} onError={setError} onDone={() => setAdding(false)} />
      ) : (
        <button type="button" className="tpl-new" onClick={() => setAdding(true)}>＋ Việc nhắc mới</button>
      )}

      <div className="rem__group" data-testid="reminders-active">
        {all && active.length === 0 && (
          <p className="card muted rem__empty">Chưa có việc nhắc nào. Bấm ＋ để thêm nhé 🌱</p>
        )}
        <ul className="rem__list">
          {active.map((r, i) => (
            <ReminderRow
              key={r.id} r={r} tone={TONES[i % TONES.length]} deps={deps} run={run}
              onRing={() => setRing((n) => n + 1)}
            />
          ))}
        </ul>
      </div>

      <div className="card rem__done" data-testid="reminders-done">
        <h2 className="rem__title">
          <SproutIcon size={26} />
          <span>Đã hoàn thành tuần này</span>
          <span className="rem__count" data-testid="rem-done-count">{done.length}</span>
        </h2>
        {all && done.length === 0 && <p className="muted rem__empty">Chưa xong việc nào tuần này</p>}
        <ul className="rem__done-list">
          {done.map((r) => (
            <li key={r.id} className="rem__done-row">
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

function ReminderRow({ r, tone, deps, run, onRing }: { r: Reminder; tone: Tone; deps: DayDeps; run: Run; onRing: () => void }) {
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
    <li className="rem__row" data-tone={tone} data-testid={`reminder-${r.id}`}>
      <div className="rem__main">
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
      </div>
      <div className="rem__foot">
        <button
          type="button" role="switch" aria-checked={on} aria-label={`Thêm vào hôm nay: ${r.text}`}
          className={`rem__today${on ? ' is-on' : ''}`}
          onClick={() => {
            const next = !on;
            setOn(next);
            if (next) onRing();
            run(setReminderAutoToday(deps, r.id, next));
          }}
        >
          <SunIcon size={20} />
          <span>Hôm nay</span>
          <span className="rem__today-dot" aria-hidden="true" />
        </button>
        <DeleteWithConfirm text={r.text} onConfirm={() => run(deleteReminder(deps, r.id))} />
      </div>
    </li>
  );
}

function NewReminder({ deps, onDone, onError }: { deps: DayDeps; onDone: () => void; onError: (msg: string) => void }) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  async function save() {
    // việc rỗng không bao giờ được lưu: chỉ đóng dòng
    if (text.trim()) {
      try {
        await addReminder(deps, text);
      } catch (e) {
        onError(errorText(e, t));
        return;
      }
    }
    onDone();
  }
  return (
    <form
      className="rem__new"
      onSubmit={(e) => { e.preventDefault(); void save(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onDone(); }}
    >
      <div className="rem__new-field">
        <BellIcon size={26} />
        <input
          className="input" autoFocus maxLength={200} aria-label="Việc nhắc mới" placeholder="Việc cần nhớ…"
          value={text} onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="rem__new-actions">
        <button type="button" className="btn btn--ghost" onClick={onDone}>Huỷ</button>
        <button type="submit" className="btn btn--primary">Lưu</button>
      </div>
    </form>
  );
}

const INK = '#5B4636';
const LINE = { stroke: INK, strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Chuông chibi ở thẻ đầu trang; chưa có việc nào thì chuông ngủ. */
function BellBuddy({ sleeping }: { sleeping: boolean }) {
  return (
    <svg viewBox="0 0 80 84" width={80} height={84} aria-hidden="true" focusable="false" data-mood={sleeping ? 'sleep' : 'smile'}>
      <ellipse cx={40} cy={79} rx={22} ry={3.5} fill="rgba(91,70,54,0.15)" />
      <path d="M40 14 C24 14 20 27 20 39 L20 50 L12 62 L68 62 L60 50 L60 39 C60 27 56 14 40 14 Z" fill="#FFE58A" {...LINE} />
      <path d="M27 26 C29 21 32 19 35 18.5" fill="none" stroke="#FFF8D6" strokeWidth={3} strokeLinecap="round" />
      <path d="M22 56 L58 56" stroke="#F5C542" strokeWidth={3} strokeLinecap="round" />
      <circle cx={40} cy={69} r={6} fill="#F27A93" {...LINE} />
      <circle cx={40} cy={9.5} r={4} fill="#F27A93" {...LINE} />
      {sleeping ? (
        <>
          <path d="M29 40 q3.5 3 7 0 M44 40 q3.5 3 7 0" fill="none" {...LINE} strokeWidth={2} />
          <ellipse cx={40} cy={47.5} rx={2.2} ry={1.6} fill="none" {...LINE} strokeWidth={1.8} />
          <text x={61} y={24} fontSize={12} fontWeight={700} fill={INK} fontFamily="'Baloo 2', sans-serif">z</text>
          <text x={69} y={14} fontSize={9} fontWeight={700} fill={INK} fontFamily="'Baloo 2', sans-serif">z</text>
        </>
      ) : (
        <>
          <circle cx={32.5} cy={39} r={2.8} fill={INK} />
          <circle cx={47.5} cy={39} r={2.8} fill={INK} />
          <circle cx={33.5} cy={38} r={1} fill="#fff" />
          <circle cx={48.5} cy={38} r={1} fill="#fff" />
          <path d="M36 45 q4 4 8 0" fill="none" {...LINE} strokeWidth={2} />
          <g className="rem-hero__waves" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round">
            <path d="M8 30 q-3.5 6 0 12" />
            <path d="M72 30 q3.5 6 0 12" />
          </g>
        </>
      )}
      <ellipse cx={27} cy={45} rx={3.4} ry={2} fill="#FF9FB2" />
      <ellipse cx={53} cy={45} rx={3.4} ry={2} fill="#FF9FB2" />
    </svg>
  );
}
