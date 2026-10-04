import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { BackButton } from '../components/BackButton';
import { PlantScene } from '../components/PlantScene';
import { PLANTS, getSpecies } from '../content/plants/registry';
import { firstDayKey, listDaysInRange } from '../db/queries';
import { addDays, dayKey } from '../domain/dayKey';
import { gardenReport } from '../domain/garden';
import { useNow } from '../hooks/useNow';
import './garden.css';

const PLANT_IDS = PLANTS.map((p) => p.id);

/**
 * Báo cáo "Khu vườn": chọn từ ngày tới ngày, mỗi loài cây đứng trong vườn cỏ (dạng ra hoa, chậu mặc định)
 * với số ngày được chọn ở bên dưới. Loài chưa trồng ngày nào hiện mờ.
 */
export function GardenScreen({ onBack }: { onBack: () => void }) {
  const deps = useDeps();
  const todayKey = dayKey(useNow());
  const monthStart = `${todayKey.slice(0, 8)}01`;
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(todayKey);
  const [lo, hi] = from <= to ? [from, to] : [to, from];
  const records = useLiveQuery(() => listDaysInRange(deps.db, lo, hi), [deps.db, lo, hi]);
  const firstKey = useLiveQuery(() => firstDayKey(deps.db), [deps.db]) ?? null;
  const report = gardenReport(records ?? [], PLANT_IDS, lo, hi);

  const preset = (start: string) => {
    setFrom(start);
    setTo(todayKey);
  };

  return (
    <section className="screen screen--garden" data-testid="garden">
      <header className="garden__head">
        <BackButton inline onClick={onBack} />
        <h1 className="screen__title">Khu vườn</h1>
      </header>

      <div className="garden__range card">
        <div className="garden__dates">
          <label className="garden__date">
            <span>Từ ngày</span>
            <input className="input" type="date" value={from} max={todayKey} onChange={(e) => e.target.value && setFrom(e.target.value)} />
          </label>
          <label className="garden__date">
            <span>Đến ngày</span>
            <input className="input" type="date" value={to} max={todayKey} onChange={(e) => e.target.value && setTo(e.target.value)} />
          </label>
        </div>
        <div className="garden__presets">
          <button type="button" className="garden__preset" onClick={() => preset(monthStart)}>Tháng này</button>
          <button type="button" className="garden__preset" onClick={() => preset(addDays(todayKey, -29))}>30 ngày</button>
          <button type="button" className="garden__preset" onClick={() => preset(firstKey ?? todayKey)}>Tất cả</button>
        </div>
      </div>

      <p className="garden__summary" data-testid="garden-summary">
        <b>{report.days}</b> ngày · <b>{report.bloomDays}</b> ngày ra hoa · <b>{report.todosDone}</b> việc xong
      </p>

      <ul className="garden__beds">
        {report.entries.map(({ plantId, count }) => {
          const species = getSpecies(plantId);
          return (
            <li key={plantId} className={`garden__bed${count === 0 ? ' is-empty' : ''}`} data-testid={`garden-plant-${plantId}`}>
              <PlantScene
                className="garden__plant"
                plantId={plantId}
                potId={species.defaultPotId}
                stage="bloom"
                specialId={null}
                mood={count > 0 ? 'smile' : 'sleep'}
              />
              <span className="garden__name">{species.name}</span>
              <span className="garden__tally">
                <span className="garden__count">{count}</span> ngày
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
