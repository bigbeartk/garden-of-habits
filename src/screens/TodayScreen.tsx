import { useEffect, useRef, useState } from 'react';
import { useDeps } from '../app/deps';
import { useNav } from '../app/nav';
import { IconButton } from '../components/IconButton';
import { NoteSheet } from '../components/NoteSheet';
import { PlantPickerSheet } from '../components/PlantPickerSheet';
import { PlantScene } from '../components/PlantScene';
import { PotPickerSheet } from '../components/PotPickerSheet';
import { SkyBackground } from '../components/SkyBackground';
import { SpeechBubble } from '../components/SpeechBubble';
import { StageBurst } from '../components/StageBurst';
import { TodoList } from '../components/TodoList';
import { WateringCan } from '../components/WateringCan';
import type { Mood } from '../content/Face';
import { pickGreeting } from '../content/greetings';
import { getSpecies } from '../content/plants/registry';
import { getSpecial } from '../content/specials/registry';
import {
  addTodo, changePlant, changePot, deleteTodo, editTodo, markGreeted, reorderTodos, setNote, setRestDay, toggleTodo,
} from '../domain/dayService';
import { stageIndex } from '../domain/growth';
import { timeOfDay } from '../domain/timeOfDay';
import { useBackupReminder } from '../hooks/useBackupReminder';
import { useToday } from '../hooks/useToday';
import './today.css';

type Sheet = null | 'plant' | 'pot' | 'note';

export function TodayScreen() {
  const deps = useDeps();
  const nav = useNav();
  const { day, now, error: loadError } = useToday();
  const showReminder = useBackupReminder();
  const [greeting, setGreeting] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [waterKey, setWaterKey] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [error, setError] = useState<string | null>(null);
  const greetedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!day || day.greetedAt !== null || greetedFor.current === day.date) return;
    greetedFor.current = day.date;
    setGreeting(pickGreeting(getSpecies(day.plantId), deps.rng));
    markGreeted(deps, day.date).catch((e: Error) => setError(e.message));
  }, [day, deps]);

  useEffect(() => {
    if (!greeting) return;
    const t = setTimeout(() => setGreeting(null), 5000);
    return () => clearTimeout(t);
  }, [greeting]);

  useEffect(() => {
    if (!celebrating) return;
    const t = setTimeout(() => setCelebrating(false), 1800);
    return () => clearTimeout(t);
  }, [celebrating, waterKey]);

  if (loadError) {
    return <section className="screen"><p role="alert" className="error">Không tải được dữ liệu: {loadError.message}</p></section>;
  }
  if (!day) {
    return <section className="screen" aria-busy="true"><p className="muted">Đang tưới cây…</p></section>;
  }

  const run = (p: Promise<unknown>) => {
    p.catch((e: Error) => setError(e.message));
  };
  const mood: Mood = day.isRestDay ? 'sleep' : greeting ? 'talk' : celebrating ? 'smile' : 'normal';
  const doneCount = day.todos.filter((t) => t.done).length;
  const special = day.isRestDay ? null : getSpecial(day.specialId);

  async function handleToggle(id: string) {
    try {
      const r = await toggleTodo(deps, day!.date, id);
      if (r.completed) {
        setWaterKey((k) => k + 1);
        setCelebrating(true);
        if (stageIndex(r.day.finalStage) > stageIndex(r.prevStage)) setBurstKey((k) => k + 1);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="screen screen--today">
      <SkyBackground time={timeOfDay(now)}>
        <div className="today__stage">
          {greeting && special && (
            <div className="special-intro" data-testid="special-intro" role="status">
              <span className="special-intro__sparkles" aria-hidden="true">✨ ✨ ✨</span>
              Hôm nay mình là cây đặc biệt: {special.name}!
            </div>
          )}
          <SpeechBubble text={greeting} />
          <PlantScene
            className="today__plant"
            plantId={day.plantId}
            potId={day.potId}
            stage={day.finalStage}
            specialId={day.specialId}
            mood={mood}
            mode={day.isRestDay ? 'sleeping' : 'plant'}
            bounceKey={waterKey}
          >
            {!day.isRestDay && <WateringCan playKey={waterKey} />}
            <StageBurst playKey={burstKey} />
          </PlantScene>
          {special && <span className="today__badge">✨ Cây đặc biệt: {special.name}</span>}
        </div>
        <div className="today__actions">
          <IconButton label="Đổi cây" icon="🔄" onClick={() => setSheet('plant')} disabled={day.isRestDay} />
          <IconButton label="Đổi chậu" icon="🪴" onClick={() => setSheet('pot')} />
          <IconButton label="Ghi chú" icon="📝" onClick={() => setSheet('note')} badge={day.note.length > 0} />
          <IconButton
            label={day.isRestDay ? 'Thức dậy' : 'Ngày tiết kiệm năng lượng'}
            icon={day.isRestDay ? '🌞' : '😴'}
            pressed={day.isRestDay}
            onClick={() => run(setRestDay(deps, day.date, !day.isRestDay))}
          />
        </div>
      </SkyBackground>

      <div className="today__list card">
        {showReminder && (
          <button type="button" className="reminder" onClick={() => nav('settings')}>
            🌱 Lâu rồi bạn chưa sao lưu dữ liệu — chạm để sao lưu nhé!
          </button>
        )}
        {error && <p role="alert" className="error" onClick={() => setError(null)}>{error}</p>}
        {day.isRestDay ? (
          <div className="rest" data-testid="rest-message">
            <p className="rest__title">💤 Hôm nay là ngày tiết kiệm năng lượng</p>
            <p className="muted">Nghỉ ngơi thật ngon nhé, việc để mai tính!</p>
          </div>
        ) : (
          <>
            <header className="today__head">
              <h1 className="screen__title">Hôm nay</h1>
              <span className="pill">{doneCount}/{day.todos.length} việc</span>
            </header>
            <TodoList
              todos={day.todos}
              onToggle={handleToggle}
              onAdd={(t) => run(addTodo(deps, day.date, t))}
              onEdit={(id, t) => run(editTodo(deps, day.date, id, t))}
              onDelete={(id) => run(deleteTodo(deps, day.date, id))}
              onReorder={(ids) => run(reorderTodos(deps, day.date, ids))}
            />
          </>
        )}
      </div>

      <PlantPickerSheet
        open={sheet === 'plant'}
        currentId={day.plantId}
        onClose={() => setSheet(null)}
        onPick={(id) => { run(changePlant(deps, day.date, id)); setSheet(null); }}
      />
      <PotPickerSheet
        open={sheet === 'pot'}
        day={day}
        onClose={() => setSheet(null)}
        onPick={(id) => { run(changePot(deps, day.date, id)); setSheet(null); }}
      />
      <NoteSheet
        open={sheet === 'note'}
        initial={day.note}
        onClose={() => setSheet(null)}
        onSave={(note) => { run(setNote(deps, day.date, note)); setSheet(null); }}
      />
    </section>
  );
}
