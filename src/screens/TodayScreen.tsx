import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { useNav } from '../app/nav';
import { BackButton } from '../components/BackButton';
import { GoalInput } from '../components/GoalInput';
import { IconButton } from '../components/IconButton';
import { NoteIcon, PlantSwapIcon, PotIcon, SleepSeedIcon, SunIcon } from '../components/icons';
import { NoteSheet } from '../components/NoteSheet';
import { PlantPickerSheet } from '../components/PlantPickerSheet';
import { PlantScene } from '../components/PlantScene';
import { PotPickerSheet } from '../components/PotPickerSheet';
import { SkyBackground } from '../components/SkyBackground';
import { SpeechBubble, type SpeechKind } from '../components/SpeechBubble';
import { StageBurst } from '../components/StageBurst';
import { TodoList } from '../components/TodoList';
import { WateringCan } from '../components/WateringCan';
import type { Mood } from '../content/Face';
import { pickGreeting } from '../content/greetings';
import { pickPraise } from '../content/praises';
import { pickTap } from '../content/taps';
import { getSpecies } from '../content/plants/registry';
import { getSpecial } from '../content/specials/registry';
import {
  addTodo, changePlant, changePot, deleteTodo, editTodo, markGreeted, moveTodo, setNote, setRestDay, setTitle, toggleTodo,
} from '../domain/dayService';
import { stageIndex } from '../domain/growth';
import { periodOf } from '../domain/period';
import { timeOfDay } from '../domain/timeOfDay';
import { getSetting } from '../db/settings';
import { useBackupReminder } from '../hooks/useBackupReminder';
import { useToday } from '../hooks/useToday';
import './today.css';

type Sheet = null | 'plant' | 'pot' | 'note';

