import { PlantScene } from './PlantScene';
import { DEFAULT_POT_ID } from '../content/pots/registry';
import type { CellStatus } from '../domain/calendar';
import type { DayRecord } from '../domain/types';

export function MiniPlant({ status, record }: { status: CellStatus; record?: DayRecord }) {
  if (status === 'plant' && record) {
    return (
      <PlantScene
        className="mini-plant"
        testId="mini-plant"
        plantId={record.plantId}
        potId={record.potId}
        stage={record.finalStage}
        specialId={record.specialId}
        styleId={record.styleId}
        mood={record.finalStage === 'bloom' ? 'smile' : 'normal'}
      />
    );
  }
  if (status === 'rest' && record) {
    return <PlantScene className="mini-plant" testId="mini-plant" plantId={record.plantId} potId={record.potId} stage="seed" specialId={null} mood="sleep" mode="sleeping" title="Ngủ ngon" />;
  }
  if (status === 'missed') {
    return <PlantScene className="mini-plant" testId="mini-plant" plantId="" potId={DEFAULT_POT_ID} stage="seed" specialId={null} mood="sad" mode="wilted" title="Cây héo" />;
  }
  return null;
}
