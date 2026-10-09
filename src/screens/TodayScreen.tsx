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
import { BUGS, bugVisitKind, getBug, type BugVisitKind } from '../content/bugs';
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
import { dayBugId, ensureDayBug, listHabits, perfectHabitDays } from '../domain/habitService';
import { addDays } from '../domain/dayKey';
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
  // làm đủ mọi thói quen hôm nay → côn trùng ghé cây. Con được bốc một lần rồi lưu (`ensureDayBug`, tỉ lệ con hiếm
  // tăng theo chuỗi ngày làm đủ); bỏ tick thì ẩn, tick lại hiện đúng con cũ. `seen`: các loài đã ghé những ngày trước.
  const dayDate = day?.date;
  const bugToday = useLiveQuery(async () => {
    if (!dayDate) return undefined;
    const perfect = (await perfectHabitDays(deps, dayDate, dayDate)).has(dayDate);
    const record = await deps.db.days.get(dayDate);
    const habits = await listHabits(deps.db);
    const first = habits.reduce<string | null>((m, h) => (m === null || h.startDate < m ? h.startDate : m), null);
    const seen = new Set<string>();
    if (first !== null && first < dayDate) {
      const before = await perfectHabitDays(deps, first, addDays(dayDate, -1));
      const records = await deps.db.days.where('date').between(first, dayDate, true, false).toArray();
      const byDate = new Map(records.map((r) => [r.date, r]));
      for (const d of before) {
        const id = dayBugId(byDate.get(d), d, dayDate, BUGS);
        if (id) seen.add(id);
      }
    }
    return { date: dayDate, perfect, bugId: record?.bugId ?? null, seen };
  }, [deps, dayDate]);
  const shownBug = bugToday?.perfect ? bugToday.bugId : null;
  // vừa làm đủ mà chưa có con → bốc ngay (cả khi làm đủ nhờ dừng thói quen ở màn khác)
  useEffect(() => {
    if (bugToday?.perfect && !bugToday.bugId) ensureDayBug(deps, bugToday.date, BUGS).catch(() => {});
  }, [bugToday, deps]);
  /** khung báo khi côn trùng vừa ghé trong lúc màn đang mở (lần nạp đầu không tính) */
  const seenShown = useRef<{ date: string; bugId: string | null } | null>(null);
  const [bugVisit, setBugVisit] = useState<{ kind: BugVisitKind; bugId: string } | null>(null);
  useEffect(() => {
    if (!bugToday) return;
    const prev = seenShown.current;
    if (prev && prev.date === bugToday.date && !prev.bugId && shownBug) {
      const kind = bugVisitKind(getBug(shownBug)!, bugToday.seen.has(shownBug));
      if (kind) setBugVisit({ kind, bugId: shownBug });
    }
    if (!shownBug) setBugVisit(null);
    seenShown.current = { date: bugToday.date, bugId: shownBug };
  }, [bugToday, shownBug]);
  useEffect(() => {
    if (!bugVisit) return;
    const t = setTimeout(() => setBugVisit(null), 5000);
    return () => clearTimeout(t);
  }, [bugVisit]);
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
  // khung báo côn trùng nằm đúng chỗ bong bóng (để không che cây và chính con côn trùng): tạm ẩn bong bóng ~5 giây
  const said: { text: string; kind: SpeechKind } | null = editingSpeech ? daily : bugVisit ? null : speech ?? daily;
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
          {bugVisit && !newStyles.length && <BugVisit kind={bugVisit.kind} bugId={bugVisit.bugId} below={intro && !!special} />}
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
            bugId={shownBug}
            bugEntrance
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

/** Khung báo côn trùng vừa ghé (~5 giây): loài mới gặp lần đầu, hoặc con hiếm / rất hiếm. */
function BugVisit({ kind, bugId, below }: { kind: BugVisitKind; bugId: string; below: boolean }) {
  const { t, tr } = useI18n();
  const bug = getBug(bugId)!;
  const name = tr(bug.name);
  const text = kind === 'new'
    ? t.today.bugVisit.new(name, bug.rarity === 'common' ? null : t.bugs.rarity[bug.rarity])
    : t.today.bugVisit[kind](name);
  const deco = bug.rarity === 'epic' ? '🌟 ✨ 🌟' : bug.rarity === 'rare' ? '✨ 💜 ✨' : '🎉 ✨ 🎉';
  return (
    <div
      className={`special-intro style-unlock bug-visit bug-visit--${bug.rarity}${below ? ' style-unlock--below' : ''}`}
      data-testid="bug-visit" data-kind={kind} role="status"
    >
      <span className="special-intro__sparkles" aria-hidden="true">{deco}</span>
      {text}
      {kind === 'new' && <span className="style-unlock__hint">{t.today.bugVisit.hint}</span>}
    </div>
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
