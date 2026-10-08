import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { useNav } from '../app/nav';
import { BackButton } from '../components/BackButton';
import { requestHabitManager } from '../app/habitIntent';
import { GoalInput } from '../components/GoalInput';
import { HabitStrip } from '../components/HabitStrip';
import { IconButton } from '../components/IconButton';
import { BellIcon, NoteIcon, PlantSwapIcon, SleepSeedIcon, SpeechIcon, SunIcon } from '../components/icons';
import { NoteSheet } from '../components/NoteSheet';
import { PlantPotSheet } from '../components/PlantPotSheet';
import { PlantScene } from '../components/PlantScene';
import { SkyBackground } from '../components/SkyBackground';
import { SpeechBubble, type SpeechKind } from '../components/SpeechBubble';
import { StageBurst } from '../components/StageBurst';
import { TodoList } from '../components/TodoList';
import { WateringCan } from '../components/WateringCan';
import type { Mood } from '../content/Face';
import { pickPraise } from '../content/praises';
import { pickSaying } from '../content/sayings';
import { pickTap } from '../content/taps';
import { getSpecies } from '../content/plants/registry';
import { getStyle } from '../content/plants/styles';
import { getSpecial } from '../content/specials/registry';
import {
  SPEECH_MAX, addTodo, changePlant, changePot, deleteTodo, editTodo, markGreeted, moveTodo, setDaySpeech, setNote, setRestDay, setTitle,
  toggleTodo,
} from '../domain/dayService';
import { stageIndex } from '../domain/growth';
import { listUnlockedStyles } from '../domain/styleUnlocks';
import { periodOf } from '../domain/period';
import { timeOfDay } from '../domain/timeOfDay';
import { getSetting, setSetting } from '../db/settings';
import { useBackupReminder } from '../hooks/useBackupReminder';
import { useToday } from '../hooks/useToday';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';
import { useBackHandler } from '../app/back';
import { RemindersScreen } from './RemindersScreen';
import './today.css';

type Sheet = null | 'plant' | 'note';

