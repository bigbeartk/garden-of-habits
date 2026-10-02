import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { AddTodoSheet } from '../components/AddTodoSheet';
import { PlannedList } from '../components/PlannedList';
import { PlantScene } from '../components/PlantScene';
import { SkyBackground } from '../components/SkyBackground';
import { SpeechBubble } from '../components/SpeechBubble';
import { DEFAULT_POT_ID } from '../content/pots/registry';
import { longDateLabel } from '../domain/calendar';
import { addPlanned, deletePlanned, editPlanned, listPlanned } from '../domain/plannedService';
import { timeOfDay } from '../domain/timeOfDay';
import { useNow } from '../hooks/useNow';
import './today.css';

/**
 * Màn của một ngày tương lai: bố cục giống Hôm nay (trời + chậu đứng yên, danh sách cuộn),
 * hạt giống bí ẩn đang ngủ vì cây chỉ được random lúc 4:00 ngày đó; nút ＋ lên lịch việc.
 */
export function FutureDayScreen({ date, onBack }: { date: string; onBack: () => void }) {
  const deps = useDeps();
  const now = useNow();
  const items = useLiveQuery(() => listPlanned(deps.db, date), [deps.db, date]) ?? [];
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = longDateLabel(date);
  const weekday = label.split(',')[0];

  const run = (p: Promise<unknown>) => {
    p.then(() => setError(null)).catch((e: Error) => setError(e.message));
  };

  return (
    <section className="screen screen--today screen--future" data-testid="future-day">
      <SkyBackground time={timeOfDay(now)}>
        <div className="today__stage">
          <button type="button" className="future__back" aria-label="Quay lại Lịch" onClick={onBack}>
            <span aria-hidden="true">‹</span> Lịch
          </button>
          <SpeechBubble text={`Hẹn gặp bạn vào ${weekday} nha! 🌱`} />
          <PlantScene
            className="today__plant"
            plantId=""
            potId={DEFAULT_POT_ID}
            stage="seed"
            specialId={null}
            mood="sleep"
            mode="sleeping"
            title="Hạt giống bí ẩn"
          />
        </div>
        <div className="future__spacer" />
      </SkyBackground>

      <div className="today__list card">
        {error && <p role="alert" className="error" onClick={() => setError(null)}>{error}</p>}
        <header className="today__head">
          <h1 className="screen__title future__title">{label}</h1>
          <span className="pill">{items.length} việc</span>
        </header>
        <PlannedList
          items={items}
          onEdit={(id, text) => run(editPlanned(deps.db, id, text))}
          onDelete={(id) => run(deletePlanned(deps.db, id))}
        />
      </div>

      <button type="button" className="fab" aria-label="Thêm việc mới" onClick={() => setAdding(true)}>
        <span aria-hidden="true">＋</span>
      </button>
      <AddTodoSheet
        open={adding}
        defaultPeriod="morning"
        onClose={() => setAdding(false)}
        onAdd={(text, period) => run(addPlanned(deps, date, text, period))}
      />
    </section>
  );
}
