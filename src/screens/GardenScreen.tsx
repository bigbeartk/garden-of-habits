import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBackHandler } from '../app/back';
import { useDeps } from '../app/deps';
import { type HabitManagerMode, peekHabitManagerRequest, takeHabitManagerRequest } from '../app/habitIntent';
import { useNav } from '../app/nav';
import { BackButton } from '../components/BackButton';
import { HabitReport } from '../components/HabitReport';
import { HabitsIcon, OptionsIcon } from '../components/icons';
import { PlantScene } from '../components/PlantScene';
import { PLANTS, getSpecies } from '../content/plants/registry';
import { DEFAULT_POT_ID } from '../content/pots/registry';
import { getSpecial } from '../content/specials/registry';
import { firstDayKey, listDaysInRange } from '../db/queries';
import { getSetting, setSetting } from '../db/settings';
import { SettingSwitch } from '../components/SettingSwitch';
import { addDays, dayKey } from '../domain/dayKey';
import { gardenReport } from '../domain/garden';
import type { GardenView } from '../domain/types';
import { useNow } from '../hooks/useNow';
import { useI18n } from '../i18n/I18nProvider';
import { HabitsScreen } from './HabitsScreen';
import './garden.css';

const PLANT_IDS = PLANTS.map((p) => p.id);

/**
 * Báo cáo "Khu vườn": chọn từ ngày tới ngày, mỗi loài cây đứng trong vườn cỏ (dạng ra hoa, chậu mặc định)
 * với số ngày được chọn ở bên dưới. Loài chưa trồng ngày nào hiện mờ.
 */
