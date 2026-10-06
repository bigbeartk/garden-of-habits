import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { GoalInput } from '../components/GoalInput';
import { BackButton } from '../components/BackButton';
import { PlannedList } from '../components/PlannedList';
import { PlantScene } from '../components/PlantScene';
import { SkyBackground } from '../components/SkyBackground';
import { SpeechBubble } from '../components/SpeechBubble';
import { DEFAULT_POT_ID } from '../content/pots/registry';
import { addPlanned, deletePlanned, editPlanned, getPlannedGoal, listPlanned, setPlannedGoal } from '../domain/plannedService';
import { timeOfDay } from '../domain/timeOfDay';
import { useNow } from '../hooks/useNow';
import { useI18n } from '../i18n/I18nProvider';
import { longDate, weekdayName } from '../i18n/fmt';
import { errorText } from '../i18n/errors';
import './today.css';

/**
 * Màn của một ngày tương lai: bố cục giống Hôm nay (trời + chậu đứng yên, danh sách cuộn),
 * hạt giống bí ẩn đang ngủ vì cây chỉ được random lúc 4:00 ngày đó; nút ＋ ở mỗi buổi để lên lịch việc.
 */
export function FutureDayScreen({ date, onBack }: { date: string; onBack: () => void }) {
  const { t, lang } = useI18n();
  const deps = useDeps();
  const now = useNow();
  const items = useLiveQuery(() => listPlanned(deps.db, date), [deps.db, date]) ?? [];
  const goal = useLiveQuery(() => getPlannedGoal(deps.db, date), [deps.db, date]) ?? '';
  const [error, setError] = useState<string | null>(null);
  const label = longDate(lang, date);
  const weekday = weekdayName(lang, date);

  const run = (p: Promise<unknown>) => {
    p.then(() => setError(null)).catch((e: Error) => setError(errorText(e, t)));
  };

  return (
    <section className="screen screen--today screen--future" data-testid="future-day">
      <SkyBackground time={timeOfDay(now)}>
        <div className="today__stage">
          <BackButton onClick={onBack} />
          <SpeechBubble text={t.future.seeYou(weekday)} />
          <PlantScene
            className="today__plant"
            plantId=""
            potId={DEFAULT_POT_ID}
            stage="seed"
            specialId={null}
            mood="sleep"
            mode="sleeping"
            title={t.future.mysterySeed}
          />
        </div>
        <div className="future__spacer" />
      </SkyBackground>

      <div className="today__list card">
        {error && <p role="alert" className="error" onClick={() => setError(null)}>{error}</p>}
        <header className="today__head">
          <h1 className="screen__title future__title">{label}</h1>
          <span className="pill">{t.future.taskCount(items.length)}</span>
        </header>
        <GoalInput
          value={goal}
          label={t.future.goalLabel}
          placeholder={t.future.goalPlaceholder}
          onSave={(g) => run(setPlannedGoal(deps, date, g))}
        />
        <PlannedList
          items={items}
          onEdit={(id, text) => run(editPlanned(deps.db, id, text))}
          onDelete={(id) => run(deletePlanned(deps.db, id))}
          onAdd={(text, period) => run(addPlanned(deps, date, text, period))}
        />
      </div>
    </section>
  );
}
