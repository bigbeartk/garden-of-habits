import { BottomSheet } from './BottomSheet';
import { PlantScene } from './PlantScene';
import { POTS } from '../content/pots/registry';
import type { DayRecord } from '../domain/types';

export function PotPickerSheet({ open, day, onClose, onPick }: { open: boolean; day: DayRecord; onClose: () => void; onPick: (id: string) => void }) {
  return (
    <BottomSheet open={open} title="Chọn chậu" onClose={onClose}>
      <div className="picker">
        {POTS.map((pot) => (
          <button
            key={pot.id}
            type="button"
            className={`picker__item${pot.id === day.potId ? ' is-selected' : ''}`}
            aria-label={pot.name}
            aria-pressed={pot.id === day.potId}
            onClick={() => onPick(pot.id)}
          >
            <PlantScene className="picker__scene" testId="picker-scene" plantId={day.plantId} potId={pot.id} stage={day.finalStage} specialId={null} mood="normal" />
            <span>{pot.name}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
