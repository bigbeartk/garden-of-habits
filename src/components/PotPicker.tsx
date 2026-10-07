import { PlantScene } from './PlantScene';
import { POTS } from '../content/pots/registry';
import type { DayRecord } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

/** Tab Chậu của bảng Đổi cây & chậu: cây hôm nay (đúng giai đoạn, dáng) trong từng chậu. */
export function PotPicker({ day, onPick }: { day: DayRecord; onPick: (id: string) => void }) {
  const { tr } = useI18n();
  return (
    <div className="picker">
      {POTS.map((pot) => (
        <button
          key={pot.id}
          type="button"
          className={`picker__item${pot.id === day.potId ? ' is-selected' : ''}`}
          aria-label={tr(pot.name)}
          aria-pressed={pot.id === day.potId}
          onClick={() => onPick(pot.id)}
        >
          <PlantScene className="picker__scene" testId="picker-scene" plantId={day.plantId} potId={pot.id} stage={day.finalStage} specialId={null} styleId={day.styleId} mood="normal" />
          <span>{tr(pot.name)}</span>
        </button>
      ))}
    </div>
  );
}
