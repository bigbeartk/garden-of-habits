import { PlantScene } from './PlantScene';
import { DEFAULT_POT_ID } from '../content/pots/registry';
import type { CellStatus } from '../domain/calendar';
import type { DayRecord } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

export function MiniPlant({ status, record }: { status: CellStatus; record?: DayRecord }) {
  const { t } = useI18n();
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
    return <PlantScene className="mini-plant" testId="mini-plant" plantId={record.plantId} potId={record.potId} stage="seed" specialId={null} mood="sleep" mode="sleeping" title={t.mini.sleeping} />;
  }
  if (status === 'missed') {
    return <PlantScene className="mini-plant" testId="mini-plant" plantId="" potId={DEFAULT_POT_ID} stage="seed" specialId={null} mood="sad" mode="wilted" title={t.mini.wilted} />;
  }
  return null;
}
