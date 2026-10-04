import { useLiveQuery } from 'dexie-react-hooks';
import { BottomSheet } from './BottomSheet';
import { PlantScene } from './PlantScene';
import { useDeps } from '../app/deps';
import { PLANTS, getSpecies } from '../content/plants/registry';
import { getSpecial } from '../content/specials/registry';
import { listUnlockedSpecials } from '../domain/specialUnlocks';

interface Props {
  open: boolean;
  currentId: string;
  currentSpecialId: string | null;
  onClose: () => void;
  onPick: (plantId: string, specialId: string | null) => void;
}

/** Bảng Đổi cây: các loài thường, rồi các cây đặc biệt đã gặp (chọn lại được). */
export function PlantPickerSheet({ open, currentId, currentSpecialId, onClose, onPick }: Props) {
  const deps = useDeps();
  const unlocked = useLiveQuery(() => listUnlockedSpecials(deps), [deps]) ?? [];
  return (
    <BottomSheet open={open} title="Chọn cây hôm nay" onClose={onClose}>
      <div className="picker">
        {PLANTS.map((p) => {
          const selected = p.id === currentId && !currentSpecialId;
          return (
            <button
              key={p.id}
              type="button"
              className={`picker__item${selected ? ' is-selected' : ''}`}
              aria-label={p.name}
              aria-pressed={selected}
              onClick={() => onPick(p.id, null)}
            >
              <PlantScene className="picker__scene" testId="picker-scene" plantId={p.id} potId={p.defaultPotId} stage="bloom" specialId={null} mood="smile" />
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>
      <h3 className="picker__heading">✨ Cây đặc biệt đã gặp</h3>
      {unlocked.length === 0 ? (
        <p className="sheet__hint">Mỗi ngày có 10% cơ hội gặp cây đặc biệt — gặp rồi sẽ chọn lại được ở đây.</p>
      ) : (
        <div className="picker" data-testid="picker-specials">
          {unlocked.map(({ plantId, specialId }) => {
            const species = getSpecies(plantId);
            const effect = getSpecial(specialId)?.name ?? '';
            const name = `${species.name} · ${effect}`;
            const selected = plantId === currentId && specialId === currentSpecialId;
            return (
              <button
                key={`${plantId}-${specialId}`}
                type="button"
                className={`picker__item picker__item--special${selected ? ' is-selected' : ''}`}
                aria-label={name}
                aria-pressed={selected}
                onClick={() => onPick(plantId, specialId)}
              >
                <PlantScene className="picker__scene" testId="picker-scene" plantId={plantId} potId={species.defaultPotId} stage="bloom" specialId={specialId} mood="smile" />
                <span>{species.name}</span>
                <span className="picker__effect">{effect}</span>
              </button>
            );
          })}
        </div>
      )}
    </BottomSheet>
  );
}