export function GardenScreen() {
  const { t, tr } = useI18n();
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

  /** null = đang đọc setting (chưa vẽ thân màn, khỏi nháy màn Cây khi đã lưu Thói quen) */
  const savedView = useLiveQuery(async (): Promise<GardenView | null> => (await getSetting(deps.db, 'gardenView')) ?? 'plants', [deps.db], null);
  /** giữ cục bộ để đổi ngay, không chờ đọc lại DB */
  const [viewLocal, setViewLocal] = useState<GardenView | null>(null);
  // peek trong initializer (StrictMode gọi hai lần), xoá cờ trong effect lúc mount
  const [managing, setManaging] = useState<false | HabitManagerMode>(() => peekHabitManagerRequest());
  useEffect(() => { takeHabitManagerRequest(); }, []);
  useBackHandler(managing !== false, () => setManaging(false), 'screen');
  const view: GardenView | null = managing ? 'habits' : viewLocal ?? savedView;

  function pickView(v: GardenView) {
    setViewLocal(v);
    setSetting(deps.db, 'gardenView', v).catch(() => {});
  }

  const preset = (start: string) => {
    setFrom(start);
    setTo(todayKey);
  };

  if (managing) {
    return <HabitsScreen startAdding={managing === 'add'} onBack={() => { setViewLocal('habits'); setManaging(false); }} />;
  }

  return (
    <section className="screen screen--garden" data-testid="garden">
      <header className="garden__head">
        <BackButton inline onClick={() => nav('calendar')} />
        <h1 className="screen__title">{t.garden.title}</h1>
        {view === 'plants' ? (
          <button
            type="button"
            className="icon-btn garden__options-btn"
            aria-label={t.garden.options}
            title={t.garden.options}
            aria-expanded={optionsOpen}
            aria-controls="garden-options"
            onClick={() => setOptionsOpen((o) => !o)}
          >
            <OptionsIcon size={24} />
            {/* đang lọc mà công tắc đang ẩn thì báo bằng chấm nhỏ */}
            {!optionsOpen && (onlyPlanted || separateSpecial) && <span className="icon-btn__badge" aria-hidden="true" />}
          </button>
        ) : view === 'habits' ? (
          <button type="button" className="icon-btn garden__options-btn" aria-label={t.habits.manage} title={t.habits.manage} onClick={() => setManaging('list')}>
            <HabitsIcon size={24} />
          </button>
        ) : null}
      </header>

      <div role="tablist" aria-label={t.habits.viewsLabel} className="garden__views">
        {(['plants', 'habits'] as const).map((v) => (
          <button key={v} type="button" role="tab" aria-selected={view === v} className={`garden__view${view === v ? ' is-on' : ''}`} onClick={() => pickView(v)}>
            {t.habits.views[v]}
          </button>
        ))}
      </div>
      {view === null ? null : view === 'habits' ? (
        <HabitReport onManage={() => setManaging('add')} />
      ) : (
        <>
          <div className="garden__range card">
            <div className="garden__dates">
              <label className="garden__date">
                <span>{t.garden.from}</span>
                <input className="input" type="date" value={from} max={todayKey} onChange={(e) => e.target.value && setFrom(e.target.value)} />
              </label>
              <label className="garden__date">
                <span>{t.garden.to}</span>
                <input className="input" type="date" value={to} max={todayKey} onChange={(e) => e.target.value && setTo(e.target.value)} />
              </label>
            </div>
            <div className="garden__presets">
              <button type="button" className="garden__preset" onClick={() => preset(monthStart)}>{t.garden.thisMonth}</button>
              <button type="button" className="garden__preset" onClick={() => preset(addDays(todayKey, -29))}>{t.garden.last30}</button>
              <button type="button" className="garden__preset" onClick={() => preset(firstKey ?? todayKey)}>{t.garden.all}</button>
            </div>
            {optionsOpen && (
              <div id="garden-options" className="garden__options">
                <SettingSwitch settingKey="gardenOnlyPlanted" label={t.garden.onlyPlanted} defaultOn={false} onError={() => {}} />
                <SettingSwitch settingKey="gardenSeparateSpecial" label={t.garden.separateSpecial} defaultOn={false} onError={() => {}} />
              </div>
            )}
          </div>

          <p className="garden__summary" data-testid="garden-summary">
            <b>{report.days}</b> {t.garden.days(report.days)} · <b>{report.bloomDays}</b> {t.garden.blooms(report.bloomDays)} · <b>{report.todosDone}</b> {t.garden.tasks(report.todosDone)} · ✨ <b>{report.specialDays}</b> {t.garden.specials(report.specialDays)}
          </p>

          {nothing && <p className="garden__empty">{t.garden.empty}</p>}
          <ul className="garden__beds">
            {beds.map((bed) => {
              if (bed.kind === 'wilted') return <SpecialBed key="wilted" testId="garden-wilted" mode="wilted" label={t.garden.wilted} count={bed.count} />;
              if (bed.kind === 'rest') return <SpecialBed key="rest" testId="garden-rest" mode="sleeping" label={t.garden.rest} count={bed.count} />;
              if (bed.kind === 'special') {
                const { plantId, specialId, count } = bed;
                const species = getSpecies(plantId);
                const special = getSpecial(specialId);
                return (
                  <li key={`${plantId}-${specialId}`} className="garden__bed garden__bed--special" data-testid={`garden-special-${plantId}-${specialId}`}>
                    <PlantScene className="garden__plant" plantId={plantId} potId={species.defaultPotId} stage="bloom" specialId={specialId} mood="smile" />
                    <span className="garden__name">{special ? `${tr(species.name)} · ${tr(special.name)}` : tr(species.name)}</span>
                    <span className="garden__tally">
                      <span className="garden__count">{count}</span> {t.garden.days(count)}
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
                  <span className="garden__name">{tr(species.name)}</span>
                  <span className="garden__tally">
                    <span className="garden__count">{count}</span> {t.garden.days(count)}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

/** Luống riêng cho ngày bỏ lỡ (cây héo) và ngày tiết kiệm năng lượng (hạt giống ngủ), đứng sau các cây thật cùng nhóm. */
function SpecialBed({ testId, mode, label, count }: { testId: string; mode: 'wilted' | 'sleeping'; label: string; count: number }) {
  const { t } = useI18n();
  return (
    <li className={`garden__bed garden__bed--${mode}${count === 0 ? ' is-empty' : ''}`} data-testid={testId}>
      <PlantScene className="garden__plant" plantId={PLANT_IDS[0]} potId={DEFAULT_POT_ID} stage="seed" specialId={null} mood="sleep" mode={mode} title={label} />
      <span className="garden__name">{label}</span>
      <span className="garden__tally">
        <span className="garden__count">{count}</span> {t.garden.days(count)}
      </span>
    </li>
  );
}