export function TodayScreen() {
  const { t, lang, tr } = useI18n();
  const deps = useDeps();
  const nav = useNav();
  const { day, now, error: loadError } = useToday();
  const showReminder = useBackupReminder();
  /** câu nói tạm (khen khi xong việc, đáp lại khi bị chạm); hết thì cây quay về lời của ngày (`day.speech`) */
  const [speech, setSpeech] = useState<{ text: string; kind: 'praise' | 'tap' } | null>(null);
  /** đang sửa lời của ngày: giữ bong bóng đó, câu tạm không chen vào */
  const [editingSpeech, setEditingSpeech] = useState(false);
  /** khung ✨ giới thiệu cây đặc biệt, hiện lúc chào lần đầu trong ngày */
  const [intro, setIntro] = useState(false);
  /** tăng mỗi lần chạm cây để cây nảy lên */
  const [tapKey, setTapKey] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [waterKey, setWaterKey] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  /** đang mở màn Nhắc việc (nút chuông dưới chậu) */
  const [showReminders, setShowReminders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const greetedFor = useRef<string | null>(null);
  const pickedFor = useRef<string | null>(null);
  // undefined = chưa đọc xong setting: chưa hiện bong bóng, để lúc đang ẩn không bị nháy lên
  const showSpeechSaved = useLiveQuery(async () => (await getSetting(deps.db, 'showPlantSpeech')) ?? true, [deps.db]);
  /** giữ cục bộ để bấm nhanh hai lần không bị đọc lại giá trị cũ từ DB */
  const [showSpeechLocal, setShowSpeechLocal] = useState<boolean | null>(null);
  const showSpeech = showSpeechLocal ?? showSpeechSaved;

  // ngày chưa có lời cây nói (ngày mới, hoặc bản ghi cũ) thì chọn ngẫu nhiên một câu và lưu lại
  useEffect(() => {
    if (!day || day.speech !== undefined || pickedFor.current === day.date) return;
    pickedFor.current = day.date;
    setDaySpeech(deps, day.date, pickSaying(getSpecies(day.plantId), deps.rng, lang)).catch((e: Error) => setError(errorText(e, t)));
  }, [day, deps]);

  useEffect(() => {
    if (!day || day.greetedAt !== null || greetedFor.current === day.date) return;
    greetedFor.current = day.date;
    setIntro(true);
    markGreeted(deps, day.date).catch((e: Error) => setError(errorText(e, t)));
  }, [day, deps]);

  useEffect(() => {
    if (!intro) return;
    const t = setTimeout(() => setIntro(false), 5000);
    return () => clearTimeout(t);
  }, [intro]);

  /**
   * dáng vừa mở khoá trong lúc màn đang mở. Không tính lần nạp đầu, và chỉ mừng dáng vừa được ghi vào
   * `unlockedStyles` (mở nhờ tick ra hoa); dáng suy ra từ lịch sử (vd. lúc sang ngày mới) không mừng.
   */
  const unlockedStyles = useLiveQuery(
    async () => ({ all: await listUnlockedStyles(deps), saved: new Set((await getSetting(deps.db, 'unlockedStyles')) ?? []) }),
    [deps],
  );
  const seenStyles = useRef<Set<string> | null>(null);
  const [newStyles, setNewStyles] = useState<string[]>([]);
  useEffect(() => {
    if (!unlockedStyles) return;
    const seen = seenStyles.current;
    if (seen) {
      const added = [...unlockedStyles.all].filter((k) => !seen.has(k) && unlockedStyles.saved.has(k));
      if (added.length) setNewStyles(added);
    }
    seenStyles.current = unlockedStyles.all;
  }, [unlockedStyles]);
  useEffect(() => {
    if (!newStyles.length) return;
    const t = setTimeout(() => setNewStyles([]), 5000);
    return () => clearTimeout(t);
  }, [newStyles]);

  useEffect(() => {
    if (!speech) return;
    const t = setTimeout(() => setSpeech(null), 3500);
    return () => clearTimeout(t);
  }, [speech]);

  useEffect(() => {
    if (!celebrating) return;
    const t = setTimeout(() => setCelebrating(false), 1800);
    return () => clearTimeout(t);
  }, [celebrating, waterKey]);

  // màn Nhắc việc mở từ nút chuông dưới chậu, thay chỗ màn Hôm nay; Back Android về Hôm nay
  useBackHandler(showReminders, () => setShowReminders(false), 'screen');

  if (showReminders) return <RemindersScreen onBack={() => setShowReminders(false)} />;
  if (loadError) {
    return <section className="screen"><p role="alert" className="error">{t.today.loadFailed(loadError.message)}</p></section>;
  }
  if (!day) {
    return <section className="screen" aria-busy="true"><p className="muted">{t.today.loading}</p></section>;
  }

  const run = (p: Promise<unknown>) => {
    p.catch((e: Error) => setError(errorText(e, t)));
  };
  // câu khen/chạm hiện tạm; ngoài lúc đó cây nói lời của ngày (nếu không bị ẩn)
  const daily = !day.isRestDay && showSpeech === true && day.speech !== undefined ? { text: day.speech, kind: 'daily' as const } : null;
  const said: { text: string; kind: SpeechKind } | null = editingSpeech ? daily : speech ?? daily;
  const mood: Mood = day.isRestDay ? 'sleep' : celebrating || speech?.kind === 'tap' ? 'smile' : said?.text ? 'talk' : 'normal';
  const currentPeriod = periodOf(now);
  const doneCount = day.todos.filter((t) => t.done).length;
  const special = day.isRestDay ? null : getSpecial(day.specialId);

  function toggleSpeech() {
    const next = !showSpeech;
    setShowSpeechLocal(next);
    run(setSetting(deps.db, 'showPlantSpeech', next));
  }

  /** Chạm cây: cây cười, nảy lên và nói một câu (đang ngủ thì nói câu ngái ngủ). */
  function handleTapPlant() {
    if (!day!.isRestDay) setTapKey((k) => k + 1);
    const text = pickTap(getSpecies(day!.plantId), deps.rng, { last: speech?.text ?? null, sleeping: day!.isRestDay, lang });
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
        setSpeech({ text: pickPraise(getSpecies(r.day.plantId), deps.rng, bloomed, lang), kind: 'praise' });
      }
    } catch (e) {
      setError(errorText(e, t));
    }
  }

  return (
    <section className="screen screen--today">
      <SkyBackground time={timeOfDay(now)}>
        <div className="today__stage">
          <BackButton onClick={() => nav('calendar')} />
          {intro && special && (
            <div className="special-intro" data-testid="special-intro" role="status">
              <span className="special-intro__sparkles" aria-hidden="true">✨ ✨ ✨</span>
              {t.today.specialIntro(tr(special.name))}
            </div>
          )}
          {newStyles.length > 0 && <StyleUnlock keys={newStyles} below={intro && !!special} />}
          <SpeechBubble
            text={said?.text ?? null}
            kind={said?.kind}
            edit={{ onEdit: (t) => run(setDaySpeech(deps, day.date, t)), onEditingChange: setEditingSpeech, maxLength: SPEECH_MAX }}
          />
          {!day.isRestDay && showSpeech !== undefined && (
            <button
              type="button"
              className={`today__speech-toggle${showSpeech ? '' : ' is-off'}`}
              aria-label={showSpeech ? t.today.hideSpeech : t.today.showSpeech}
              title={showSpeech ? t.today.hideSpeech : t.today.showSpeech}
              onClick={toggleSpeech}
            >
              <SpeechIcon size={22} off={!showSpeech} />
            </button>
          )}
          <PlantScene
            className="today__plant"
            plantId={day.plantId}
            potId={day.potId}
            stage={day.finalStage}
            specialId={day.specialId}
            styleId={day.styleId}
            mood={mood}
            mode={day.isRestDay ? 'sleeping' : 'plant'}
            bounceKey={waterKey + tapKey}
          >
            {!day.isRestDay && <WateringCan playKey={waterKey} />}
            <StageBurst playKey={burstKey} />
          </PlantScene>
          <button type="button" className="today__plant-tap" aria-label={t.today.tapPlant} onClick={handleTapPlant} />
          {special && <span className="today__badge">{t.today.specialBadge(tr(special.name))}</span>}
        </div>
        <div className="today__actions">
          <IconButton label={t.today.changePlantPot} icon={<PlantSwapIcon size={30} />} onClick={() => setSheet('plant')} />
          <IconButton label={t.today.note} icon={<NoteIcon size={30} />} onClick={() => setSheet('note')} badge={day.note.length > 0} />
          <IconButton
            label={day.isRestDay ? t.today.wakeUp : t.today.restDay}
            icon={day.isRestDay ? <SunIcon size={34} /> : <SleepSeedIcon size={38} />}
            pressed={day.isRestDay}
            onClick={() => run(setRestDay(deps, day.date, !day.isRestDay))}
          />
          <IconButton label={t.today.reminders} icon={<BellIcon size={30} />} onClick={() => setShowReminders(true)} />
        </div>
      </SkyBackground>

      <div className="today__list card">
        {showReminder && (
          <button type="button" className="reminder" onClick={() => nav('settings')}>
            {t.today.backupReminder}
          </button>
        )}
        {error && <p role="alert" className="error" onClick={() => setError(null)}>{error}</p>}
        {day.isRestDay ? (
          <div className="rest" data-testid="rest-message">
            <p className="rest__title">{t.today.restTitle}</p>
            <p className="muted">{t.today.restText}</p>
          </div>
        ) : (
          <>
            <header className="today__head">
              <h1 className="screen__title">{t.today.title}</h1>
              <span className="pill">{t.today.taskCount(doneCount, day.todos.length)}</span>
            </header>
            <GoalInput
              value={day.title ?? ''}
              label={t.today.goalLabel}
              placeholder={t.today.goalPlaceholder}
              onSave={(goal) => run(setTitle(deps, day.date, goal))}
            />
            <HabitStrip
              key={day.date}
              date={day.date}
              isRestDay={day.isRestDay}
              onChecked={() => setCelebrating(true)}
              onManage={(mode) => {
                requestHabitManager(mode, 'today');
                run(setSetting(deps.db, 'gardenView', 'habits'));
                nav('garden');
              }}
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

      <PlantPotSheet
        open={sheet === 'plant'}
        day={day}
        onClose={() => setSheet(null)}
        onPickPlant={(id, specialId, styleId) => { run(changePlant(deps, day.date, id, specialId, styleId)); setSheet(null); }}
        onPickPot={(id) => { run(changePot(deps, day.date, id)); setSheet(null); }}
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

/** Khung mừng dáng mới mở khoá (~5 giây); mở nhiều dáng cùng lúc thì hiện dáng đầu kèm +N. */
function StyleUnlock({ keys, below }: { keys: string[]; below: boolean }) {
  const { t, tr } = useI18n();
  const [plantId, styleId] = keys[0].split('|');
  const species = getSpecies(plantId);
  return (
    <div className={`special-intro style-unlock${below ? ' style-unlock--below' : ''}`} data-testid="style-unlock" role="status">
      <span className="special-intro__sparkles" aria-hidden="true">🔓 ✨ 🔓</span>
      {t.today.styleUnlocked(tr(species.name), tr(getStyle(species, styleId)!.name))}{keys.length > 1 ? ` +${keys.length - 1}` : ''}
      <span className="style-unlock__hint">{t.today.styleUnlockedHint}</span>
    </div>
  );
}