export function TodayScreen() {
  const deps = useDeps();
  const nav = useNav();
  const { day, now, error: loadError } = useToday();
  const showReminder = useBackupReminder();
  /** lời cây nói: chào đầu ngày, khen khi xong việc, hoặc đáp lại khi bị chạm */
  const [speech, setSpeech] = useState<{ text: string; kind: 'greeting' | 'praise' | 'tap' } | null>(null);
  /** tăng mỗi lần chạm cây để cây nảy lên */
  const [tapKey, setTapKey] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [waterKey, setWaterKey] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [error, setError] = useState<string | null>(null);
  const greetedFor = useRef<string | null>(null);
  const plantSaysNote = useLiveQuery(async () => (await getSetting(deps.db, 'plantSaysNote')) ?? false, [deps.db], false);

  useEffect(() => {
    if (!day || day.greetedAt !== null || greetedFor.current === day.date) return;
    greetedFor.current = day.date;
    setSpeech({ text: pickGreeting(getSpecies(day.plantId), deps.rng), kind: 'greeting' });
    markGreeted(deps, day.date).catch((e: Error) => setError(e.message));
  }, [day, deps]);

  useEffect(() => {
    if (!speech) return;
    const t = setTimeout(() => setSpeech(null), speech.kind === 'greeting' ? 5000 : 3500);
    return () => clearTimeout(t);
  }, [speech]);

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
  // chào/khen hiện tạm; ngoài lúc đó, nếu bật "Cây nói ghi chú" thì cây nói ghi chú hôm nay
  const noteText = plantSaysNote && !day.isRestDay ? day.note.trim() : '';
  const said: { text: string; kind: SpeechKind } | null = speech ?? (noteText ? { text: noteText, kind: 'note' } : null);
  const mood: Mood = day.isRestDay ? 'sleep' : celebrating || speech?.kind === 'tap' ? 'smile' : said ? 'talk' : 'normal';
  const currentPeriod = periodOf(now);
  const doneCount = day.todos.filter((t) => t.done).length;
  const special = day.isRestDay ? null : getSpecial(day.specialId);

  /** Chạm cây: cây cười, nảy lên và nói một câu (đang ngủ thì nói câu ngái ngủ). */
  function handleTapPlant() {
    if (!day!.isRestDay) setTapKey((k) => k + 1);
    const text = pickTap(getSpecies(day!.plantId), deps.rng, { last: speech?.text ?? null, sleeping: day!.isRestDay });
    setSpeech({ text, kind: 'tap' });
  }

  async function handleToggle(id: string) {
    try {
      const r = await toggleTodo(deps, day!.date, id);
      if (r.completed) {
        setWaterKey((k) => k + 1);
        setCelebrating(true);
        if (stageIndex(r.day.finalStage) > stageIndex(r.prevStage)) setBurstKey((k) => k + 1);
        const bloomed = r.day.finalStage === 'bloom' && r.prevStage !== 'bloom';
        setSpeech({ text: pickPraise(getSpecies(r.day.plantId), deps.rng, bloomed), kind: 'praise' });
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="screen screen--today">
      <SkyBackground time={timeOfDay(now)}>
        <div className="today__stage">
          <BackButton onClick={() => nav('calendar')} />
          {speech?.kind === 'greeting' && special && (
            <div className="special-intro" data-testid="special-intro" role="status">
              <span className="special-intro__sparkles" aria-hidden="true">✨ ✨ ✨</span>
              Hôm nay mình là cây đặc biệt: {special.name}!
            </div>
          )}
          <SpeechBubble text={said?.text ?? null} kind={said?.kind} />
          <PlantScene
            className="today__plant"
            plantId={day.plantId}
            potId={day.potId}
            stage={day.finalStage}
            specialId={day.specialId}
            mood={mood}
            mode={day.isRestDay ? 'sleeping' : 'plant'}
            bounceKey={waterKey + tapKey}
          >
            {!day.isRestDay && <WateringCan playKey={waterKey} />}
            <StageBurst playKey={burstKey} />
          </PlantScene>
          <button type="button" className="today__plant-tap" aria-label="Chạm vào cây" onClick={handleTapPlant} />
          {special && <span className="today__badge">✨ Cây đặc biệt: {special.name}</span>}
        </div>
        <div className="today__actions">
          <IconButton label="Đổi cây" icon={<PlantSwapIcon size={30} />} onClick={() => setSheet('plant')} disabled={day.isRestDay} />
          <IconButton label="Đổi chậu" icon={<PotIcon size={30} />} onClick={() => setSheet('pot')} />
          <IconButton label="Ghi chú" icon={<NoteIcon size={30} />} onClick={() => setSheet('note')} badge={day.note.length > 0} />
          <IconButton
            label={day.isRestDay ? 'Thức dậy' : 'Ngày tiết kiệm năng lượng'}
            icon={day.isRestDay ? <SunIcon size={34} /> : <SleepSeedIcon size={38} />}
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
            <GoalInput
              value={day.title ?? ''}
              label="Mục tiêu hôm nay"
              placeholder="Đặt mục tiêu cho hôm nay…"
              onSave={(goal) => run(setTitle(deps, day.date, goal))}
            />
            <TodoList
              todos={day.todos}
              currentPeriod={currentPeriod}
              onToggle={handleToggle}
              onEdit={(id, t) => run(editTodo(deps, day.date, id, t))}
              onDelete={(id) => run(deleteTodo(deps, day.date, id))}
              onMove={(id, period, index) => run(moveTodo(deps, day.date, id, period, index))}
              onAdd={(text, period) => run(addTodo(deps, day.date, text, period))}
            />
          </>
        )}
      </div>

      <PlantPickerSheet
        open={sheet === 'plant'}
        currentId={day.plantId}
        currentSpecialId={day.specialId}
        onClose={() => setSheet(null)}
        onPick={(id, specialId) => { run(changePlant(deps, day.date, id, specialId)); setSheet(null); }}
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
        onSave={(note) => run(setNote(deps, day.date, note))}
      />
    </section>
  );
}
