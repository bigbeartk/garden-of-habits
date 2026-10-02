import { BottomSheet } from './BottomSheet';
import { PlantScene } from './PlantScene';
import { PLANTS } from '../content/plants/registry';

export function PlantPickerSheet({ open, currentId, onClose, onPick }: { open: boolean; currentId: string; onClose: () => void; onPick: (id: string) => void }) {
  return (
    <BottomSheet open={open} title="Chọn cây hôm nay" onClose={onClose}>
      <div className="picker">
        {PLANTS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`picker__item${p.id === currentId ? ' is-selected' : ''}`}
            aria-label={p.name}
            aria-pressed={p.id === currentId}
            onClick={() => onPick(p.id)}
          >
            <PlantScene className="picker__scene" testId="picker-scene" plantId={p.id} potId={p.defaultPotId} stage="bloom" specialId={null} mood="smile" />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
