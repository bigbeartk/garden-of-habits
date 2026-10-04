import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { useNav } from '../app/nav';
import { BackButton } from '../components/BackButton';
import { OptionsIcon } from '../components/icons';
import { PlantScene } from '../components/PlantScene';
import { PLANTS, getSpecies } from '../content/plants/registry';
import { DEFAULT_POT_ID } from '../content/pots/registry';
import { getSpecial } from '../content/specials/registry';
import { firstDayKey, listDaysInRange } from '../db/queries';
import { getSetting } from '../db/settings';
import { SettingSwitch } from '../components/SettingSwitch';
import { addDays, dayKey } from '../domain/dayKey';
import { gardenReport } from '../domain/garden';
import { useNow } from '../hooks/useNow';
import './garden.css';

const PLANT_IDS = PLANTS.map((p) => p.id);

/**
 * Báo cáo "Khu vườn": chọn từ ngày tới ngày, mỗi loài cây đứng trong vườn cỏ (dạng ra hoa, chậu mặc định)
 * với số ngày được chọn ở bên dưới. Loài chưa trồng ngày nào hiện mờ.
 */
export function GardenScreen() {
  const deps = useDeps();
  const nav = useNav();
  const todayKey = dayKey(useNow());
  const monthStart = `${todayKey.slice(0, 8)}01`;
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(todayKey);
  /** 2 công tắc lọc thu gọn mặc định, để dành chỗ ngắm vườn */
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [lo, hi] = from <= to ? [from, to] : [to, from];
  const records = useLiveQuery(() => listDaysInRange(deps.db, lo, hi), [deps.db, lo, hi]);
  const firstKey = useLiveQuery(() => firstDayKey(deps.db), [deps.db]) ?? null;
  const onlyPlanted = useLiveQuery(async () => (await getSetting(deps.db, 'gardenOnlyPlanted')) ?? false, [deps.db], false);
  const separateSpecial = useLiveQuery(async () => (await getSetting(deps.db, 'gardenSeparateSpecial')) ?? false, [deps.db], false);
  const report = gardenReport(records ?? [], PLANT_IDS, lo, hi, { todayKey, firstKey, separateSpecial });
  // luống > 0 ngày đứng trên; bật "Chỉ hiện cây đã trồng" thì bỏ mọi luống 0 ngày (kể cả Cây héo / Ngày nghỉ)
  const beds = onlyPlanted ? report.beds.filter((b) => b.count > 0) : report.beds;
  const nothing = beds.length === 0;

  const preset = (start: string) => {
    setFrom(start);
    setTo(todayKey);
  };

  return (
    <section className="screen screen--garden" data-testid="garden">
      <header className="garden__head">
        <BackButton inline onClick={() => nav('calendar')} />
        <h1 className="screen__title">Khu vườn</h1>
        <button
          type="button"
          className="icon-btn garden__options-btn"
          aria-label="Tuỳ chọn hiển thị"
          title="Tuỳ chọn hiển thị"
          aria-expanded={optionsOpen}
          aria-controls="garden-options"
          onClick={() => setOptionsOpen((o) => !o)}
        >
          <OptionsIcon size={24} />
          {/* đang lọc mà công tắc đang ẩn thì báo bằng chấm nhỏ */}
          {!optionsOpen && (onlyPlanted || separateSpecial) && <span className="icon-btn__badge" aria-hidden="true" />}
        </button>
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
        {optionsOpen && (
          <div id="garden-options" className="garden__options">
            <SettingSwitch settingKey="gardenOnlyPlanted" label="Chỉ hiện cây đã trồng" defaultOn={false} onError={() => {}} />
            <SettingSwitch settingKey="gardenSeparateSpecial" label="Tách riêng cây đặc biệt" defaultOn={false} onError={() => {}} />
          </div>
        )}
      </div>

      <p className="garden__summary" data-testid="garden-summary">
        <b>{report.days}</b> ngày · <b>{report.bloomDays}</b> ra hoa · <b>{report.todosDone}</b> việc · ✨ <b>{report.specialDays}</b> đặc biệt
      </p>

      {nothing && <p className="garden__empty">Chưa có cây nào trong khoảng này</p>}
      <ul className="garden__beds">
        {beds.map((bed) => {
          if (bed.kind === 'wilted') return <SpecialBed key="wilted" testId="garden-wilted" mode="wilted" label="Cây héo" count={bed.count} />;
          if (bed.kind === 'rest') return <SpecialBed key="rest" testId="garden-rest" mode="sleeping" label="Ngày nghỉ" count={bed.count} />;
          if (bed.kind === 'special') {
            const { plantId, specialId, count } = bed;
            const species = getSpecies(plantId);
            const special = getSpecial(specialId);
            return (
              <li key={`${plantId}-${specialId}`} className="garden__bed garden__bed--special" data-testid={`garden-special-${plantId}-${specialId}`}>
                <PlantScene className="garden__plant" plantId={plantId} potId={species.defaultPotId} stage="bloom" specialId={specialId} mood="smile" />
                <span className="garden__name">{special ? `${species.name} · ${special.name}` : species.name}</span>
                <span className="garden__tally">
                  <span className="garden__count">{count}</span> ngày
                </span>
              </li>
            );
          }
          const { plantId, count } = bed;
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

/** Luống riêng cho ngày bỏ lỡ (cây héo) và ngày tiết kiệm năng lượng (hạt giống ngủ), đứng sau các cây thật cùng nhóm. */
function SpecialBed({ testId, mode, label, count }: { testId: string; mode: 'wilted' | 'sleeping'; label: string; count: number }) {
  return (
    <li className={`garden__bed garden__bed--${mode}${count === 0 ? ' is-empty' : ''}`} data-testid={testId}>
      <PlantScene className="garden__plant" plantId={PLANT_IDS[0]} potId={DEFAULT_POT_ID} stage="seed" specialId={null} mood="sleep" mode={mode} title={label} />
      <span className="garden__name">{label}</span>
      <span className="garden__tally">
        <span className="garden__count">{count}</span> ngày
      </span>
    </li>
  );
}
