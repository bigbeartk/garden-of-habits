import { BottomSheet } from './BottomSheet';
import { PlantScene } from './PlantScene';
import { POTS } from '../content/pots/registry';
import type { DayRecord } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

export function PotPickerSheet({ open, day, onClose, onPick }: { open: boolean; day: DayRecord; onClose: () => void; onPick: (id: string) => void }) {
  const { t, tr } = useI18n();
  return (
    <BottomSheet open={open} title={t.picker.choosePot} onClose={onClose}>
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
    </BottomSheet>
  );
}
